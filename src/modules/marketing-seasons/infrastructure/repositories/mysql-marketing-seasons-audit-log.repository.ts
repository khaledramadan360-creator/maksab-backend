import { v4 as uuidv4 } from 'uuid';
import { AuditLogModel } from '../../../auth/infrastructure/persistence/models/audit-log.model';
import {
  AuditLogRepository,
  MarketingSeasonAuditLogEntry,
} from '../../domain/repositories';

export class MySQLMarketingSeasonsAuditLogRepository implements AuditLogRepository {
  async createAuditLog(entry: MarketingSeasonAuditLogEntry): Promise<void> {
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

