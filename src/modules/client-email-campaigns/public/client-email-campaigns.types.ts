import {
  CampaignStatus,
  EligibilityLevel,
  EligibilityReason,
  EmailCampaignProvider,
  RecipientEventSource,
  RecipientEventType,
  RecipientStatus,
} from '../domain/enums';

export interface RequestActorContext {
  userId: string;
  role: string;
}

export interface ClientEmailCampaignBaseRequestDto {
  title: string;
  subject: string;
  htmlContent?: string | null;
  textContent?: string | null;
  senderName: string;
  senderEmail: string;
  clientIds: string[];
}

export interface PreviewClientEmailCampaignRequestDto extends ClientEmailCampaignBaseRequestDto {
  requestedByUser: RequestActorContext;
}

export interface SendClientEmailCampaignRequestDto extends ClientEmailCampaignBaseRequestDto {
  overrideWarningClientIds?: string[];
  overrideReason?: string | null;
  requestedByUser: RequestActorContext;
}

export interface RecipientPreviewDto {
  clientId: string;
  clientName: string | null;
  email: string | null;
  normalizedEmail: string | null;
  eligibilityLevel: EligibilityLevel;
  eligibilityReason: EligibilityReason | null;
  canOverride: boolean;
}

export interface PreviewClientEmailCampaignResponseDto {
  totalSelected: number;
  sendableCount: number;
  warningCount: number;
  blockedCount: number;
  breakdown: Record<string, number>;
  sendableRecipients: RecipientPreviewDto[];
  warningRecipients: RecipientPreviewDto[];
  blockedRecipients: RecipientPreviewDto[];
}

export interface SendClientEmailCampaignResponseDto {
  campaignId: string;
  status: CampaignStatus.Sent | CampaignStatus.PartiallyFailed | CampaignStatus.Failed;
  totalSelected: number;
  sendableCount: number;
  warningCount: number;
  blockedCount: number;
  overrideCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  providerCampaignId?: string | null;
  providerListId?: string | null;
}

export interface ClientEmailCampaignDto {
  id: string;
  title: string;
  subject: string;
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
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientEmailCampaignRecipientDto {
  id: string;
  campaignId: string;
  clientId: string;
  email: string | null;
  name: string | null;
  status: RecipientStatus;
  eligibilityLevel: EligibilityLevel;
  eligibilityReason: EligibilityReason | null;
  skipReason: EligibilityReason | null;
  overrideUsed: boolean;
  overrideReason: string | null;
  overrideByUserId: string | null;
  overrideAt: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  openCount: number;
  proxyOpenedAt: string | null;
  proxyOpenCount: number;
  firstClickedAt: string | null;
  lastClickedAt: string | null;
  clickCount: number;
  lastClickedUrl: string | null;
  bouncedAt: string | null;
  lastBounceType: RecipientEventType.HardBounced | RecipientEventType.SoftBounced | null;
  unsubscribedAt: string | null;
  complainedAt: string | null;
  lastEventAt: string | null;
  lastEventType: RecipientEventType | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientEmailCampaignTrackingSummaryDto {
  deliveredCount: number;
  openedCount: number;
  proxyOpenedCount: number;
  clickedCount: number;
  hardBouncedCount: number;
  softBouncedCount: number;
  unsubscribedCount: number;
  complainedCount: number;
  lastEventAt: string | null;
}

export interface ClientEmailCampaignRecipientEventDto {
  id: string;
  campaignId: string;
  recipientId: string;
  clientId: string;
  source: RecipientEventSource;
  eventType: RecipientEventType;
  eventAt: string;
  linkUrl: string | null;
  reason: string | null;
  providerCampaignId: string | null;
  providerMessageId: string | null;
  createdAt: string;
}

export interface ListClientEmailCampaignsQueryDto {
  page?: number;
  pageSize?: number;
  status?: CampaignStatus;
  createdAtFrom?: string;
  createdAtTo?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ListClientEmailCampaignsResponseDto {
  items: ClientEmailCampaignDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ClientEmailCampaignDetailsDto {
  campaign: ClientEmailCampaignDto;
  trackingSummary: ClientEmailCampaignTrackingSummaryDto;
  recipients: {
    items: ClientEmailCampaignRecipientDto[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface ClientEmailCampaignRecipientEventsDto {
  recipient: ClientEmailCampaignRecipientDto;
  events: {
    items: ClientEmailCampaignRecipientEventDto[];
    total: number;
    page: number;
    pageSize: number;
  };
}
