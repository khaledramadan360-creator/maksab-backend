import { v4 as uuidv4 } from 'uuid';
import {
  ClientEmailCampaignRecipientCreateRecord,
  ClientEmailCampaignRecipientRepository,
  PaginatedResult,
  PaginationParams,
  RecipientProviderData,
} from '../../domain/repositories';
import { ClientEmailCampaignRecipient } from '../../domain/entities';
import { RecipientStatus } from '../../domain/enums';
import { ClientEmailCampaignRecipientModel } from '../persistence/models/client-email-campaign-recipient.model';
import { ClientEmailCampaignMapper } from '../mappers/client-email-campaign.mapper';

export class MySQLClientEmailCampaignRecipientRepository implements ClientEmailCampaignRecipientRepository {
  async bulkCreate(records: ClientEmailCampaignRecipientCreateRecord[]): Promise<ClientEmailCampaignRecipient[]> {
    const now = new Date();
    const models = await ClientEmailCampaignRecipientModel.bulkCreate(
      records.map(record => ({
        id: uuidv4(),
        ...record,
        providerContactId: null,
        providerMessageId: null,
        failureReason: null,
        sentAt: null,
        createdAt: now,
        updatedAt: now,
      }))
    );

    return models.map(ClientEmailCampaignMapper.recipientToDomain);
  }

  async markSent(recipientId: string, providerData?: RecipientProviderData): Promise<void> {
    await ClientEmailCampaignRecipientModel.update(
      {
        status: RecipientStatus.Sent,
        providerContactId: providerData?.providerContactId ?? null,
        providerMessageId: providerData?.providerMessageId ?? null,
        failureReason: null,
        sentAt: new Date(),
        updatedAt: new Date(),
      },
      { where: { id: recipientId } }
    );
  }

  async markFailed(recipientId: string, reason: string, providerData?: RecipientProviderData): Promise<void> {
    await ClientEmailCampaignRecipientModel.update(
      {
        status: RecipientStatus.Failed,
        providerContactId: providerData?.providerContactId ?? null,
        providerMessageId: providerData?.providerMessageId ?? null,
        failureReason: providerData?.failureReason ?? reason,
        updatedAt: new Date(),
      },
      { where: { id: recipientId } }
    );
  }

  async listByCampaignId(
    campaignId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResult<ClientEmailCampaignRecipient>> {
    const page = Math.max(1, pagination.page);
    const pageSize = Math.max(1, pagination.pageSize);
    const { count, rows } = await ClientEmailCampaignRecipientModel.findAndCountAll({
      where: { campaignId },
      order: [['createdAt', 'ASC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return {
      items: rows.map(ClientEmailCampaignMapper.recipientToDomain),
      total: count,
      page,
      pageSize,
    };
  }
}
