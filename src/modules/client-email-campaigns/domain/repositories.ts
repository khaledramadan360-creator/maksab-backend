import {
  CampaignStatus,
  ClientEmailCampaignAuditAction,
  EligibilityReason,
  EmailCampaignProvider,
  RecipientStatus,
  SuppressionLevel,
} from './enums';
import {
  CampaignClient,
  ClientEmailCampaign,
  ClientEmailCampaignRecipient,
  EmailSuppression,
} from './entities';

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ClientEmailCampaignCreateRecord {
  title: string;
  subject: string;
  htmlContent: string | null;
  textContent: string | null;
  senderName: string;
  senderEmail: string;
  status: CampaignStatus;
  provider: EmailCampaignProvider;
  totalSelected: number;
  sendableCount: number;
  warningCount: number;
  blockedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  overrideCount: number;
  requestedByUserId: string;
}

export interface CampaignSendResultPatch {
  providerCampaignId?: string | null;
  providerListId?: string | null;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  failureReason?: string | null;
}

export interface ClientEmailCampaignListFilters {
  requestedByUserId?: string;
  status?: CampaignStatus;
  createdAtFrom?: Date;
  createdAtTo?: Date;
}

export interface ClientEmailCampaignRepository {
  create(record: ClientEmailCampaignCreateRecord): Promise<ClientEmailCampaign>;
  markSending(campaignId: string): Promise<ClientEmailCampaign>;
  markSent(campaignId: string, result: CampaignSendResultPatch): Promise<ClientEmailCampaign>;
  markPartiallyFailed(campaignId: string, result: CampaignSendResultPatch): Promise<ClientEmailCampaign>;
  markFailed(campaignId: string, reason: string): Promise<ClientEmailCampaign>;
  findById(campaignId: string): Promise<ClientEmailCampaign | null>;
  list(
    filters: ClientEmailCampaignListFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<ClientEmailCampaign>>;
}

export interface ClientEmailCampaignRecipientCreateRecord {
  campaignId: string;
  clientId: string;
  email: string | null;
  name: string | null;
  status: RecipientStatus;
  eligibilityLevel: string;
  eligibilityReason: EligibilityReason | null;
  skipReason: EligibilityReason | null;
  provider: EmailCampaignProvider;
  overrideUsed: boolean;
  overrideReason: string | null;
  overrideByUserId: string | null;
  overrideAt: Date | null;
}

export interface RecipientProviderData {
  providerContactId?: string | null;
  providerMessageId?: string | null;
  failureReason?: string | null;
}

export interface ClientEmailCampaignRecipientRepository {
  bulkCreate(records: ClientEmailCampaignRecipientCreateRecord[]): Promise<ClientEmailCampaignRecipient[]>;
  markSent(recipientId: string, providerData?: RecipientProviderData): Promise<void>;
  markFailed(recipientId: string, reason: string, providerData?: RecipientProviderData): Promise<void>;
  listByCampaignId(
    campaignId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResult<ClientEmailCampaignRecipient>>;
}

export interface EmailSuppressionRepository {
  findByEmails(emails: string[]): Promise<EmailSuppression[]>;
  createOrUpdate(email: string, reason: EligibilityReason | string, level: SuppressionLevel, source: string): Promise<EmailSuppression>;
}

export interface ClientCampaignClientRepository {
  findByIds(clientIds: string[]): Promise<CampaignClient[]>;
}

export interface BrevoMarketingRecipient {
  clientId: string;
  email: string;
  name?: string | null;
  variables: {
    clientName?: string | null;
    clientEmail?: string | null;
    clientCity?: string | null;
  };
}

export interface BrevoMarketingSendCommand {
  title: string;
  subject: string;
  htmlContent?: string | null;
  textContent?: string | null;
  senderName: string;
  senderEmail: string;
  recipients: BrevoMarketingRecipient[];
}

export interface BrevoMarketingSendResult {
  accepted: boolean;
  providerCampaignId?: string | null;
  providerListId?: string | null;
  sentCount: number;
  failedCount: number;
  failures?: Array<{
    email: string;
    reason: string;
  }>;
}

export interface BrevoMarketingGateway {
  sendCampaign(command: BrevoMarketingSendCommand): Promise<BrevoMarketingSendResult>;
}

export interface ClientEmailCampaignAuditLogEntry {
  actorUserId: string | null;
  action: ClientEmailCampaignAuditAction;
  entityType: 'client_email_campaign' | 'client_email_campaign_recipient';
  entityId: string;
  metadata: Record<string, unknown>;
}

export interface ClientEmailCampaignAuditLogRepository {
  createAuditLog(entry: ClientEmailCampaignAuditLogEntry): Promise<void>;
}
