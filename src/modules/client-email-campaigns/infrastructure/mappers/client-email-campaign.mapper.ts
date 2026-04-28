import {
  CampaignStatus,
  EligibilityLevel,
  EligibilityReason,
  EmailCampaignProvider,
  RecipientStatus,
  SuppressionLevel,
  SuppressionSource,
} from '../../domain/enums';
import {
  ClientEmailCampaign,
  ClientEmailCampaignRecipient,
  EmailSuppression,
} from '../../domain/entities';
import { ClientEmailCampaignModel } from '../persistence/models/client-email-campaign.model';
import { ClientEmailCampaignRecipientModel } from '../persistence/models/client-email-campaign-recipient.model';
import { EmailSuppressionModel } from '../persistence/models/email-suppression.model';

export class ClientEmailCampaignMapper {
  static campaignToDomain(model: ClientEmailCampaignModel): ClientEmailCampaign {
    return {
      id: model.id,
      title: model.title,
      subject: model.subject,
      htmlContent: model.htmlContent,
      textContent: model.textContent,
      senderName: model.senderName,
      senderEmail: model.senderEmail,
      status: model.status as CampaignStatus,
      provider: model.provider as EmailCampaignProvider,
      providerCampaignId: model.providerCampaignId,
      providerListId: model.providerListId,
      totalSelected: model.totalSelected,
      sendableCount: model.sendableCount,
      warningCount: model.warningCount,
      blockedCount: model.blockedCount,
      sentCount: model.sentCount,
      failedCount: model.failedCount,
      skippedCount: model.skippedCount,
      overrideCount: model.overrideCount,
      requestedByUserId: model.requestedByUserId,
      failureReason: model.failureReason,
      sentAt: model.sentAt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  static recipientToDomain(model: ClientEmailCampaignRecipientModel): ClientEmailCampaignRecipient {
    return {
      id: model.id,
      campaignId: model.campaignId,
      clientId: model.clientId,
      email: model.email,
      name: model.name,
      status: model.status as RecipientStatus,
      eligibilityLevel: model.eligibilityLevel as EligibilityLevel,
      eligibilityReason: model.eligibilityReason as EligibilityReason | null,
      skipReason: model.skipReason as EligibilityReason | null,
      provider: model.provider as EmailCampaignProvider,
      providerContactId: model.providerContactId,
      providerMessageId: model.providerMessageId,
      failureReason: model.failureReason,
      overrideUsed: model.overrideUsed,
      overrideReason: model.overrideReason,
      overrideByUserId: model.overrideByUserId,
      overrideAt: model.overrideAt,
      sentAt: model.sentAt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  static suppressionToDomain(model: EmailSuppressionModel): EmailSuppression {
    return {
      id: model.id,
      email: model.email,
      reason: model.reason,
      level: model.level as SuppressionLevel,
      source: model.source as SuppressionSource,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
