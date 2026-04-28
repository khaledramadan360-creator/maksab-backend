import { ClientEmailCampaignValidationError } from './errors';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class EmailAddress {
  private constructor(private readonly value: string) {}

  static parse(rawValue: string): EmailAddress {
    const normalized = rawValue.trim().toLowerCase();
    if (!normalized || normalized.includes(' ') || !EMAIL_REGEX.test(normalized)) {
      throw new ClientEmailCampaignValidationError('Invalid email address');
    }

    return new EmailAddress(normalized);
  }

  static tryNormalize(rawValue: string | null | undefined): string | null {
    if (!rawValue || rawValue.trim() === '') {
      return null;
    }

    const normalized = rawValue.trim().toLowerCase();
    if (normalized.includes(' ') || !EMAIL_REGEX.test(normalized)) {
      return null;
    }

    return normalized;
  }

  toString(): string {
    return this.value;
  }
}

export class CampaignTitle {
  static parse(rawValue: string): string {
    const value = rawValue.trim();
    if (!value || value.length > 255) {
      throw new ClientEmailCampaignValidationError('Campaign title is required and must be 255 characters or fewer');
    }
    return value;
  }
}

export class EmailSubject {
  static parse(rawValue: string): string {
    const value = rawValue.trim();
    if (!value || value.length > 255) {
      throw new ClientEmailCampaignValidationError('Email subject is required and must be 255 characters or fewer');
    }
    return value;
  }
}

export class EmailContent {
  static parse(htmlContent?: string | null, textContent?: string | null): {
    htmlContent: string | null;
    textContent: string | null;
  } {
    const html = htmlContent?.trim() || null;
    const text = textContent?.trim() || null;

    if (!html && !text) {
      throw new ClientEmailCampaignValidationError('Either htmlContent or textContent is required');
    }

    return { htmlContent: html, textContent: text };
  }
}

export class SenderName {
  static parse(rawValue: string): string {
    const value = rawValue.trim();
    if (!value || value.length > 255) {
      throw new ClientEmailCampaignValidationError('Sender name is required and must be 255 characters or fewer');
    }
    return value;
  }
}

export class OverrideReason {
  static parse(rawValue: string | null | undefined): string {
    const value = rawValue?.trim() || '';
    if (!value || value.length > 500) {
      throw new ClientEmailCampaignValidationError('Override reason is required and must be 500 characters or fewer');
    }
    return value;
  }
}
