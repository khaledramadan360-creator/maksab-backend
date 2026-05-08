import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import {
  ClientEmailCampaignRecipientCreateRecord,
  ClientEmailCampaignRecipientRepository,
  PaginatedResult,
  PaginationParams,
  RecipientProviderData,
  RecipientTrackingUpdatePatch,
} from '../../domain/repositories';
import {
  ClientEmailCampaignRecipient,
  ClientEmailCampaignTrackingSummary,
} from '../../domain/entities';
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
        deliveredAt: null,
        firstOpenedAt: null,
        lastOpenedAt: null,
        openCount: 0,
        proxyOpenedAt: null,
        proxyOpenCount: 0,
        firstClickedAt: null,
        lastClickedAt: null,
        clickCount: 0,
        lastClickedUrl: null,
        repliedAt: null,
        replyCount: 0,
        latestReplyText: null,
        latestReplySubject: null,
        latestReplyFromEmail: null,
        bouncedAt: null,
        lastBounceType: null,
        unsubscribedAt: null,
        complainedAt: null,
        lastEventAt: null,
        lastEventType: null,
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

  async findById(recipientId: string): Promise<ClientEmailCampaignRecipient | null> {
    const model = await ClientEmailCampaignRecipientModel.findByPk(recipientId);
    return model ? ClientEmailCampaignMapper.recipientToDomain(model) : null;
  }

  async findByCampaignAndEmail(campaignId: string, email: string): Promise<ClientEmailCampaignRecipient | null> {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return null;
    }

    const model = await ClientEmailCampaignRecipientModel.findOne({
      where: {
        campaignId,
        email: normalizedEmail,
      },
    });

    return model ? ClientEmailCampaignMapper.recipientToDomain(model) : null;
  }

  async applyTrackingUpdate(
    recipientId: string,
    patch: RecipientTrackingUpdatePatch
  ): Promise<ClientEmailCampaignRecipient> {
    const model = await ClientEmailCampaignRecipientModel.findByPk(recipientId);
    if (!model) {
      throw new Error('Recipient not found');
    }

    if ('deliveredAt' in patch) model.deliveredAt = patch.deliveredAt ?? null;
    if ('firstOpenedAt' in patch) model.firstOpenedAt = patch.firstOpenedAt ?? null;
    if ('lastOpenedAt' in patch) model.lastOpenedAt = patch.lastOpenedAt ?? null;
    if ('openCount' in patch && typeof patch.openCount === 'number') model.openCount = patch.openCount;
    if ('proxyOpenedAt' in patch) model.proxyOpenedAt = patch.proxyOpenedAt ?? null;
    if ('proxyOpenCount' in patch && typeof patch.proxyOpenCount === 'number') model.proxyOpenCount = patch.proxyOpenCount;
    if ('firstClickedAt' in patch) model.firstClickedAt = patch.firstClickedAt ?? null;
    if ('lastClickedAt' in patch) model.lastClickedAt = patch.lastClickedAt ?? null;
    if ('clickCount' in patch && typeof patch.clickCount === 'number') model.clickCount = patch.clickCount;
    if ('lastClickedUrl' in patch) model.lastClickedUrl = patch.lastClickedUrl ?? null;
    if ('repliedAt' in patch) model.repliedAt = patch.repliedAt ?? null;
    if ('replyCount' in patch && typeof patch.replyCount === 'number') model.replyCount = patch.replyCount;
    if ('latestReplyText' in patch) model.latestReplyText = patch.latestReplyText ?? null;
    if ('latestReplySubject' in patch) model.latestReplySubject = patch.latestReplySubject ?? null;
    if ('latestReplyFromEmail' in patch) model.latestReplyFromEmail = patch.latestReplyFromEmail ?? null;
    if ('bouncedAt' in patch) model.bouncedAt = patch.bouncedAt ?? null;
    if ('lastBounceType' in patch) model.lastBounceType = patch.lastBounceType ?? null;
    if ('unsubscribedAt' in patch) model.unsubscribedAt = patch.unsubscribedAt ?? null;
    if ('complainedAt' in patch) model.complainedAt = patch.complainedAt ?? null;
    if ('lastEventAt' in patch) model.lastEventAt = patch.lastEventAt ?? null;
    if ('lastEventType' in patch) model.lastEventType = patch.lastEventType ?? null;
    if ('failureReason' in patch) model.failureReason = patch.failureReason ?? null;
    model.updatedAt = new Date();

    await model.save();
    return ClientEmailCampaignMapper.recipientToDomain(model);
  }

  async getTrackingSummary(campaignId: string): Promise<ClientEmailCampaignTrackingSummary> {
    const baseWhere = { campaignId };
    const [
      deliveredCount,
      openedCount,
      proxyOpenedCount,
      clickedCount,
      hardBouncedCount,
      softBouncedCount,
      unsubscribedCount,
      complainedCount,
      lastEventRow,
    ] = await Promise.all([
      ClientEmailCampaignRecipientModel.count({ where: { ...baseWhere, deliveredAt: { [Op.ne]: null } } }),
      ClientEmailCampaignRecipientModel.count({ where: { ...baseWhere, openCount: { [Op.gt]: 0 } } }),
      ClientEmailCampaignRecipientModel.count({ where: { ...baseWhere, proxyOpenCount: { [Op.gt]: 0 } } }),
      ClientEmailCampaignRecipientModel.count({ where: { ...baseWhere, clickCount: { [Op.gt]: 0 } } }),
      ClientEmailCampaignRecipientModel.count({ where: { ...baseWhere, lastBounceType: 'hard_bounced' } }),
      ClientEmailCampaignRecipientModel.count({ where: { ...baseWhere, lastBounceType: 'soft_bounced' } }),
      ClientEmailCampaignRecipientModel.count({ where: { ...baseWhere, unsubscribedAt: { [Op.ne]: null } } }),
      ClientEmailCampaignRecipientModel.count({ where: { ...baseWhere, complainedAt: { [Op.ne]: null } } }),
      ClientEmailCampaignRecipientModel.findOne({
        where: { ...baseWhere, lastEventAt: { [Op.ne]: null }, lastEventType: { [Op.ne]: 'replied' } },
        order: [['lastEventAt', 'DESC']],
      }),
    ]);

    return {
      deliveredCount,
      openedCount,
      proxyOpenedCount,
      clickedCount,
      hardBouncedCount,
      softBouncedCount,
      unsubscribedCount,
      complainedCount,
      lastEventAt: lastEventRow?.lastEventAt ?? null,
    };
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
