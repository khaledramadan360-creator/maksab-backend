import {
  ProviderDispatchResult,
  WhatChimpGateway,
  WhatChimpPhoneNumberOption,
  WhatChimpSendDocumentCommand,
} from '../../domain/repositories';
import { WhatChimpTimeoutError, WhatChimpUnavailableError } from '../../domain/errors';

interface JsonPostResult {
  response: Response;
  responseText: string;
  parsedBody: any;
}

interface JsonPostAttempt {
  url: string;
  payload: Record<string, unknown>;
}

interface RawWhatChimpPhoneNumberOption {
  id?: unknown;
  name?: unknown;
  phoneNumber?: unknown;
  phone?: unknown;
  label?: unknown;
  isDefault?: unknown;
}

interface ResolvedWhatChimpSenderSelection {
  requestedValue: string | null;
  resolvedAccountId: string;
  resolvedSenderValue: string | null;
}

export class WhatChimpHttpGateway implements WhatChimpGateway {
  private readonly enabled: boolean;
  private readonly baseUrl: string;
  private readonly subscriberCreateUrl: string;
  private readonly assignCustomFieldsUrl: string;
  private readonly apiToken: string;
  private readonly listId: string;
  private readonly reportUrlFieldKey: string;
  private readonly defaultPhoneNumberId: string;
  private readonly phoneNumberOptions: WhatChimpPhoneNumberOption[];
  private readonly timeoutMs: number;

  constructor() {
    this.enabled = this.parseBoolean(process.env.WHATCHIMP_ENABLED, true);
    this.apiToken = String(process.env.WHATCHIMP_API_TOKEN || process.env.WHATCHIMP_API_KEY || '').trim();
    this.timeoutMs = this.parsePositiveInt(process.env.WHATCHIMP_TIMEOUT_MS, 15000);
    this.listId = String(process.env.WHATCHIMP_LIST_ID || '1').trim() || '1';
    this.reportUrlFieldKey =
      String(process.env.WHATCHIMP_REPORT_URL_FIELD_KEY || 'pdf_report_url').trim() || 'pdf_report_url';
    this.defaultPhoneNumberId = String(
      process.env.WHATCHIMP_PHONE_NUMBER_ID ||
        process.env.WHATCHIMP_NUMBER_ID ||
        process.env.WHATCHIMP_PHONE_ID ||
        ''
    ).trim();
    this.phoneNumberOptions = this.resolvePhoneNumberOptions();
    this.baseUrl = this.resolveBaseUrl();
    this.subscriberCreateUrl = this.resolveSubscriberCreateUrl(this.baseUrl);
    this.assignCustomFieldsUrl = this.resolveAssignCustomFieldsUrl(this.baseUrl);
  }

  getPhoneNumberOptions(): WhatChimpPhoneNumberOption[] {
    return this.phoneNumberOptions.map(option => ({ ...option }));
  }

  getDefaultPhoneNumberId(): string | null {
    return this.defaultPhoneNumberId || this.phoneNumberOptions.find(option => option.isDefault)?.id || null;
  }

  allowsCustomPhoneNumberId(): boolean {
    return true;
  }

  async sendDocument(command: WhatChimpSendDocumentCommand): Promise<ProviderDispatchResult> {
    if (!this.enabled) {
      throw new WhatChimpUnavailableError('WhatChimp integration is disabled');
    }

    if (!this.apiToken) {
      throw new WhatChimpUnavailableError('WhatChimp API token is not configured');
    }

    if (!this.subscriberCreateUrl || !this.assignCustomFieldsUrl) {
      throw new WhatChimpUnavailableError('WhatChimp endpoints are not configured');
    }

    const resolvedSender = this.resolveSenderSelection(command.whatchimpPhoneNumberId);
    if (!resolvedSender.resolvedAccountId) {
      return {
        accepted: false,
        providerStatusCode: 'CONFIG_MISSING_PHONE_NUMBER_ID',
        failureReason:
          'A WhatChimp phone number id is required. Configure WHATCHIMP_PHONE_NUMBER_ID or send whatchimpPhoneNumberId.',
        resolvedWhatChimpAccountId: null,
        resolvedWhatChimpSenderValue: resolvedSender.resolvedSenderValue,
      };
    }

    const reportUrl = String(command.document.url || '').trim();
    if (!reportUrl) {
      return {
        accepted: false,
        providerStatusCode: 'INVALID_DOCUMENT_URL',
        failureReason: 'WhatChimp archiving requires a non-empty report URL',
      };
    }

    const providerPhone = this.normalizeProviderPhone(command.recipientPhone);
    if (!providerPhone) {
      return {
        accepted: false,
        providerStatusCode: 'INVALID_RECIPIENT_PHONE',
        failureReason: 'WhatChimp requires recipient phone in international digits format',
      };
    }

    const subscriberSyncStep = await this.syncSubscriber({
      phoneNumberId: resolvedSender.resolvedAccountId,
      recipientPhone: providerPhone,
      recipientName: command.recipientName ?? null,
    });
    if (!this.isSubscriberSyncAccepted(subscriberSyncStep)) {
      return {
        accepted: false,
        providerStatusCode: String(subscriberSyncStep.response.status),
        failureReason: this.extractFailureReason(
          subscriberSyncStep.parsedBody,
          subscriberSyncStep.responseText
        ),
        resolvedWhatChimpAccountId: resolvedSender.resolvedAccountId,
        resolvedWhatChimpSenderValue: resolvedSender.resolvedSenderValue,
      };
    }

    const subscriberId = this.extractSubscriberId(subscriberSyncStep.parsedBody);
    const assignFieldsStep = await this.assignReportUrlField({
      phoneNumberId: resolvedSender.resolvedAccountId,
      phone: providerPhone,
      subscriberId,
      reportUrl,
    });
    const providerStatusCode = String(assignFieldsStep.response.status);
    const accepted = this.isRequestSuccessful(assignFieldsStep);

    return {
      accepted,
      providerMessageId: this.extractProviderMessageId(assignFieldsStep.parsedBody) ?? subscriberId,
      providerStatusCode,
      failureReason: accepted
        ? null
        : this.extractFailureReason(assignFieldsStep.parsedBody, assignFieldsStep.responseText),
      resolvedWhatChimpAccountId: resolvedSender.resolvedAccountId,
      resolvedWhatChimpSenderValue: resolvedSender.resolvedSenderValue,
    };
  }

  private async syncSubscriber(input: {
    phoneNumberId: string;
    recipientPhone: string;
    recipientName: string | null;
  }): Promise<JsonPostResult> {
    const urls = this.buildUniqueUrls([
      this.subscriberCreateUrl,
      `${this.baseUrl}/whatsapp/subscriber/create`,
      `${this.baseUrl}/subscriber/create`,
    ]);

    const payloads: Array<Record<string, unknown>> = [];

    if (input.phoneNumberId) {
      payloads.push({
        apiToken: this.apiToken,
        // This endpoint expects camelCase payload keys.
        phoneNumberID: input.phoneNumberId,
        phoneNumber: input.recipientPhone,
        name: input.recipientName,
      });
      payloads.push({
        apiToken: this.apiToken,
        // Some accounts accept list_id during create/sync.
        phoneNumberID: input.phoneNumberId,
        phoneNumber: input.recipientPhone,
        name: input.recipientName,
        list_id: this.listId,
      });
    }

    payloads.push(
      {
        apiToken: this.apiToken,
        phone: input.recipientPhone,
        name: input.recipientName,
        list_id: this.listId,
      },
      {
        apiToken: this.apiToken,
        phone_number: input.recipientPhone,
        name: input.recipientName,
        list_id: this.listId,
      }
    );

    const attempts = this.buildAttemptMatrix(urls, payloads);
    return this.executeAttempts(attempts);
  }

  private async assignReportUrlField(input: {
    phoneNumberId: string;
    phone: string;
    subscriberId: string | null;
    reportUrl: string;
  }): Promise<JsonPostResult> {
    const field = {
      key: this.reportUrlFieldKey,
      value: input.reportUrl,
    };

    const payloads: Array<Record<string, unknown>> = [];

    if (input.phoneNumberId) {
      payloads.push({
        apiToken: this.apiToken,
        phone_number_id: input.phoneNumberId,
        phone_number: input.phone,
        custom_fields: JSON.stringify({
          [this.reportUrlFieldKey]: input.reportUrl,
        }),
      });
    }

    if (input.subscriberId) {
      payloads.push({
        apiToken: this.apiToken,
        subscriber_id: input.subscriberId,
        fields: [field],
      });
    }

    payloads.push({
      apiToken: this.apiToken,
      phone: input.phone,
      fields: [field],
    });

    if (input.subscriberId) {
      payloads.push(
        this.buildLegacyAssignPayload(input.phone, field, input.phoneNumberId, input.subscriberId)
      );
    }

    payloads.push(this.buildLegacyAssignPayload(input.phone, field, input.phoneNumberId));

    const urls = this.buildUniqueUrls([
      this.assignCustomFieldsUrl,
      `${this.baseUrl}/whatsapp/subscriber/chat/assign-custom-fields`,
    ]);
    const attempts = this.buildAttemptMatrix(urls, payloads);
    return this.executeAttempts(attempts);
  }

  private buildLegacyAssignPayload(
    phone: string,
    field: { key: string; value: string },
    phoneNumberId: string,
    subscriberId?: string | null
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      apiToken: this.apiToken,
      phone,
      phone_number: phone,
      custom_fields: [field],
    };

    if (phoneNumberId) {
      payload.phone_number_id = phoneNumberId;
    }

    if (subscriberId) {
      payload.subscriber_id = subscriberId;
    }

    return payload;
  }

  private async executeAttempts(attempts: JsonPostAttempt[]): Promise<JsonPostResult> {
    let bestFailure: JsonPostResult | null = null;
    let lastThrownError: unknown = null;

    for (const attempt of attempts) {
      try {
        const result = await this.postJson(attempt.url, attempt.payload);
        if (this.isRequestSuccessful(result)) {
          return result;
        }

        bestFailure = this.selectPreferredFailure(bestFailure, result);
      } catch (error) {
        lastThrownError = error;
      }
    }

    if (bestFailure) {
      return bestFailure;
    }

    if (lastThrownError) {
      throw lastThrownError;
    }

    throw new WhatChimpUnavailableError('Failed to execute WhatChimp requests');
  }

  private isRequestSuccessful(result: JsonPostResult): boolean {
    return result.response.ok && this.isSuccessfulBody(result.parsedBody);
  }

  private isSubscriberSyncAccepted(result: JsonPostResult): boolean {
    if (!result.response.ok) {
      return false;
    }

    if (this.isSuccessfulBody(result.parsedBody)) {
      return true;
    }

    const reason = this.extractFailureReason(result.parsedBody, result.responseText).toLowerCase();
    if (reason.includes('already exist')) {
      return true;
    }

    return false;
  }

  private selectPreferredFailure(
    current: JsonPostResult | null,
    candidate: JsonPostResult
  ): JsonPostResult {
    if (!current) {
      return candidate;
    }

    if (current.response.status !== 404 && candidate.response.status === 404) {
      return current;
    }

    if (current.response.status === 404 && candidate.response.status !== 404) {
      return candidate;
    }

    const currentReason = this.extractFailureReason(current.parsedBody, current.responseText);
    const candidateReason = this.extractFailureReason(candidate.parsedBody, candidate.responseText);
    return candidateReason.length > currentReason.length ? candidate : current;
  }

  private buildAttemptMatrix(
    urls: string[],
    payloads: Array<Record<string, unknown>>
  ): JsonPostAttempt[] {
    const attempts: JsonPostAttempt[] = [];
    for (const url of urls) {
      for (const payload of payloads) {
        attempts.push({ url, payload });
      }
    }

    const uniqueAttempts: JsonPostAttempt[] = [];
    const seen = new Set<string>();

    for (const attempt of attempts) {
      const signature = `${attempt.url}|${JSON.stringify(attempt.payload)}`;
      if (seen.has(signature)) {
        continue;
      }

      seen.add(signature);
      uniqueAttempts.push(attempt);
    }

    return uniqueAttempts;
  }

  private buildUniqueUrls(urls: string[]): string[] {
    const uniqueUrls: string[] = [];
    const seen = new Set<string>();

    for (const url of urls) {
      const normalized = String(url || '').trim();
      if (!normalized || seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
      uniqueUrls.push(normalized);
    }

    return uniqueUrls;
  }

  private async postJson(url: string, payload: Record<string, unknown>): Promise<JsonPostResult> {
    let response: Response;

    try {
      response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new WhatChimpTimeoutError(`WhatChimp request timed out after ${this.timeoutMs}ms`);
      }

      throw new WhatChimpUnavailableError(error?.message || 'Failed to reach WhatChimp');
    }

    const responseText = await response.text();
    return {
      response,
      responseText,
      parsedBody: this.tryParseJson(responseText),
    };
  }

  private resolveBaseUrl(): string {
    const configured = String(process.env.WHATCHIMP_BASE_URL || '')
      .trim()
      .replace(/\/+$/g, '');
    if (configured) {
      return configured;
    }

    return 'https://app.whatchimp.com/api/v1';
  }

  private resolveSubscriberCreateUrl(baseUrl: string): string {
    const explicitUrl = String(
      process.env.WHATCHIMP_SUBSCRIBER_CREATE_URL || process.env.WHATCHIMP_WEBHOOK_URL || ''
    ).trim();
    if (explicitUrl) {
      return explicitUrl;
    }

    if (!baseUrl) {
      return '';
    }

    return `${baseUrl}/whatsapp/subscriber/create`;
  }

  private resolveAssignCustomFieldsUrl(baseUrl: string): string {
    const explicitUrl = String(process.env.WHATCHIMP_ASSIGN_CUSTOM_FIELDS_URL || '').trim();
    if (explicitUrl) {
      return explicitUrl;
    }

    if (!baseUrl) {
      return '';
    }

    return `${baseUrl}/whatsapp/subscriber/chat/assign-custom-fields`;
  }

  private resolvePhoneNumberOptions(): WhatChimpPhoneNumberOption[] {
    const raw = String(
      process.env.WHATCHIMP_PHONE_NUMBER_OPTIONS ||
        process.env.WHATCHIMP_PHONE_NUMBER_OPTIONS_JSON ||
        ''
    ).trim();
    const parsed = this.parsePhoneNumberOptions(raw);
    const normalized = this.normalizePhoneNumberOptions(parsed);
    const defaultId = this.defaultPhoneNumberId;

    if (!normalized.length && defaultId) {
      return [
        {
          id: defaultId,
          name: 'Default',
          phoneNumber: null,
          label: 'Default',
          isDefault: true,
        },
      ];
    }

    if (!normalized.length) {
      return [];
    }

    const resolvedDefaultId =
      defaultId ||
      normalized.find(option => option.isDefault)?.id ||
      normalized[0]?.id ||
      '';

    const options = normalized.map(option => ({
      ...option,
      isDefault: option.id === resolvedDefaultId,
    }));

    if (resolvedDefaultId && !options.some(option => option.id === resolvedDefaultId)) {
      options.unshift({
        id: resolvedDefaultId,
        name: 'Default',
        phoneNumber: null,
        label: 'Default',
        isDefault: true,
      });
    }

    return options;
  }

  private parsePhoneNumberOptions(value: string): RawWhatChimpPhoneNumberOption[] {
    if (!value) {
      return [];
    }

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private normalizePhoneNumberOptions(
    options: RawWhatChimpPhoneNumberOption[]
  ): WhatChimpPhoneNumberOption[] {
    const normalizedOptions: WhatChimpPhoneNumberOption[] = [];
    const seen = new Set<string>();

    for (const option of options) {
      const id = this.normalizePlainString(option?.id);
      if (!id || seen.has(id)) {
        continue;
      }

      const name = this.normalizePlainString(option?.name);
      const phoneNumber = this.normalizePlainString(option?.phoneNumber ?? option?.phone);
      const label =
        this.normalizePlainString(option?.label) ||
        this.buildOptionLabel(name, phoneNumber) ||
        id;
      const isDefault = this.parseLooseBoolean(option?.isDefault);

      seen.add(id);
      normalizedOptions.push({
        id,
        name,
        phoneNumber,
        label,
        isDefault,
      });
    }

    return normalizedOptions;
  }

  private buildOptionLabel(name: string | null, phoneNumber: string | null): string | null {
    if (name && phoneNumber) {
      return `${name} (${phoneNumber})`;
    }

    return name || phoneNumber;
  }

  private resolveSenderSelection(value?: string | null): ResolvedWhatChimpSenderSelection {
    const requestedValue = this.normalizePlainString(value);
    const options = this.phoneNumberOptions;

    if (requestedValue) {
      const directIdMatch = options.find(option => option.id === requestedValue);
      if (directIdMatch) {
        return {
          requestedValue,
          resolvedAccountId: directIdMatch.id,
          resolvedSenderValue: directIdMatch.phoneNumber ?? requestedValue,
        };
      }

      const requestedPhone = this.normalizePhoneLookupValue(requestedValue);
      if (requestedPhone) {
        const phoneMatch = options.find(option => {
          return this.normalizePhoneLookupValue(option.phoneNumber) === requestedPhone;
        });
        if (phoneMatch) {
          return {
            requestedValue,
            resolvedAccountId: phoneMatch.id,
            resolvedSenderValue: phoneMatch.phoneNumber ?? requestedValue,
          };
        }
      }

      return {
        requestedValue,
        resolvedAccountId: requestedValue,
        resolvedSenderValue: requestedValue,
      };
    }

    const defaultOption =
      options.find(option => option.isDefault) ||
      options.find(option => option.id === this.defaultPhoneNumberId) ||
      null;

    if (defaultOption) {
      return {
        requestedValue: null,
        resolvedAccountId: defaultOption.id,
        resolvedSenderValue: defaultOption.phoneNumber ?? defaultOption.id,
      };
    }

    if (this.defaultPhoneNumberId) {
      return {
        requestedValue: null,
        resolvedAccountId: this.defaultPhoneNumberId,
        resolvedSenderValue: this.defaultPhoneNumberId,
      };
    }

    return {
      requestedValue: null,
      resolvedAccountId: '',
      resolvedSenderValue: null,
    };
  }

  private extractSubscriberId(body: any): string | null {
    if (!body || typeof body !== 'object') {
      return null;
    }

    const candidate =
      body.subscriber_id ||
      body.subscriberId ||
      body.id ||
      body.data?.subscriber_id ||
      body.data?.subscriberId ||
      body.data?.id;

    return candidate ? String(candidate) : null;
  }

  private isSuccessfulBody(body: any): boolean {
    if (!body || typeof body !== 'object') {
      return true;
    }

    const status = String(body.status || '').trim().toLowerCase();
    if (status) {
      if (['success', 'ok', 'accepted', '1', 'true'].includes(status)) {
        return true;
      }

      if (['error', 'failed', 'failure', '0', 'false'].includes(status)) {
        return false;
      }
    }

    if (typeof body.success === 'boolean') {
      return body.success;
    }

    if (typeof body.accepted === 'boolean') {
      return body.accepted;
    }

    return true;
  }

  private extractProviderMessageId(body: any): string | null {
    if (!body || typeof body !== 'object') {
      return null;
    }

    const candidate =
      body.messageId ||
      body.providerMessageId ||
      body.subscriber_id ||
      body.subscriberId ||
      body.id ||
      body.data?.messageId ||
      body.data?.providerMessageId ||
      body.data?.subscriber_id ||
      body.data?.subscriberId ||
      body.data?.id;

    return candidate ? String(candidate) : null;
  }

  private extractFailureReason(body: any, fallbackText: string): string {
    if (body && typeof body === 'object') {
      const candidate =
        body.failureReason ||
        body.message ||
        body.error?.message ||
        body.error ||
        body.details ||
        body.errors;

      if (candidate) {
        return typeof candidate === 'string' ? candidate : JSON.stringify(candidate);
      }
    }

    const trimmedFallback = String(fallbackText || '').trim();
    if (trimmedFallback) {
      return trimmedFallback.slice(0, 500);
    }

    return 'WhatChimp request failed';
  }

  private tryParseJson(value: string): any {
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private parseBoolean(value: string | undefined, fallback: boolean): boolean {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) {
      return fallback;
    }

    if (['1', 'true', 'yes', 'on'].includes(normalized)) {
      return true;
    }

    if (['0', 'false', 'no', 'off'].includes(normalized)) {
      return false;
    }

    return fallback;
  }

  private parsePositiveInt(value: string | undefined, fallback: number): number {
    const parsed = Number.parseInt(String(value || '').trim(), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private parseLooseBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    return this.parseBoolean(typeof value === 'string' ? value : undefined, false);
  }

  private normalizePlainString(value: unknown): string | null {
    const normalized = String(value ?? '').trim();
    return normalized === '' ? null : normalized;
  }

  private normalizePhoneLookupValue(value: unknown): string | null {
    const normalized = this.normalizePlainString(value);
    if (!normalized) {
      return null;
    }

    const digitsOnly = normalized.replace(/\D/g, '');
    return digitsOnly === '' ? null : digitsOnly;
  }

  private normalizeProviderPhone(value: string): string {
    const digitsOnly = String(value || '').replace(/\D/g, '');
    return digitsOnly.trim();
  }

  private fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    if (this.timeoutMs <= 0) {
      return fetch(url, init);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    return fetch(url, {
      ...init,
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeout);
    });
  }
}
