import { SystemSettingsRepository, SystemSettingUpsertRecord } from '../../domain/repositories';
import { SystemSetting } from '../../domain/entities';
import { SystemSettingModel } from '../persistence/models/system-setting.model';
import { SystemSettingMapper } from '../mappers/system-setting.mapper';
import { SystemSettingKey } from '../../domain/enums';

export class MySQLSystemSettingsRepository implements SystemSettingsRepository {
  async findByKey(key: SystemSettingKey): Promise<SystemSetting | null> {
    const model = await SystemSettingModel.findByPk(key);
    return model ? SystemSettingMapper.toDomain(model) : null;
  }

  async upsert(record: SystemSettingUpsertRecord): Promise<SystemSetting> {
    const existing = await SystemSettingModel.findByPk(record.key);
    const now = new Date();

    if (existing) {
      existing.valueText = record.valueText;
      existing.updatedAt = now;
      await existing.save();
      return SystemSettingMapper.toDomain(existing);
    }

    const created = await SystemSettingModel.create({
      key: record.key,
      valueText: record.valueText,
      createdAt: now,
      updatedAt: now,
    });

    return SystemSettingMapper.toDomain(created);
  }
}
