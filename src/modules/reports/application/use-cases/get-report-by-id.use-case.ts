import { AuditAction } from '../../domain/enums';
import {
  AuditLogRepository,
  ClientReportRepository,
  ReportPdfStorageProviderContract,
  ReportsClientsLookupRepository,
} from '../../domain/repositories';
import { GetReportByIdQuery, ReportPreviewResult } from '../dto/reports.commands';
import { NotFoundError } from '../errors';
import { ClientReportOwnershipService } from '../services/client-report-ownership.service';
import { ReportRenderPayloadBuilderService } from '../services/report-render-payload-builder.service';

export class GetReportByIdUseCase {
  constructor(
    private readonly reportRepo: ClientReportRepository,
    private readonly clientsLookupRepo: ReportsClientsLookupRepository,
    private readonly payloadBuilder: ReportRenderPayloadBuilderService,
    private readonly ownershipService: ClientReportOwnershipService,
    private readonly pdfStorageProvider: ReportPdfStorageProviderContract,
    private readonly auditRepo: AuditLogRepository
  ) {}

  async execute(query: GetReportByIdQuery): Promise<ReportPreviewResult | null> {
    this.ownershipService.assertActorIdentity(query.actorUserId, query.actorUserRole);
    this.ownershipService.assertCanReadReport(query.actorUserRole);

    const report = await this.reportRepo.findById(query.reportId);
    if (!report) {
      return null;
    }

    const client = await this.clientsLookupRepo.findClientForReport(report.clientId);
    if (!client) {
      throw new NotFoundError('Client not found for report');
    }

    this.ownershipService.assertCanAccessClient(
      query.actorUserRole,
      query.actorUserId,
      client.ownerUserId
    );

    const payload = await this.payloadBuilder.buildForClient(report.clientId);
    const resolvedPdfUrl = await this.resolvePdfUrl(report.pdfPath, report.pdfUrl);

    await this.safeAudit({
      actorUserId: query.actorUserId,
      action: AuditAction.ClientReportDownloaded,
      entityType: 'client_report',
      entityId: report.id,
      metadata: {
        reportId: report.id,
        clientId: report.clientId,
        actorRole: query.actorUserRole,
      },
    });

    return {
      report,
      payload,
      resolvedPdfUrl,
    };
  }

  private async resolvePdfUrl(pdfPath: string | null, fallbackUrl: string | null): Promise<string | null> {
    if (!pdfPath) {
      return fallbackUrl;
    }

    try {
      return await this.pdfStorageProvider.getAccessibleUrl(pdfPath);
    } catch {
      return fallbackUrl;
    }
  }

  private async safeAudit(entry: Parameters<AuditLogRepository['createAuditLog']>[0]): Promise<void> {
    try {
      await this.auditRepo.createAuditLog(entry);
    } catch {
      // Audit persistence is non-blocking.
    }
  }
}
