export enum EmailCampaignProvider {
  Brevo = 'brevo',
}

export enum CampaignStatus {
  Draft = 'draft',
  Previewed = 'previewed',
  Sending = 'sending',
  Sent = 'sent',
  PartiallyFailed = 'partially_failed',
  Failed = 'failed',
}

export enum RecipientStatus {
  Pending = 'pending',
  Sent = 'sent',
  Failed = 'failed',
  Skipped = 'skipped',
  Blocked = 'blocked',
  WarningNotSelected = 'warning_not_selected',
}

export enum EligibilityLevel {
  Sendable = 'sendable',
  Warning = 'warning',
  Blocked = 'blocked',
}

export enum EligibilityReason {
  MissingEmail = 'missing_email',
  InvalidFormat = 'invalid_format',
  DuplicateEmail = 'duplicate_email',
  UnknownStatus = 'unknown_status',
  UnverifiedEmail = 'unverified_email',
  RiskyEmail = 'risky_email',
  Suppressed = 'suppressed',
  Bounced = 'bounced',
  Complained = 'complained',
  Unsubscribed = 'unsubscribed',
  AccessDenied = 'access_denied',
  ProviderRejected = 'provider_rejected',
}

export enum SuppressionLevel {
  Warning = 'warning',
  Blocked = 'blocked',
}

export enum SuppressionSource {
  Manual = 'manual',
  Provider = 'provider',
  System = 'system',
}

export enum ClientEmailCampaignAuditAction {
  Previewed = 'client_email_campaign.previewed',
  Created = 'client_email_campaign.created',
  SendingStarted = 'client_email_campaign.sending_started',
  Sent = 'client_email_campaign.sent',
  PartiallyFailed = 'client_email_campaign.partially_failed',
  Failed = 'client_email_campaign.failed',
  RecipientBlocked = 'client_email_campaign.recipient_blocked',
  RecipientWarning = 'client_email_campaign.recipient_warning',
  OverrideUsed = 'client_email_campaign.override_used',
}
