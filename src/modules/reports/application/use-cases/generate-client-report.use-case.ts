import { AuditAction } from '../../domain/enums';
import {
  AuditLogRepository,
  ReportsAnalysisLookupRepository,
  ReportsClientsLookupRepository,
} from '../../domain/repositories';
import { GenerateClientReportCommand, ReportPreviewResult } from '../dto/reports.commands';
import { NotFoundError, ValidationError } from '../errors';
import { ClientReportOrchestratorService } from '../services/client-report-orchestrator.service';
import { ClientReportOwnershipService } from '../services/client-report-ownership.service';
import { ClientReportReplacementService } from '../services/client-report-replacement.service';

export class GenerateClientReportUseCase {
  constructor(
    private readonly clientsLookupRepo: ReportsClientsLookupRepository,
    private readonly analysisLookupRepo: ReportsAnalysisLookupRepository,
    private readonly ownershipService: ClientReportOwnershipService,
    private readonly orchestratorService: ClientReportOrchestratorService,
    private readonly replacementService: ClientReportReplacementService,
    private readonly auditRepo: AuditLogRepository
  ) {}

  async execute(command: GenerateClientReportCommand): Promise<ReportPreviewResult> {
    const startedAt = Date.now();
    this.ownershipService.assertActorIdentity(command.actorUserId, command.actorUserRole);
    this.ownershipService.assertCanGenerateReport(command.actorUserRole);

    const client = await this.clientsLookupRepo.findClientForReport(command.clientId);
    if (!client) {
      throw new NotFoundError('Client not found');
    }

    this.ownershipService.assertCanAccessClient(
      command.actorUserRole,
      command.actorUserId,
      client.ownerUserId
    );

    const hasSavedAnalysis = await this.analysisLookupRepo.hasSavedAnalysis(command.clientId);
    if (!hasSavedAnalysis) {
      throw new ValidationError('Cannot generate report because this client has no saved analysis');
    }

    const orchestration = await this.orchestratorService.execute(command.clientId);
    const replacement = await this.replacementService.replaceForClient({
      clientId: command.clientId,
      analysisId: orchestration.payload.analysis.id,
      ownerUserId: client.ownerUserId,
      templateKey: orchestration.template.templateKey,
      pdf: orchestration.pdf,
      fileName: orchestration.fileName,
    });
    console.info(
      `[REPORTS] generate_done client=${command.clientId} report=${replacement.report.id} elapsed_ms=${Date.now() - startedAt} pdf_bytes=${orchestration.pdf.data.length}`
    );

    await this.safeAudit({
      actorUserId: command.actorUserId,
      action: replacement.replaced ? AuditAction.ClientReportRegenerated : AuditAction.ClientReportGenerated,
      entityType: 'client_report',
      entityId: replacement.report.id,
      metadata: {
        reportId: replacement.report.id,
        clientId: command.clientId,
        analysisId: orchestration.payload.analysis.id,
        ownerUserId: client.ownerUserId,
        replaced: replacement.replaced,
      },
    });

    return {
      report: replacement.report,
      payload: orchestration.payload,
      resolvedPdfUrl: replacement.report.pdfUrl,
    };
  }

  private async safeAudit(entry: Parameters<AuditLogRepository['createAuditLog']>[0]): Promise<void> {
    try {
      await this.auditRepo.createAuditLog(entry);
    } catch {
      // Audit persistence is non-blocking.
    }
  }
}
