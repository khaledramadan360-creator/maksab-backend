export class ClientEmailCampaignError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientEmailCampaignError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ClientEmailCampaignValidationError extends ClientEmailCampaignError {
  constructor(message: string) {
    super(message);
    this.name = 'ClientEmailCampaignValidationError';
  }
}

export class ClientEmailCampaignAccessDeniedError extends ClientEmailCampaignError {
  constructor(message = 'You do not have permission to perform this campaign action') {
    super(message);
    this.name = 'ClientEmailCampaignAccessDeniedError';
  }
}

export class ClientsNotFoundError extends ClientEmailCampaignError {
  constructor(message = 'One or more clients were not found') {
    super(message);
    this.name = 'ClientsNotFoundError';
  }
}

export class ClientEmailCampaignNotFoundError extends ClientEmailCampaignError {
  constructor(message = 'Client email campaign was not found') {
    super(message);
    this.name = 'ClientEmailCampaignNotFoundError';
  }
}

export class NoSendableRecipientsError extends ClientEmailCampaignError {
  constructor(message = 'No sendable recipients are available for this campaign') {
    super(message);
    this.name = 'NoSendableRecipientsError';
  }
}

export class InvalidOverrideTargetError extends ClientEmailCampaignError {
  constructor(message = 'One or more override targets are invalid') {
    super(message);
    this.name = 'InvalidOverrideTargetError';
  }
}

export class OverrideReasonRequiredError extends ClientEmailCampaignError {
  constructor(message = 'Override reason is required when overriding warning recipients') {
    super(message);
    this.name = 'OverrideReasonRequiredError';
  }
}

export class OverrideNotAllowedError extends ClientEmailCampaignError {
  constructor(message = 'Override is not allowed for one or more recipients') {
    super(message);
    this.name = 'OverrideNotAllowedError';
  }
}

export class BrevoMarketingDisabledError extends ClientEmailCampaignError {
  constructor(message = 'Brevo marketing dispatch is disabled') {
    super(message);
    this.name = 'BrevoMarketingDisabledError';
  }
}

export class BrevoMarketingRejectedError extends ClientEmailCampaignError {
  constructor(message = 'Brevo rejected the campaign request') {
    super(message);
    this.name = 'BrevoMarketingRejectedError';
  }
}

export class BrevoMarketingUnavailableError extends ClientEmailCampaignError {
  constructor(message = 'Brevo marketing service is unavailable') {
    super(message);
    this.name = 'BrevoMarketingUnavailableError';
  }
}

export class BrevoMarketingTimeoutError extends ClientEmailCampaignError {
  constructor(message = 'Brevo marketing request timed out') {
    super(message);
    this.name = 'BrevoMarketingTimeoutError';
  }
}

export class BrevoMarketingRateLimitedError extends ClientEmailCampaignError {
  constructor(message = 'Brevo marketing rate limit was reached') {
    super(message);
    this.name = 'BrevoMarketingRateLimitedError';
  }
}
