import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../../../core/database/sequelize.config';
import { ClientEmailCampaignModel } from './client-email-campaign.model';
import { ClientModel } from '../../../../clients/infrastructure/persistence/models/client.model';

interface ClientEmailCampaignRecipientAttributes {
  id: string;
  campaignId: string;
  clientId: string;
  email: string | null;
  name: string | null;
  status: string;
  eligibilityLevel: string;
  eligibilityReason: string | null;
  skipReason: string | null;
  provider: string;
  providerContactId: string | null;
  providerMessageId: string | null;
  failureReason: string | null;
  overrideUsed: boolean;
  overrideReason: string | null;
  overrideByUserId: string | null;
  overrideAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type ClientEmailCampaignRecipientCreationAttributes = Optional<
  ClientEmailCampaignRecipientAttributes,
  'createdAt' | 'updatedAt'
>;

export class ClientEmailCampaignRecipientModel
  extends Model<ClientEmailCampaignRecipientAttributes, ClientEmailCampaignRecipientCreationAttributes>
  implements ClientEmailCampaignRecipientAttributes {
  declare id: string;
  declare campaignId: string;
  declare clientId: string;
  declare email: string | null;
  declare name: string | null;
  declare status: string;
  declare eligibilityLevel: string;
  declare eligibilityReason: string | null;
  declare skipReason: string | null;
  declare provider: string;
  declare providerContactId: string | null;
  declare providerMessageId: string | null;
  declare failureReason: string | null;
  declare overrideUsed: boolean;
  declare overrideReason: string | null;
  declare overrideByUserId: string | null;
  declare overrideAt: Date | null;
  declare sentAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ClientEmailCampaignRecipientModel.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
    campaignId: { type: DataTypes.CHAR(36), allowNull: false },
    clientId: { type: DataTypes.CHAR(36), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
    name: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
    status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'pending' },
    eligibilityLevel: { type: DataTypes.STRING(50), allowNull: false },
    eligibilityReason: { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },
    skipReason: { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },
    provider: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'brevo' },
    providerContactId: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
    providerMessageId: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
    failureReason: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    overrideUsed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    overrideReason: { type: DataTypes.STRING(500), allowNull: true, defaultValue: null },
    overrideByUserId: { type: DataTypes.CHAR(36), allowNull: true, defaultValue: null },
    overrideAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    sentAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'client_email_campaign_recipients',
    underscored: true,
    timestamps: true,
    indexes: [
      { name: 'client_email_campaign_recipients_campaign_id_idx', fields: ['campaign_id'] },
      { name: 'client_email_campaign_recipients_client_id_idx', fields: ['client_id'] },
      { name: 'client_email_campaign_recipients_campaign_email_idx', fields: ['campaign_id', 'email'] },
      { name: 'client_email_campaign_recipients_status_idx', fields: ['status'] },
    ],
  }
);

ClientEmailCampaignRecipientModel.belongsTo(ClientEmailCampaignModel, {
  foreignKey: 'campaignId',
  as: 'campaign',
});

ClientEmailCampaignRecipientModel.belongsTo(ClientModel, {
  foreignKey: 'clientId',
  as: 'client',
});
