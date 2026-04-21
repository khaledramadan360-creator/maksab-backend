import { AuditAction } from '../../domain/enums';
import {
  AuditLogRepository,
  ClientReportRepository,
  ReportPdfStorageProviderContract,
} from '../../domain/repositories';
import { DeleteClientReportCommand } from '../dto/reports.commands';
import { NotFoundError } from '../errors';
import { ClientReportOwnershipService } from '../services/client-report-ownership.service';

export class DeleteClientReportUseCase {
  constructor(
    private readonly reportRepo: ClientReportRepository,
    private readonly pdfStorageProvider: ReportPdfStorageProviderContract,
    private readonly ownershipService: ClientReportOwnershipService,
    private readonly auditRepo: AuditLogRepository
  ) {}

  async execute(command: DeleteClientReportCommand): Promise<void> {
    this.ownershipService.assertActorIdentity(command.actorUserId, command.actorUserRole);
    this.ownershipService.assertCanDeleteReport(command.actorUserRole);

    const report = await this.reportRepo.findById(command.reportId);
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.pdfPath) {
      await this.safeDeletePdf(report.pdfPath);
    }

    await this.reportRepo.deleteById(report.id);

    await this.safeAudit({
      actorUserId: command.actorUserId,
      action: AuditAction.ClientReportDeleted,
      entityType: 'client_report',
      entityId: report.id,
      metadata: {
        reportId: report.id,
        clientId: report.clientId,
      },
    });
  }

  private async safeDeletePdf(path: string): Promise<void> {
    try {
      await this.pdfStorageProvider.deletePdf(path);
    } catch {
      // Storage cleanup should not block logical delete.
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
