import { Role } from '../../../auth/domain/enums';
import {
  ClientEmailCampaignAccessDeniedError,
  ClientEmailCampaignNotFoundError,
} from '../../domain/errors';
import {
  ClientEmailCampaignRecipientRepository,
  ClientEmailCampaignRepository,
} from '../../domain/repositories';
import { ClientEmailCampaignMapperService } from '../services/client-email-campaign-mapper.service';
import {
  ClientEmailCampaignDetailsDto,
  RequestActorContext,
} from '../../public/client-email-campaigns.types';

export class GetClientEmailCampaignDetailsUseCase {
  constructor(
    private readonly campaignRepo: ClientEmailCampaignRepository,
    private readonly recipientRepo: ClientEmailCampaignRecipientRepository,
    private readonly mapper: ClientEmailCampaignMapperService
  ) {}

  async execute(input: {
    campaignId: string;
    page?: number;
    pageSize?: number;
    actor: RequestActorContext;
  }): Promise<ClientEmailCampaignDetailsDto> {
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

    const page = Math.max(1, Number(input.page ?? 1));
    const pageSize = Math.max(1, Math.min(200, Number(input.pageSize ?? 100)));
    const recipients = await this.recipientRepo.listByCampaignId(campaign.id, { page, pageSize });

    return this.mapper.toDetailsDto(campaign, recipients);
  }
}
