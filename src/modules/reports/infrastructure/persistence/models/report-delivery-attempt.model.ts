import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../../../core/database/sequelize.config';

interface ReportDeliveryAttemptAttributes {
  id: string;
  reportId: string;
  clientId: string;
  provider: string;
  recipientPhone: string;
  recipientSource: string | null;
  recipientName: string | null;
  messageText: string | null;
  status: string;
  providerMessageId: string | null;
  providerStatusCode: string | null;
  failureReason: string | null;
  requestedByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

type ReportDeliveryAttemptCreationAttributes = Optional<
  ReportDeliveryAttemptAttributes,
  'recipientSource' | 'recipientName' | 'messageText' | 'providerMessageId' | 'providerStatusCode' | 'failureReason'
>;

export class ReportDeliveryAttemptModel
  extends Model<ReportDeliveryAttemptAttributes, ReportDeliveryAttemptCreationAttributes>
  implements ReportDeliveryAttemptAttributes
{
  declare id: string;
  declare reportId: string;
  declare clientId: string;
  declare provider: string;
  declare recipientPhone: string;
  declare recipientSource: string | null;
  declare recipientName: string | null;
  declare messageText: string | null;
  declare status: string;
  declare providerMessageId: string | null;
  declare providerStatusCode: string | null;
  declare failureReason: string | null;
  declare requestedByUserId: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ReportDeliveryAttemptModel.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
    reportId: { type: DataTypes.CHAR(36), allowNull: false },
    clientId: { type: DataTypes.CHAR(36), allowNull: false },
    provider: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'whatchimp' },
    recipientPhone: { type: DataTypes.STRING(32), allowNull: false },
    recipientSource: { type: DataTypes.STRING(32), allowNull: true, defaultValue: null },
    recipientName: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
    messageText: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'pending' },
    providerMessageId: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
    providerStatusCode: { type: DataTypes.STRING(50), allowNull: true, defaultValue: null },
    failureReason: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    requestedByUserId: { type: DataTypes.CHAR(36), allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'report_delivery_attempts',
    underscored: true,
    timestamps: true,
    indexes: [
      { name: 'report_delivery_attempts_report_id_idx', fields: ['report_id'] },
      { name: 'report_delivery_attempts_client_id_idx', fields: ['client_id'] },
      { name: 'report_delivery_attempts_requested_by_user_id_idx', fields: ['requested_by_user_id'] },
      { name: 'report_delivery_attempts_provider_status_idx', fields: ['provider', 'status'] },
      { name: 'report_delivery_attempts_created_at_idx', fields: ['created_at'] },
    ],
  }
);
