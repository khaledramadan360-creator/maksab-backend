import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../../../core/database/sequelize.config';

interface EmailSuppressionAttributes {
  id: string;
  email: string;
  reason: string;
  level: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

type EmailSuppressionCreationAttributes = Optional<EmailSuppressionAttributes, 'createdAt' | 'updatedAt'>;

export class EmailSuppressionModel
  extends Model<EmailSuppressionAttributes, EmailSuppressionCreationAttributes>
  implements EmailSuppressionAttributes {
  declare id: string;
  declare email: string;
  declare reason: string;
  declare level: string;
  declare source: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

EmailSuppressionModel.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false },
    reason: { type: DataTypes.STRING(100), allowNull: false },
    level: { type: DataTypes.STRING(50), allowNull: false },
    source: { type: DataTypes.STRING(100), allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'email_suppressions',
    underscored: true,
    timestamps: true,
    indexes: [
      { name: 'email_suppressions_email_unique', fields: ['email'], unique: true },
      { name: 'email_suppressions_level_idx', fields: ['level'] },
    ],
  }
);
