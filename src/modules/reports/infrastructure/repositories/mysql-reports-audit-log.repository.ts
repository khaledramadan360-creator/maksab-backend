import { v4 as uuidv4 } from 'uuid';
import { AuditLogModel } from '../../../auth/infrastructure/persistence/models/audit-log.model';
import { AuditLogRepository, ReportAuditLogEntry } from '../../domain/repositories';

export class MySQLReportsAuditLogRepository implements AuditLogRepository {
  async createAuditLog(entry: ReportAuditLogEntry): Promise<void> {
    await AuditLogModel.create({
      id: uuidv4(),
      actorUserId: entry.actorUserId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadataJson: entry.metadata,
      createdAt: new Date(),
    });
  }
}
