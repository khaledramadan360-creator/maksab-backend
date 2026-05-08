import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../../../core/database/sequelize.config';
import { ClientEmailCampaignModel } from './client-email-campaign.model';
import { ClientEmailCampaignRecipientModel } from './client-email-campaign-recipient.model';
import { ClientModel } from '../../../../clients/infrastructure/persistence/models/client.model';

interface ClientEmailCampaignRecipientEventAttributes {
  id: string;
  campaignId: string;
  recipientId: string;
  clientId: string;
  provider: string;
  source: string;
  providerEventKey: string;
  providerCampaignId: string | null;
  providerMessageId: string | null;
  eventType: string;
  eventAt: Date;
  linkUrl: string | null;
  reason: string | null;
  replyText: string | null;
  replySubject: string | null;
  replyFromEmail: string | null;
  payload: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type ClientEmailCampaignRecipientEventCreationAttributes = Optional<
  ClientEmailCampaignRecipientEventAttributes,
  'createdAt' | 'updatedAt'
>;

export class ClientEmailCampaignRecipientEventModel
  extends Model<
    ClientEmailCampaignRecipientEventAttributes,
    ClientEmailCampaignRecipientEventCreationAttributes
  >
  implements ClientEmailCampaignRecipientEventAttributes {
  declare id: string;
  declare campaignId: string;
  declare recipientId: string;
  declare clientId: string;
  declare provider: string;
  declare source: string;
  declare providerEventKey: string;
  declare providerCampaignId: string | null;
  declare providerMessageId: string | null;
  declare eventType: string;
  declare eventAt: Date;
  declare linkUrl: string | null;
  declare reason: string | null;
  declare replyText: string | null;
  declare replySubject: string | null;
  declare replyFromEmail: string | null;
  declare payload: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ClientEmailCampaignRecipientEventModel.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
    campaignId: { type: DataTypes.CHAR(36), allowNull: false },
    recipientId: { type: DataTypes.CHAR(36), allowNull: false },
    clientId: { type: DataTypes.CHAR(36), allowNull: false },
    provider: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'brevo' },
    source: { type: DataTypes.STRING(50), allowNull: false },
    providerEventKey: { type: DataTypes.STRING(255), allowNull: false },
    providerCampaignId: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
    providerMessageId: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
    eventType: { type: DataTypes.STRING(50), allowNull: false },
    eventAt: { type: DataTypes.DATE, allowNull: false },
    linkUrl: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    reason: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
    replyText: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    replySubject: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
    replyFromEmail: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
    payload: { type: DataTypes.TEXT('long'), allowNull: true, defaultValue: null },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'client_email_campaign_recipient_events',
    underscored: true,
    timestamps: true,
    indexes: [
      { name: 'client_email_campaign_recipient_events_campaign_id_idx', fields: ['campaign_id'] },
      { name: 'client_email_campaign_recipient_events_recipient_id_idx', fields: ['recipient_id'] },
      { name: 'client_email_campaign_recipient_events_event_at_idx', fields: ['event_at'] },
      { name: 'client_email_campaign_recipient_events_event_type_idx', fields: ['event_type'] },
      { name: 'client_email_campaign_recipient_events_provider_event_key_unique', fields: ['provider_event_key'], unique: true },
    ],
  }
);

ClientEmailCampaignRecipientEventModel.belongsTo(ClientEmailCampaignModel, {
  foreignKey: 'campaignId',
  as: 'campaign',
});

ClientEmailCampaignRecipientEventModel.belongsTo(ClientEmailCampaignRecipientModel, {
  foreignKey: 'recipientId',
  as: 'recipient',
});

ClientEmailCampaignRecipientEventModel.belongsTo(ClientModel, {
  foreignKey: 'clientId',
  as: 'client',
});
