import { v4 as uuidv4 } from 'uuid';
import { Op, WhereOptions } from 'sequelize';
import {
  CampaignSendResultPatch,
  ClientEmailCampaignCreateRecord,
  ClientEmailCampaignListFilters,
  ClientEmailCampaignRepository,
  PaginatedResult,
  PaginationParams,
} from '../../domain/repositories';
import { CampaignStatus } from '../../domain/enums';
import { ClientEmailCampaign } from '../../domain/entities';
import { ClientEmailCampaignModel } from '../persistence/models/client-email-campaign.model';
import { ClientEmailCampaignMapper } from '../mappers/client-email-campaign.mapper';

export class MySQLClientEmailCampaignRepository implements ClientEmailCampaignRepository {
  async create(record: ClientEmailCampaignCreateRecord): Promise<ClientEmailCampaign> {
    const now = new Date();
    const model = await ClientEmailCampaignModel.create({
      id: uuidv4(),
      ...record,
      providerCampaignId: null,
      providerListId: null,
      failureReason: null,
      sentAt: null,
      createdAt: now,
      updatedAt: now,
    });

    return ClientEmailCampaignMapper.campaignToDomain(model);
  }

  async markSending(campaignId: string): Promise<ClientEmailCampaign> {
    return this.updateStatus(campaignId, {
      status: CampaignStatus.Sending,
      updatedAt: new Date(),
    });
  }

  async markSent(campaignId: string, result: CampaignSendResultPatch): Promise<ClientEmailCampaign> {
    return this.updateStatus(campaignId, {
      status: CampaignStatus.Sent,
      providerCampaignId: result.providerCampaignId ?? null,
      providerListId: result.providerListId ?? null,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      skippedCount: result.skippedCount,
      failureReason: result.failureReason ?? null,
      sentAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async markPartiallyFailed(campaignId: string, result: CampaignSendResultPatch): Promise<ClientEmailCampaign> {
    return this.updateStatus(campaignId, {
      status: CampaignStatus.PartiallyFailed,
      providerCampaignId: result.providerCampaignId ?? null,
      providerListId: result.providerListId ?? null,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      skippedCount: result.skippedCount,
      failureReason: result.failureReason ?? null,
      sentAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async markFailed(campaignId: string, reason: string): Promise<ClientEmailCampaign> {
    return this.updateStatus(campaignId, {
      status: CampaignStatus.Failed,
      failureReason: reason,
      updatedAt: new Date(),
    });
  }

  async findById(campaignId: string): Promise<ClientEmailCampaign | null> {
    const model = await ClientEmailCampaignModel.findByPk(campaignId);
    return model ? ClientEmailCampaignMapper.campaignToDomain(model) : null;
  }

  async list(
    filters: ClientEmailCampaignListFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<ClientEmailCampaign>> {
    const where: WhereOptions = {};

    if (filters.requestedByUserId) {
      where['requestedByUserId'] = filters.requestedByUserId;
    }
    if (filters.status) {
      where['status'] = filters.status;
    }
    if (filters.createdAtFrom || filters.createdAtTo) {
      const range: Record<symbol, Date> = {};
      if (filters.createdAtFrom) range[Op.gte] = filters.createdAtFrom;
      if (filters.createdAtTo) range[Op.lte] = filters.createdAtTo;
      (where as any)['createdAt'] = range;
    }

    const page = Math.max(1, pagination.page);
    const pageSize = Math.max(1, pagination.pageSize);
    const { count, rows } = await ClientEmailCampaignModel.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return {
      items: rows.map(ClientEmailCampaignMapper.campaignToDomain),
      total: count,
      page,
      pageSize,
    };
  }

  private async updateStatus(campaignId: string, patch: Record<string, unknown>): Promise<ClientEmailCampaign> {
    const model = await ClientEmailCampaignModel.findByPk(campaignId);
    if (!model) {
      throw new Error('Campaign not found');
    }

    await model.update(patch);
    return ClientEmailCampaignMapper.campaignToDomain(model);
  }
}
