import { v4 as uuidv4 } from 'uuid';
import { EmailAddress } from '../../domain/value-objects';
import {
  ClientCampaignClientRepository,
  ClientEmailCampaignAuditLogRepository,
  EmailSuppressionRepository,
} from '../../domain/repositories';
import {
  ClientEmailCampaignAuditAction,
} from '../../domain/enums';
import { ClientsNotFoundError } from '../../domain/errors';
import {
  ClientEmailCampaignPermissionService,
  ClientEmailRecipientEligibilityService,
} from '../../domain/services';
import { ClientEmailCampaignInputService } from '../services/client-email-campaign-input.service';
import { ClientEmailCampaignMapperService } from '../services/client-email-campaign-mapper.service';
import {
  PreviewClientEmailCampaignRequestDto,
  PreviewClientEmailCampaignResponseDto,
} from '../../public/client-email-campaigns.types';

export class PreviewClientEmailCampaignUseCase {
  constructor(
    private readonly clientRepo: ClientCampaignClientRepository,
    private readonly suppressionRepo: EmailSuppressionRepository,
    private readonly auditRepo: ClientEmailCampaignAuditLogRepository,
    private readonly permissionService: ClientEmailCampaignPermissionService,
    private readonly eligibilityService: ClientEmailRecipientEligibilityService,
    private readonly inputService: ClientEmailCampaignInputService,
    private readonly mapper: ClientEmailCampaignMapperService
  ) {}

  async execute(input: PreviewClientEmailCampaignRequestDto): Promise<PreviewClientEmailCampaignResponseDto> {
    this.permissionService.assertCanPreview(input.requestedByUser.role);
    const normalized = this.inputService.normalize(input);

    const clients = await this.clientRepo.findByIds(normalized.clientIds);
    if (clients.length !== normalized.clientIds.length) {
      throw new ClientsNotFoundError();
    }

    const validEmails = clients
      .map(client => EmailAddress.tryNormalize(client.email))
      .filter((email): email is string => !!email);
    const suppressions = await this.suppressionRepo.findByEmails(validEmails);
    const previews = this.eligibilityService.classify(
      clients,
      suppressions,
      input.requestedByUser.role,
      input.requestedByUser.userId
    );

    const response = this.mapper.toPreviewResponse(previews);
    await this.auditRepo.createAuditLog({
      actorUserId: input.requestedByUser.userId,
      action: ClientEmailCampaignAuditAction.Previewed,
      entityType: 'client_email_campaign',
      entityId: uuidv4(),
      metadata: {
        totalSelected: response.totalSelected,
        sendableCount: response.sendableCount,
        warningCount: response.warningCount,
        blockedCount: response.blockedCount,
        breakdown: response.breakdown,
      },
    });

    return response;
  }
}
