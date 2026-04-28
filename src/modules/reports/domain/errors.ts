export class ReportDeliveryDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportDeliveryDomainError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ReportNotFoundError extends ReportDeliveryDomainError {
  constructor(message = 'Report not found') {
    super(message);
    this.name = 'ReportNotFoundError';
  }
}

export class ClientNotFoundError extends ReportDeliveryDomainError {
  constructor(message = 'Client not found') {
    super(message);
    this.name = 'ClientNotFoundError';
  }
}

export class ReportFileMissingError extends ReportDeliveryDomainError {
  constructor(message = 'Report PDF file is missing or not accessible') {
    super(message);
    this.name = 'ReportFileMissingError';
  }
}

export class ReportAccessDeniedError extends ReportDeliveryDomainError {
  constructor(message = 'You do not have permission to access this report') {
    super(message);
    this.name = 'ReportAccessDeniedError';
  }
}

export class InvalidRecipientPhoneError extends ReportDeliveryDomainError {
  constructor(message = 'Recipient phone is invalid') {
    super(message);
    this.name = 'InvalidRecipientPhoneError';
  }
}

export class ReportDeliveryNotAllowedError extends ReportDeliveryDomainError {
  constructor(message = 'Report delivery is not allowed') {
    super(message);
    this.name = 'ReportDeliveryNotAllowedError';
  }
}

export class WhatChimpRejectedError extends ReportDeliveryDomainError {
  readonly providerStatusCode: string | null;

  constructor(message = 'WhatChimp rejected the delivery request', providerStatusCode: string | null = null) {
    super(message);
    this.name = 'WhatChimpRejectedError';
    this.providerStatusCode = providerStatusCode;
  }
}

export class WhatChimpUnavailableError extends ReportDeliveryDomainError {
  constructor(message = 'WhatChimp is unavailable') {
    super(message);
    this.name = 'WhatChimpUnavailableError';
  }
}

export class WhatChimpTimeoutError extends ReportDeliveryDomainError {
  constructor(message = 'WhatChimp request timed out') {
    super(message);
    this.name = 'WhatChimpTimeoutError';
  }
}
