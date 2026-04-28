import { InvalidRecipientPhoneError } from './errors';

export class RecipientPhone {
  private constructor(public readonly value: string) {}

  static create(rawValue: string): RecipientPhone {
    const normalized = normalizePhone(rawValue);

    if (!normalized) {
      throw new InvalidRecipientPhoneError();
    }

    return new RecipientPhone(normalized);
  }
}

export class RecipientName {
  private static readonly maxLength = 120;

  private constructor(public readonly value: string | null) {}

  static create(rawValue?: string | null): RecipientName {
    const normalized = String(rawValue || '').trim().replace(/\s+/g, ' ');

    if (!normalized) {
      return new RecipientName(null);
    }

    return new RecipientName(normalized.slice(0, RecipientName.maxLength));
  }
}

export class MessageText {
  private static readonly maxLength = 1024;

  private constructor(public readonly value: string | null) {}

  static create(rawValue?: string | null): MessageText {
    const normalized = String(rawValue || '').trim().replace(/\s+/g, ' ');

    if (!normalized) {
      return new MessageText(null);
    }

    return new MessageText(normalized.slice(0, MessageText.maxLength));
  }
}

function normalizePhone(rawValue: string): string | null {
  const asciiValue = toAsciiDigits(String(rawValue || '').trim());
  if (!asciiValue) {
    return null;
  }

  const withoutSeparators = asciiValue.replace(/[^\d+]/g, '');
  const plusNormalized = withoutSeparators.startsWith('00')
    ? `+${withoutSeparators.slice(2)}`
    : withoutSeparators;
  const e164Candidate = plusNormalized.startsWith('+')
    ? `+${plusNormalized.slice(1).replace(/\D/g, '')}`
    : plusNormalized.replace(/\D/g, '');

  if (/^\+[1-9]\d{7,14}$/.test(e164Candidate)) {
    return e164Candidate;
  }

  if (/^9665\d{8}$/.test(e164Candidate)) {
    return `+${e164Candidate}`;
  }

  if (/^05\d{8}$/.test(e164Candidate)) {
    return `+966${e164Candidate.slice(1)}`;
  }

  if (/^5\d{8}$/.test(e164Candidate)) {
    return `+966${e164Candidate}`;
  }

  // Egypt local mobile format: 01XXXXXXXXX -> +201XXXXXXXXX
  if (/^01\d{9}$/.test(e164Candidate)) {
    return `+20${e164Candidate.slice(1)}`;
  }

  // Generic international format without "+" prefix: 201234567890 -> +201234567890
  if (/^[1-9]\d{7,14}$/.test(e164Candidate)) {
    return `+${e164Candidate}`;
  }

  return null;
}

function toAsciiDigits(value: string): string {
  return value
    .replace(/[\u0660-\u0669]/g, digit => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, digit => String(digit.charCodeAt(0) - 0x06F0));
}
