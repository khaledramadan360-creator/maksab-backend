import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../../../core/database/sequelize.config';

interface SystemSettingAttributes {
  key: string;
  valueText: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type SystemSettingCreationAttributes = Optional<SystemSettingAttributes, 'createdAt' | 'updatedAt'>;

export class SystemSettingModel
  extends Model<SystemSettingAttributes, SystemSettingCreationAttributes>
  implements SystemSettingAttributes
{
  declare key: string;
  declare valueText: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

SystemSettingModel.init(
  {
    key: { type: DataTypes.STRING(100), primaryKey: true, allowNull: false },
    valueText: { type: DataTypes.TEXT('long'), allowNull: true, defaultValue: null },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'system_settings',
    underscored: true,
    timestamps: true,
  }
);
