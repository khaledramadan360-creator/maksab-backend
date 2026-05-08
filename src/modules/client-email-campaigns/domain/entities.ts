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
} from './enums';

export interface CampaignClient {
  id: string;
  name: string;
  email: string | null;
  ownerUserId: string;
  saudiCity: string | null;
}

export interface ClientEmailCampaign {
  id: string;
  title: string;
  subject: string;
  htmlContent: string | null;
  textContent: string | null;
  senderName: string;
  senderEmail: string;
  status: CampaignStatus;
  provider: EmailCampaignProvider;
  providerCampaignId: string | null;
  providerListId: string | null;
  totalSelected: number;
  sendableCount: number;
  warningCount: number;
  blockedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  overrideCount: number;
  requestedByUserId: string;
  failureReason: string | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientEmailCampaignRecipient {
  id: string;
  campaignId: string;
  clientId: string;
  email: string | null;
  name: string | null;
  status: RecipientStatus;
  eligibilityLevel: EligibilityLevel;
  eligibilityReason: EligibilityReason | null;
  skipReason: EligibilityReason | null;
  provider: EmailCampaignProvider;
  providerContactId: string | null;
  providerMessageId: string | null;
  failureReason: string | null;
  overrideUsed: boolean;
  overrideReason: string | null;
  overrideByUserId: string | null;
  overrideAt: Date | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  firstOpenedAt: Date | null;
  lastOpenedAt: Date | null;
  openCount: number;
  proxyOpenedAt: Date | null;
  proxyOpenCount: number;
  firstClickedAt: Date | null;
  lastClickedAt: Date | null;
  clickCount: number;
  lastClickedUrl: string | null;
  repliedAt: Date | null;
  replyCount: number;
  latestReplyText: string | null;
  latestReplySubject: string | null;
  latestReplyFromEmail: string | null;
  bouncedAt: Date | null;
  lastBounceType: RecipientEventType.HardBounced | RecipientEventType.SoftBounced | null;
  unsubscribedAt: Date | null;
  complainedAt: Date | null;
  lastEventAt: Date | null;
  lastEventType: RecipientEventType | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientEmailCampaignRecipientEvent {
  id: string;
  campaignId: string;
  recipientId: string;
  clientId: string;
  provider: EmailCampaignProvider;
  source: RecipientEventSource;
  providerEventKey: string;
  providerCampaignId: string | null;
  providerMessageId: string | null;
  eventType: RecipientEventType;
  eventAt: Date;
  linkUrl: string | null;
  reason: string | null;
  replyText: string | null;
  replySubject: string | null;
  replyFromEmail: string | null;
  payload: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientEmailCampaignTrackingSummary {
  deliveredCount: number;
  openedCount: number;
  proxyOpenedCount: number;
  clickedCount: number;
  hardBouncedCount: number;
  softBouncedCount: number;
  unsubscribedCount: number;
  complainedCount: number;
  lastEventAt: Date | null;
}

export interface EmailSuppression {
  id: string;
  email: string;
  reason: EligibilityReason | string;
  level: SuppressionLevel;
  source: SuppressionSource | string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipientPreview {
  clientId: string;
  clientName: string | null;
  email: string | null;
  normalizedEmail: string | null;
  ownerUserId: string | null;
  eligibilityLevel: EligibilityLevel;
  eligibilityReason: EligibilityReason | null;
  canOverride: boolean;
}

export interface CampaignCounts {
  totalSelected: number;
  sendableCount: number;
  warningCount: number;
  blockedCount: number;
  overrideCount: number;
  skippedCount: number;
}
