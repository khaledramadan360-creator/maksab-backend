import { EmailAddress } from '../../domain/value-objects';
import {
  BrevoMarketingGateway,
  ClientCampaignClientRepository,
  ClientEmailCampaignAuditLogRepository,
  ClientEmailCampaignRecipientRepository,
  ClientEmailCampaignRepository,
  EmailSuppressionRepository,
} from '../../domain/repositories';
import {
  CampaignClient,
  RecipientPreview,
} from '../../domain/entities';
import {
  CampaignStatus,
  ClientEmailCampaignAuditAction,
  EligibilityLevel,
  EmailCampaignProvider,
  RecipientStatus,
} from '../../domain/enums';
import {
  ClientsNotFoundError,
  InvalidOverrideTargetError,
  NoSendableRecipientsError,
  OverrideReasonRequiredError,
} from '../../domain/errors';
import {
  ClientEmailCampaignPermissionService,
  ClientEmailOverridePolicyService,
  ClientEmailRecipientEligibilityService,
} from '../../domain/services';
import { ClientEmailCampaignInputService } from '../services/client-email-campaign-input.service';
import {
  SendClientEmailCampaignRequestDto,
  SendClientEmailCampaignResponseDto,
} from '../../public/client-email-campaigns.types';

export class SendClientEmailCampaignUseCase {
  constructor(
    private readonly clientRepo: ClientCampaignClientRepository,
    private readonly campaignRepo: ClientEmailCampaignRepository,
    private readonly recipientRepo: ClientEmailCampaignRecipientRepository,
    private readonly suppressionRepo: EmailSuppressionRepository,
    private readonly auditRepo: ClientEmailCampaignAuditLogRepository,
    private readonly brevoGateway: BrevoMarketingGateway,
    private readonly permissionService: ClientEmailCampaignPermissionService,
    private readonly overridePolicy: ClientEmailOverridePolicyService,
    private readonly eligibilityService: ClientEmailRecipientEligibilityService,
    private readonly inputService: ClientEmailCampaignInputService
  ) {}

  async execute(input: SendClientEmailCampaignRequestDto): Promise<SendClientEmailCampaignResponseDto> {
    this.permissionService.assertCanSend(input.requestedByUser.role);
    const normalized = this.inputService.normalize(input);
    const overrideClientIds = Array.from(new Set(input.overrideWarningClientIds ?? []));
    const overrideReason = overrideClientIds.length > 0
      ? this.inputService.normalizeOverrideReason(input.overrideReason)
      : null;

    if (overrideClientIds.length > 0 && !overrideReason) {
      throw new OverrideReasonRequiredError();
    }

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

    this.validateOverrides(previews, overrideClientIds, input.requestedByUser.role);

    const finalRecipients = previews.filter(item =>
      item.eligibilityLevel === EligibilityLevel.Sendable ||
      (item.eligibilityLevel === EligibilityLevel.Warning && overrideClientIds.includes(item.clientId))
    );

    if (finalRecipients.length === 0) {
      throw new NoSendableRecipientsError();
    }

    const sendableCount = previews.filter(item => item.eligibilityLevel === EligibilityLevel.Sendable).length;
    const warningCount = previews.filter(item => item.eligibilityLevel === EligibilityLevel.Warning).length;
    const blockedCount = previews.filter(item => item.eligibilityLevel === EligibilityLevel.Blocked).length;
    const overrideCount = finalRecipients.filter(item => item.eligibilityLevel === EligibilityLevel.Warning).length;
    const skippedCount = previews.length - finalRecipients.length;

    const campaign = await this.campaignRepo.create({
      title: normalized.title,
      subject: normalized.subject,
      htmlContent: normalized.htmlContent,
      textContent: normalized.textContent,
      senderName: normalized.senderName,
      senderEmail: normalized.senderEmail,
      status: CampaignStatus.Draft,
      provider: EmailCampaignProvider.Brevo,
      totalSelected: previews.length,
      sendableCount,
      warningCount,
      blockedCount,
      sentCount: 0,
      failedCount: 0,
      skippedCount,
      overrideCount,
      requestedByUserId: input.requestedByUser.userId,
    });

    const recipients = await this.recipientRepo.bulkCreate(
      previews.map(preview => {
        const isFinal = finalRecipients.some(item => item.clientId === preview.clientId);
        const overrideUsed = preview.eligibilityLevel === EligibilityLevel.Warning && overrideClientIds.includes(preview.clientId);

        return {
          campaignId: campaign.id,
          clientId: preview.clientId,
          email: preview.normalizedEmail,
          name: preview.clientName,
          status: isFinal
            ? RecipientStatus.Pending
            : preview.eligibilityLevel === EligibilityLevel.Warning
              ? RecipientStatus.WarningNotSelected
              : RecipientStatus.Blocked,
          eligibilityLevel: preview.eligibilityLevel,
          eligibilityReason: preview.eligibilityReason,
          skipReason: isFinal ? null : preview.eligibilityReason,
          provider: EmailCampaignProvider.Brevo,
          overrideUsed,
          overrideReason: overrideUsed ? overrideReason : null,
          overrideByUserId: overrideUsed ? input.requestedByUser.userId : null,
          overrideAt: overrideUsed ? new Date() : null,
        };
      })
    );

    await this.auditRepo.createAuditLog({
      actorUserId: input.requestedByUser.userId,
      action: ClientEmailCampaignAuditAction.Created,
      entityType: 'client_email_campaign',
      entityId: campaign.id,
      metadata: { totalSelected: previews.length, sendableCount, warningCount, blockedCount, overrideCount },
    });

    if (overrideCount > 0) {
      await this.auditRepo.createAuditLog({
        actorUserId: input.requestedByUser.userId,
        action: ClientEmailCampaignAuditAction.OverrideUsed,
        entityType: 'client_email_campaign',
        entityId: campaign.id,
        metadata: { overrideClientIds, overrideReason },
      });
    }

    await this.campaignRepo.markSending(campaign.id);
    await this.auditRepo.createAuditLog({
      actorUserId: input.requestedByUser.userId,
      action: ClientEmailCampaignAuditAction.SendingStarted,
      entityType: 'client_email_campaign',
      entityId: campaign.id,
      metadata: { finalRecipientCount: finalRecipients.length },
    });

    try {
      const result = await this.brevoGateway.sendCampaign({
        title: normalized.title,
        subject: normalized.subject,
        htmlContent: normalized.htmlContent,
        textContent: normalized.textContent,
        senderName: normalized.senderName,
        senderEmail: normalized.senderEmail,
        recipients: this.toBrevoRecipients(finalRecipients, clients),
      });

      const failedEmailSet = new Set((result.failures ?? []).map(item => item.email.toLowerCase()));
      for (const recipient of recipients) {
        if (recipient.status !== RecipientStatus.Pending || !recipient.email) {
          continue;
        }

        if (failedEmailSet.has(recipient.email.toLowerCase())) {
          const failure = result.failures?.find(item => item.email.toLowerCase() === recipient.email?.toLowerCase());
          await this.recipientRepo.markFailed(recipient.id, failure?.reason ?? 'Provider rejected recipient');
        } else {
          await this.recipientRepo.markSent(recipient.id, {
            providerMessageId: result.providerCampaignId ?? null,
          });
        }
      }

      const failedCount = result.failedCount;
      const sentCount = result.sentCount;
      const finalCampaign = failedCount > 0
        ? await this.campaignRepo.markPartiallyFailed(campaign.id, {
            providerCampaignId: result.providerCampaignId ?? null,
            providerListId: result.providerListId ?? null,
            sentCount,
            failedCount,
            skippedCount,
            failureReason: 'Some recipients were rejected by Brevo',
          })
        : await this.campaignRepo.markSent(campaign.id, {
            providerCampaignId: result.providerCampaignId ?? null,
            providerListId: result.providerListId ?? null,
            sentCount,
            failedCount,
            skippedCount,
          });

      await this.auditRepo.createAuditLog({
        actorUserId: input.requestedByUser.userId,
        action: failedCount > 0
          ? ClientEmailCampaignAuditAction.PartiallyFailed
          : ClientEmailCampaignAuditAction.Sent,
        entityType: 'client_email_campaign',
        entityId: campaign.id,
        metadata: {
          providerCampaignId: result.providerCampaignId,
          providerListId: result.providerListId,
          sentCount,
          failedCount,
          skippedCount,
        },
      });

      return {
        campaignId: finalCampaign.id,
        status: finalCampaign.status as SendClientEmailCampaignResponseDto['status'],
        totalSelected: finalCampaign.totalSelected,
        sendableCount: finalCampaign.sendableCount,
        warningCount: finalCampaign.warningCount,
        blockedCount: finalCampaign.blockedCount,
        overrideCount: finalCampaign.overrideCount,
        sentCount: finalCampaign.sentCount,
        failedCount: finalCampaign.failedCount,
        skippedCount: finalCampaign.skippedCount,
        providerCampaignId: finalCampaign.providerCampaignId,
        providerListId: finalCampaign.providerListId,
      };
    } catch (error: any) {
      for (const recipient of recipients) {
        if (recipient.status === RecipientStatus.Pending) {
          await this.recipientRepo.markFailed(recipient.id, error?.message ?? 'Brevo dispatch failed');
        }
      }
      await this.campaignRepo.markFailed(campaign.id, error?.message ?? 'Brevo dispatch failed');
      await this.auditRepo.createAuditLog({
        actorUserId: input.requestedByUser.userId,
        action: ClientEmailCampaignAuditAction.Failed,
        entityType: 'client_email_campaign',
        entityId: campaign.id,
        metadata: { reason: error?.message ?? 'Brevo dispatch failed' },
      });
      throw error;
    }
  }

  private validateOverrides(previews: RecipientPreview[], overrideClientIds: string[], actorRole: string): void {
    for (const clientId of overrideClientIds) {
      const preview = previews.find(item => item.clientId === clientId);
      if (!preview || preview.eligibilityLevel !== EligibilityLevel.Warning) {
        throw new InvalidOverrideTargetError();
      }

      this.overridePolicy.assertCanOverride(actorRole, preview.eligibilityReason);
    }
  }

  private toBrevoRecipients(previews: RecipientPreview[], clients: CampaignClient[]) {
    const clientById = new Map(clients.map(client => [client.id, client]));
    return previews.map(preview => {
      const client = clientById.get(preview.clientId);
      return {
        clientId: preview.clientId,
        email: preview.normalizedEmail!,
        name: preview.clientName,
        variables: {
          clientName: client?.name ?? preview.clientName,
          clientEmail: preview.normalizedEmail,
          clientCity: client?.saudiCity ?? null,
        },
      };
    });
  }
}
