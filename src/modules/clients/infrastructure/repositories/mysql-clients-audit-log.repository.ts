import { v4 as uuidv4 } from 'uuid';
import { AuditLogRepository, ClientAuditLogEntry } from '../../domain/repositories';
import { AuditLogModel } from '../../../auth/infrastructure/persistence/models/audit-log.model';

export class MySQLClientsAuditLogRepository implements AuditLogRepository {
  async createAuditLog(entry: ClientAuditLogEntry): Promise<void> {
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

