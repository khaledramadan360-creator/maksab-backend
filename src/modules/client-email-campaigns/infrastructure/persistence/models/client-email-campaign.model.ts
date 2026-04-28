import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../../../core/database/sequelize.config';

interface ClientEmailCampaignAttributes {
  id: string;
  title: string;
  subject: string;
  htmlContent: string | null;
  textContent: string | null;
  senderName: string;
  senderEmail: string;
  status: string;
  provider: string;
  providerCampaignId: string | null;
  providerListId: string | null;
  totalSelected: number;
  sendableCount: number;
  warningCount: number;
  blockedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  overrideCount: number;
  requestedByUserId: string;
  failureReason: string | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type ClientEmailCampaignCreationAttributes = Optional<
  ClientEmailCampaignAttributes,
  'createdAt' | 'updatedAt'
>;

export class ClientEmailCampaignModel
  extends Model<ClientEmailCampaignAttributes, ClientEmailCampaignCreationAttributes>
  implements ClientEmailCampaignAttributes {
  declare id: string;
  declare title: string;
  declare subject: string;
  declare htmlContent: string | null;
  declare textContent: string | null;
  declare senderName: string;
  declare senderEmail: string;
  declare status: string;
  declare provider: string;
  declare providerCampaignId: string | null;
  declare providerListId: string | null;
  declare totalSelected: number;
  declare sendableCount: number;
  declare warningCount: number;
  declare blockedCount: number;
  declare sentCount: number;
  declare failedCount: number;
  declare skippedCount: number;
  declare overrideCount: number;
  declare requestedByUserId: string;
  declare failureReason: string | null;
  declare sentAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ClientEmailCampaignModel.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    subject: { type: DataTypes.STRING(255), allowNull: false },
    htmlContent: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    textContent: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    senderName: { type: DataTypes.STRING(255), allowNull: false },
    senderEmail: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'draft' },
    provider: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'brevo' },
    providerCampaignId: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
    providerListId: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
    totalSelected: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    sendableCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    warningCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    blockedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    sentCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    failedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    skippedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    overrideCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    requestedByUserId: { type: DataTypes.CHAR(36), allowNull: false },
    failureReason: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    sentAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'client_email_campaigns',
    underscored: true,
    timestamps: true,
    indexes: [
      { name: 'client_email_campaigns_status_idx', fields: ['status'] },
      { name: 'client_email_campaigns_requested_by_user_id_idx', fields: ['requested_by_user_id'] },
      { name: 'client_email_campaigns_created_at_idx', fields: ['created_at'] },
    ],
  }
);
