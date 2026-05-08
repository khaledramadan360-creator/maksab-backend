import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import {
  ClientEmailCampaignRecipientEventCreateRecord,
  ClientEmailCampaignRecipientEventRepository,
  PaginatedResult,
  PaginationParams,
} from '../../domain/repositories';
import { ClientEmailCampaignRecipientEvent } from '../../domain/entities';
import { ClientEmailCampaignMapper } from '../mappers/client-email-campaign.mapper';
import { ClientEmailCampaignRecipientEventModel } from '../persistence/models/client-email-campaign-recipient-event.model';

export class MySQLClientEmailCampaignRecipientEventRepository
  implements ClientEmailCampaignRecipientEventRepository {
  async createIfAbsent(
    record: ClientEmailCampaignRecipientEventCreateRecord
  ): Promise<{ event: ClientEmailCampaignRecipientEvent; created: boolean }> {
    const now = new Date();
    const [model, created] = await ClientEmailCampaignRecipientEventModel.findOrCreate({
      where: { providerEventKey: record.providerEventKey },
      defaults: {
        id: uuidv4(),
        campaignId: record.campaignId,
        recipientId: record.recipientId,
        clientId: record.clientId,
        provider: record.provider,
        source: record.source,
        providerEventKey: record.providerEventKey,
        providerCampaignId: record.providerCampaignId ?? null,
        providerMessageId: record.providerMessageId ?? null,
        eventType: record.eventType,
        eventAt: record.eventAt,
        linkUrl: record.linkUrl ?? null,
        reason: record.reason ?? null,
        replyText: record.replyText ?? null,
        replySubject: record.replySubject ?? null,
        replyFromEmail: record.replyFromEmail ?? null,
        payload: record.payload ?? null,
        createdAt: now,
        updatedAt: now,
      },
    });

    return {
      event: ClientEmailCampaignMapper.recipientEventToDomain(model),
      created,
    };
  }

  async listByRecipientId(
    campaignId: string,
    recipientId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResult<ClientEmailCampaignRecipientEvent>> {
    const page = Math.max(1, pagination.page);
    const pageSize = Math.max(1, pagination.pageSize);
    const { count, rows } = await ClientEmailCampaignRecipientEventModel.findAndCountAll({
      where: { campaignId, recipientId, eventType: { [Op.ne]: 'replied' } },
      order: [['eventAt', 'DESC'], ['createdAt', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return {
      items: rows.map(ClientEmailCampaignMapper.recipientEventToDomain),
      total: count,
      page,
      pageSize,
    };
  }
}
