import { SystemSetting } from '../../domain/entities';
import { SystemSettingKey } from '../../domain/enums';
import { SystemSettingModel } from '../persistence/models/system-setting.model';

export class SystemSettingMapper {
  static toDomain(model: SystemSettingModel): SystemSetting {
    return {
      key: model.key as SystemSettingKey,
      valueText: model.valueText,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
