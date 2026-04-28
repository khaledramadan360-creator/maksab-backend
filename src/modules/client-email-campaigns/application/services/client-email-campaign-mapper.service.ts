import {
  ClientEmailCampaign,
  ClientEmailCampaignRecipient,
  RecipientPreview,
} from '../../domain/entities';
import {
  ClientEmailCampaignDetailsDto,
  ClientEmailCampaignDto,
  ClientEmailCampaignRecipientDto,
  PreviewClientEmailCampaignResponseDto,
  RecipientPreviewDto,
} from '../../public/client-email-campaigns.types';
import { PaginatedResult } from '../../domain/repositories';

export class ClientEmailCampaignMapperService {
  toPreviewResponse(previews: RecipientPreview[]): PreviewClientEmailCampaignResponseDto {
    const breakdown = previews.reduce<Record<string, number>>((acc, item) => {
      const key = item.eligibilityReason ?? item.eligibilityLevel;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const sendableRecipients = previews.filter(item => item.eligibilityLevel === 'sendable');
    const warningRecipients = previews.filter(item => item.eligibilityLevel === 'warning');
    const blockedRecipients = previews.filter(item => item.eligibilityLevel === 'blocked');

    return {
      totalSelected: previews.length,
      sendableCount: sendableRecipients.length,
      warningCount: warningRecipients.length,
      blockedCount: blockedRecipients.length,
      breakdown,
      sendableRecipients: sendableRecipients.map(this.toRecipientPreviewDto),
      warningRecipients: warningRecipients.map(this.toRecipientPreviewDto),
      blockedRecipients: blockedRecipients.map(this.toRecipientPreviewDto),
    };
  }

  toCampaignDto(campaign: ClientEmailCampaign): ClientEmailCampaignDto {
    return {
      id: campaign.id,
      title: campaign.title,
      subject: campaign.subject,
      senderName: campaign.senderName,
      senderEmail: campaign.senderEmail,
      status: campaign.status,
      provider: campaign.provider,
      providerCampaignId: campaign.providerCampaignId,
      providerListId: campaign.providerListId,
      totalSelected: campaign.totalSelected,
      sendableCount: campaign.sendableCount,
      warningCount: campaign.warningCount,
      blockedCount: campaign.blockedCount,
      sentCount: campaign.sentCount,
      failedCount: campaign.failedCount,
      skippedCount: campaign.skippedCount,
      overrideCount: campaign.overrideCount,
      requestedByUserId: campaign.requestedByUserId,
      failureReason: campaign.failureReason,
      sentAt: campaign.sentAt?.toISOString() ?? null,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
    };
  }

  toRecipientDto(recipient: ClientEmailCampaignRecipient): ClientEmailCampaignRecipientDto {
    return {
      id: recipient.id,
      campaignId: recipient.campaignId,
      clientId: recipient.clientId,
      email: recipient.email,
      name: recipient.name,
      status: recipient.status,
      eligibilityLevel: recipient.eligibilityLevel,
      eligibilityReason: recipient.eligibilityReason,
      skipReason: recipient.skipReason,
      overrideUsed: recipient.overrideUsed,
      overrideReason: recipient.overrideReason,
      overrideByUserId: recipient.overrideByUserId,
      overrideAt: recipient.overrideAt?.toISOString() ?? null,
      sentAt: recipient.sentAt?.toISOString() ?? null,
      failureReason: recipient.failureReason,
      createdAt: recipient.createdAt.toISOString(),
      updatedAt: recipient.updatedAt.toISOString(),
    };
  }

  toDetailsDto(
    campaign: ClientEmailCampaign,
    recipients: PaginatedResult<ClientEmailCampaignRecipient>
  ): ClientEmailCampaignDetailsDto {
    return {
      campaign: this.toCampaignDto(campaign),
      recipients: {
        items: recipients.items.map(item => this.toRecipientDto(item)),
        total: recipients.total,
        page: recipients.page,
        pageSize: recipients.pageSize,
      },
    };
  }

  private toRecipientPreviewDto(item: RecipientPreview): RecipientPreviewDto {
    return {
      clientId: item.clientId,
      clientName: item.clientName,
      email: item.email,
      normalizedEmail: item.normalizedEmail,
      eligibilityLevel: item.eligibilityLevel,
      eligibilityReason: item.eligibilityReason,
      canOverride: item.canOverride,
    };
  }
}
