import {
  ClientEmailCampaignRecipientEventRepository,
  ClientEmailCampaignRecipientRepository,
  ClientEmailCampaignRepository,
  EmailSuppressionRepository,
  RecipientTrackingUpdatePatch,
} from '../../domain/repositories';
import { ClientEmailCampaignRecipient } from '../../domain/entities';
import {
  EligibilityReason,
  EmailCampaignProvider,
  RecipientEventSource,
  RecipientEventType,
  SuppressionLevel,
  SuppressionSource,
} from '../../domain/enums';
import { EmailAddress } from '../../domain/value-objects';

type RawWebhookPayload = Record<string, unknown>;

interface NormalizedMarketingEvent {
  providerCampaignId: string;
  internalCampaignId: string | null;
  email: string;
  eventType: RecipientEventType;
  eventAt: Date;
  providerEventKey: string;
  linkUrl: string | null;
  reason: string | null;
  payload: string | null;
}

export class HandleBrevoMarketingWebhookUseCase {
  constructor(
    private readonly campaignRepo: ClientEmailCampaignRepository,
    private readonly recipientRepo: ClientEmailCampaignRecipientRepository,
    private readonly eventRepo: ClientEmailCampaignRecipientEventRepository,
    private readonly suppressionRepo: EmailSuppressionRepository
  ) {}

  async execute(input: { payload: unknown }): Promise<void> {
    const events = this.extractPayloads(input.payload);

    for (const payload of events) {
      const normalized = this.normalizeEvent(payload);
      if (!normalized) {
        continue;
      }

      const campaign =
        await this.campaignRepo.findByProviderCampaignId(normalized.providerCampaignId) ||
        (normalized.internalCampaignId ? await this.campaignRepo.findById(normalized.internalCampaignId) : null);
      if (!campaign) {
        continue;
      }

      const recipient = await this.recipientRepo.findByCampaignAndEmail(campaign.id, normalized.email);
      if (!recipient) {
        continue;
      }

      const { created } = await this.eventRepo.createIfAbsent({
        campaignId: campaign.id,
        recipientId: recipient.id,
        clientId: recipient.clientId,
        provider: EmailCampaignProvider.Brevo,
        source: RecipientEventSource.Marketing,
        providerEventKey: normalized.providerEventKey,
        providerCampaignId: normalized.providerCampaignId,
        providerMessageId: recipient.providerMessageId,
        eventType: normalized.eventType,
        eventAt: normalized.eventAt,
        linkUrl: normalized.linkUrl,
        reason: normalized.reason,
        payload: normalized.payload,
      });

      if (!created) {
        continue;
      }

      await this.recipientRepo.applyTrackingUpdate(
        recipient.id,
        this.buildTrackingPatch(recipient, normalized)
      );
      await this.updateSuppression(normalized);
    }
  }

  private extractPayloads(payload: unknown): RawWebhookPayload[] {
    if (Array.isArray(payload)) {
      return payload.filter(this.isRecord);
    }

    return this.isRecord(payload) ? [payload] : [];
  }

  private normalizeEvent(payload: RawWebhookPayload): NormalizedMarketingEvent | null {
    const providerCampaignId = this.readString(payload['camp_id']) || this.readString(payload['campaignId']);
    const internalCampaignId = this.extractInternalCampaignId(payload);
    const email = this.normalizeEmail(payload['email']);
    const eventType = this.mapEventType(this.readString(payload['event']) || this.readString(payload['type']));

    if (!providerCampaignId || !email || !eventType) {
      return null;
    }

    const eventAt = this.parseEventDate(payload) || new Date();
    const eventId = this.readString(payload['id']);
    const linkUrl = this.readString(payload['URL']) || this.readString(payload['url']) || this.readString(payload['link']);
    const reason = this.readString(payload['reason']);
    const providerEventKey = eventId
      ? `marketing:${eventType}:${eventId}`
      : `marketing:${eventType}:${providerCampaignId}:${email}:${eventAt.getTime()}:${linkUrl || ''}:${reason || ''}`;

    return {
      providerCampaignId,
      internalCampaignId,
      email,
      eventType,
      eventAt,
      providerEventKey,
      linkUrl: linkUrl || null,
      reason: reason || null,
      payload: this.safeStringify(payload),
    };
  }

  private extractInternalCampaignId(payload: RawWebhookPayload): string | null {
    const tagCandidates = [
      this.readString(payload['tag']),
      ...this.readStringArray(payload['tags']),
    ].filter((value): value is string => !!value);

    for (const tag of tagCandidates) {
      const match = /client-email-campaign:([0-9a-f-]{36})/i.exec(tag);
      if (match) {
        return match[1].toLowerCase();
      }
    }

    return null;
  }

  private buildTrackingPatch(
    recipient: ClientEmailCampaignRecipient,
    event: NormalizedMarketingEvent
  ): RecipientTrackingUpdatePatch {
    const nextLastEventAt = this.maxDate(recipient.lastEventAt, event.eventAt);
    const isNewestEvent = !recipient.lastEventAt || event.eventAt.getTime() >= recipient.lastEventAt.getTime();
    const patch: RecipientTrackingUpdatePatch = {
      lastEventAt: nextLastEventAt,
      lastEventType: isNewestEvent ? event.eventType : recipient.lastEventType,
    };

    switch (event.eventType) {
      case RecipientEventType.Delivered:
        patch['deliveredAt'] = recipient.deliveredAt || event.eventAt;
        break;
      case RecipientEventType.Opened:
        patch['firstOpenedAt'] = this.minDate(recipient.firstOpenedAt, event.eventAt);
        patch['lastOpenedAt'] = this.maxDate(recipient.lastOpenedAt, event.eventAt);
        patch['openCount'] = recipient.openCount + 1;
        break;
      case RecipientEventType.ProxyOpened:
        patch['proxyOpenedAt'] = this.maxDate(recipient.proxyOpenedAt, event.eventAt);
        patch['proxyOpenCount'] = recipient.proxyOpenCount + 1;
        break;
      case RecipientEventType.Clicked:
        patch['firstClickedAt'] = this.minDate(recipient.firstClickedAt, event.eventAt);
        patch['lastClickedAt'] = this.maxDate(recipient.lastClickedAt, event.eventAt);
        patch['clickCount'] = recipient.clickCount + 1;
        patch['lastClickedUrl'] = event.linkUrl || recipient.lastClickedUrl;
        break;
      case RecipientEventType.SoftBounced:
      case RecipientEventType.HardBounced:
        patch['bouncedAt'] = recipient.bouncedAt || event.eventAt;
        patch['lastBounceType'] = event.eventType;
        patch['failureReason'] = event.reason || recipient.failureReason;
        break;
      case RecipientEventType.Unsubscribed:
        patch['unsubscribedAt'] = recipient.unsubscribedAt || event.eventAt;
        break;
      case RecipientEventType.Complained:
        patch['complainedAt'] = recipient.complainedAt || event.eventAt;
        patch['failureReason'] = event.reason || recipient.failureReason || 'Recipient marked campaign as spam';
        break;
      default:
        break;
    }

    return patch;
  }

  private async updateSuppression(event: NormalizedMarketingEvent): Promise<void> {
    switch (event.eventType) {
      case RecipientEventType.HardBounced:
        await this.suppressionRepo.createOrUpdate(
          event.email,
          EligibilityReason.Bounced,
          SuppressionLevel.Blocked,
          SuppressionSource.Provider
        );
        break;
      case RecipientEventType.SoftBounced:
        await this.suppressionRepo.createOrUpdate(
          event.email,
          EligibilityReason.Bounced,
          SuppressionLevel.Warning,
          SuppressionSource.Provider
        );
        break;
      case RecipientEventType.Unsubscribed:
        await this.suppressionRepo.createOrUpdate(
          event.email,
          EligibilityReason.Unsubscribed,
          SuppressionLevel.Blocked,
          SuppressionSource.Provider
        );
        break;
      case RecipientEventType.Complained:
        await this.suppressionRepo.createOrUpdate(
          event.email,
          EligibilityReason.Complained,
          SuppressionLevel.Blocked,
          SuppressionSource.Provider
        );
        break;
      default:
        break;
    }
  }

  private mapEventType(rawEvent: string | null): RecipientEventType | null {
    const normalized = String(rawEvent || '')
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');

    switch (normalized) {
      case 'delivered':
        return RecipientEventType.Delivered;
      case 'opened':
      case 'open':
        return RecipientEventType.Opened;
      case 'proxy_open':
      case 'proxy_opened':
      case 'proxyopen':
        return RecipientEventType.ProxyOpened;
      case 'click':
      case 'clicked':
        return RecipientEventType.Clicked;
      case 'soft_bounce':
      case 'soft_bounced':
      case 'softbounce':
        return RecipientEventType.SoftBounced;
      case 'hard_bounce':
      case 'hard_bounced':
      case 'hardbounce':
        return RecipientEventType.HardBounced;
      case 'unsubscribe':
      case 'unsubscribed':
        return RecipientEventType.Unsubscribed;
      case 'spam':
      case 'complaint':
      case 'complained':
        return RecipientEventType.Complained;
      default:
        return null;
    }
  }

  private parseEventDate(payload: RawWebhookPayload): Date | null {
    const tsEvent = this.readNumber(payload['ts_event']) ?? this.readNumber(payload['ts']);
    if (typeof tsEvent === 'number' && Number.isFinite(tsEvent)) {
      return new Date(tsEvent * 1000);
    }

    const dateEvent = this.readString(payload['date_event']) || this.readString(payload['date']);
    if (dateEvent) {
      const parsed = new Date(dateEvent);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return null;
  }

  private normalizeEmail(rawEmail: unknown): string | null {
    const asString = this.readString(rawEmail);
    return EmailAddress.tryNormalize(asString) || (asString ? asString.trim().toLowerCase() : null);
  }

  private safeStringify(value: unknown): string | null {
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }

  private minDate(current: Date | null, next: Date): Date {
    if (!current) {
      return next;
    }

    return current.getTime() <= next.getTime() ? current : next;
  }

  private maxDate(current: Date | null, next: Date): Date {
    if (!current) {
      return next;
    }

    return current.getTime() >= next.getTime() ? current : next;
  }

  private readString(value: unknown): string | null {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }

    return null;
  }

  private readNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private readStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map(item => this.readString(item))
      .filter((item): item is string => !!item);
  }

  private isRecord = (value: unknown): value is RawWebhookPayload =>
    typeof value === 'object' && value !== null && !Array.isArray(value);
}
