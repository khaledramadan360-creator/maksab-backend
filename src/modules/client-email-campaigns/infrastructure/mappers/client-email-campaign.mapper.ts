import {
  CampaignStatus,
  EligibilityLevel,
  EligibilityReason,
  EmailCampaignProvider,
  RecipientEventSource,
  RecipientEventType,
  RecipientStatus,
  SuppressionLevel,
  SuppressionSource,
} from '../../domain/enums';
import {
  ClientEmailCampaign,
  ClientEmailCampaignRecipientEvent,
  ClientEmailCampaignRecipient,
  EmailSuppression,
} from '../../domain/entities';
import { ClientEmailCampaignModel } from '../persistence/models/client-email-campaign.model';
import { ClientEmailCampaignRecipientEventModel } from '../persistence/models/client-email-campaign-recipient-event.model';
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
      deliveredAt: model.deliveredAt,
      firstOpenedAt: model.firstOpenedAt,
      lastOpenedAt: model.lastOpenedAt,
      openCount: model.openCount,
      proxyOpenedAt: model.proxyOpenedAt,
      proxyOpenCount: model.proxyOpenCount,
      firstClickedAt: model.firstClickedAt,
      lastClickedAt: model.lastClickedAt,
      clickCount: model.clickCount,
      lastClickedUrl: model.lastClickedUrl,
      repliedAt: model.repliedAt,
      replyCount: model.replyCount,
      latestReplyText: model.latestReplyText,
      latestReplySubject: model.latestReplySubject,
      latestReplyFromEmail: model.latestReplyFromEmail,
      bouncedAt: model.bouncedAt,
      lastBounceType: model.lastBounceType as RecipientEventType.HardBounced | RecipientEventType.SoftBounced | null,
      unsubscribedAt: model.unsubscribedAt,
      complainedAt: model.complainedAt,
      lastEventAt: model.lastEventAt,
      lastEventType: model.lastEventType as RecipientEventType | null,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  static recipientEventToDomain(model: ClientEmailCampaignRecipientEventModel): ClientEmailCampaignRecipientEvent {
    return {
      id: model.id,
      campaignId: model.campaignId,
      recipientId: model.recipientId,
      clientId: model.clientId,
      provider: model.provider as EmailCampaignProvider,
      source: model.source as RecipientEventSource,
      providerEventKey: model.providerEventKey,
      providerCampaignId: model.providerCampaignId,
      providerMessageId: model.providerMessageId,
      eventType: model.eventType as RecipientEventType,
      eventAt: model.eventAt,
      linkUrl: model.linkUrl,
      reason: model.reason,
      replyText: model.replyText,
      replySubject: model.replySubject,
      replyFromEmail: model.replyFromEmail,
      payload: model.payload,
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
