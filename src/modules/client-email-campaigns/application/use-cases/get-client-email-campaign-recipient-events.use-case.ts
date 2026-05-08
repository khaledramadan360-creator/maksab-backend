import { Role } from '../../../auth/domain/enums';
import {
  ClientEmailCampaignAccessDeniedError,
  ClientEmailCampaignNotFoundError,
} from '../../domain/errors';
import {
  ClientEmailCampaignRecipientEventRepository,
  ClientEmailCampaignRecipientRepository,
  ClientEmailCampaignRepository,
} from '../../domain/repositories';
import { ClientEmailCampaignMapperService } from '../services/client-email-campaign-mapper.service';
import {
  ClientEmailCampaignRecipientEventsDto,
  RequestActorContext,
} from '../../public/client-email-campaigns.types';

export class GetClientEmailCampaignRecipientEventsUseCase {
  constructor(
    private readonly campaignRepo: ClientEmailCampaignRepository,
    private readonly recipientRepo: ClientEmailCampaignRecipientRepository,
    private readonly eventRepo: ClientEmailCampaignRecipientEventRepository,
    private readonly mapper: ClientEmailCampaignMapperService
  ) {}

  async execute(input: {
    campaignId: string;
    recipientId: string;
    page?: number;
    pageSize?: number;
    actor: RequestActorContext;
  }): Promise<ClientEmailCampaignRecipientEventsDto> {
    if (![Role.Admin, Role.Manager, Role.Employee].includes(input.actor.role as Role)) {
      throw new ClientEmailCampaignAccessDeniedError();
    }

    const campaign = await this.campaignRepo.findById(input.campaignId);
    if (!campaign) {
      throw new ClientEmailCampaignNotFoundError();
    }

    if (input.actor.role === Role.Employee && campaign.requestedByUserId !== input.actor.userId) {
      throw new ClientEmailCampaignAccessDeniedError();
    }

    const recipient = await this.recipientRepo.findById(input.recipientId);
    if (!recipient || recipient.campaignId !== campaign.id) {
      throw new ClientEmailCampaignNotFoundError('Client email campaign recipient was not found');
    }

    const page = Math.max(1, Number(input.page ?? 1));
    const pageSize = Math.max(1, Math.min(200, Number(input.pageSize ?? 100)));
    const events = await this.eventRepo.listByRecipientId(campaign.id, recipient.id, { page, pageSize });

    return this.mapper.toRecipientEventsDto(recipient, events);
  }
}
