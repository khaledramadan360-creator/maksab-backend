import { SystemSetting } from './entities';
import { AuditAction, SystemSettingKey } from './enums';

export interface SystemSettingUpsertRecord {
  key: SystemSettingKey;
  valueText: string | null;
}

export interface SystemSettingsRepository {
  findByKey(key: SystemSettingKey): Promise<SystemSetting | null>;
  upsert(record: SystemSettingUpsertRecord): Promise<SystemSetting>;
}

export interface SystemSettingsAuditLogEntry {
  actorUserId: string | null;
  action: AuditAction;
  entityType: 'system_setting';
  entityId: string;
  metadata: Record<string, unknown>;
}

export interface AuditLogRepository {
  createAuditLog(entry: SystemSettingsAuditLogEntry): Promise<void>;
}
