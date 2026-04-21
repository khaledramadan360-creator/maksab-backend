import { SystemSettingKey } from './enums';

export interface SystemSetting {
  key: SystemSettingKey;
  valueText: string | null;
  createdAt: Date;
  updatedAt: Date;
}
