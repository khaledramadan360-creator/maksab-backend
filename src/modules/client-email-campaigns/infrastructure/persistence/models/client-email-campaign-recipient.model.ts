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
  deliveredAt: Date | null;
  firstOpenedAt: Date | null;
  lastOpenedAt: Date | null;
  openCount: number;
  proxyOpenedAt: Date | null;
  proxyOpenCount: number;
  firstClickedAt: Date | null;
  lastClickedAt: Date | null;
  clickCount: number;
  lastClickedUrl: string | null;
  repliedAt: Date | null;
  replyCount: number;
  latestReplyText: string | null;
  latestReplySubject: string | null;
  latestReplyFromEmail: string | null;
  bouncedAt: Date | null;
  lastBounceType: string | null;
  unsubscribedAt: Date | null;
  complainedAt: Date | null;
  lastEventAt: Date | null;
  lastEventType: string | null;
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
  declare deliveredAt: Date | null;
  declare firstOpenedAt: Date | null;
  declare lastOpenedAt: Date | null;
  declare openCount: number;
  declare proxyOpenedAt: Date | null;
  declare proxyOpenCount: number;
  declare firstClickedAt: Date | null;
  declare lastClickedAt: Date | null;
  declare clickCount: number;
  declare lastClickedUrl: string | null;
  declare repliedAt: Date | null;
  declare replyCount: number;
  declare latestReplyText: string | null;
  declare latestReplySubject: string | null;
  declare latestReplyFromEmail: string | null;
  declare bouncedAt: Date | null;
  declare lastBounceType: string | null;
  declare unsubscribedAt: Date | null;
  declare complainedAt: Date | null;
  declare lastEventAt: Date | null;
  declare lastEventType: string | null;
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
    deliveredAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    firstOpenedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    lastOpenedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    openCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    proxyOpenedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    proxyOpenCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    firstClickedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    lastClickedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    clickCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastClickedUrl: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    repliedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    replyCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    latestReplyText: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    latestReplySubject: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
    latestReplyFromEmail: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
    bouncedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    lastBounceType: { type: DataTypes.STRING(50), allowNull: true, defaultValue: null },
    unsubscribedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    complainedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    lastEventAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    lastEventType: { type: DataTypes.STRING(50), allowNull: true, defaultValue: null },
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
      { name: 'client_email_campaign_recipients_last_event_at_idx', fields: ['last_event_at'] },
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
