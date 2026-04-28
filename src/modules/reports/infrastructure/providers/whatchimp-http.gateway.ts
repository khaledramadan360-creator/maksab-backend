import {
  ProviderDispatchResult,
  WhatChimpGateway,
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

export class WhatChimpHttpGateway implements WhatChimpGateway {
  private readonly enabled: boolean;
  private readonly baseUrl: string;
  private readonly subscriberCreateUrl: string;
  private readonly assignCustomFieldsUrl: string;
  private readonly apiToken: string;
  private readonly listId: string;
  private readonly reportUrlFieldKey: string;
  private readonly phoneNumberId: string;
  private readonly timeoutMs: number;

  constructor() {
    this.enabled = this.parseBoolean(process.env.WHATCHIMP_ENABLED, true);
    this.apiToken = String(process.env.WHATCHIMP_API_TOKEN || process.env.WHATCHIMP_API_KEY || '').trim();
    this.timeoutMs = this.parsePositiveInt(process.env.WHATCHIMP_TIMEOUT_MS, 15000);
    this.listId = String(process.env.WHATCHIMP_LIST_ID || '1').trim() || '1';
    this.reportUrlFieldKey =
      String(process.env.WHATCHIMP_REPORT_URL_FIELD_KEY || 'pdf_report_url').trim() || 'pdf_report_url';
    this.phoneNumberId = String(
      process.env.WHATCHIMP_PHONE_NUMBER_ID ||
        process.env.WHATCHIMP_NUMBER_ID ||
        process.env.WHATCHIMP_PHONE_ID ||
        ''
    ).trim();
    this.baseUrl = this.resolveBaseUrl();
    this.subscriberCreateUrl = this.resolveSubscriberCreateUrl(this.baseUrl);
    this.assignCustomFieldsUrl = this.resolveAssignCustomFieldsUrl(this.baseUrl);
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

    if (!this.phoneNumberId) {
      return {
        accepted: false,
        providerStatusCode: 'CONFIG_MISSING_PHONE_NUMBER_ID',
        failureReason: 'WHATCHIMP_PHONE_NUMBER_ID is required for WhatChimp custom-fields archiving',
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
      };
    }

    const subscriberId = this.extractSubscriberId(subscriberSyncStep.parsedBody);
    const assignFieldsStep = await this.assignReportUrlField({
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
    };
  }

  private async syncSubscriber(input: {
    recipientPhone: string;
    recipientName: string | null;
  }): Promise<JsonPostResult> {
    const urls = this.buildUniqueUrls([
      this.subscriberCreateUrl,
      `${this.baseUrl}/whatsapp/subscriber/create`,
      `${this.baseUrl}/subscriber/create`,
    ]);

    const payloads: Array<Record<string, unknown>> = [];

    if (this.phoneNumberId) {
      payloads.push({
        apiToken: this.apiToken,
        // This endpoint expects camelCase payload keys.
        phoneNumberID: this.phoneNumberId,
        phoneNumber: input.recipientPhone,
        name: input.recipientName,
      });
      payloads.push({
        apiToken: this.apiToken,
        // Some accounts accept list_id during create/sync.
        phoneNumberID: this.phoneNumberId,
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
    phone: string;
    subscriberId: string | null;
    reportUrl: string;
  }): Promise<JsonPostResult> {
    const field = {
      key: this.reportUrlFieldKey,
      value: input.reportUrl,
    };

    const payloads: Array<Record<string, unknown>> = [];

    if (this.phoneNumberId) {
      payloads.push({
        apiToken: this.apiToken,
        phone_number_id: this.phoneNumberId,
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
      payloads.push(this.buildLegacyAssignPayload(input.phone, field, input.subscriberId));
    }

    payloads.push(this.buildLegacyAssignPayload(input.phone, field));

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
    subscriberId?: string | null
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      apiToken: this.apiToken,
      phone,
      phone_number: phone,
      custom_fields: [field],
    };

    if (this.phoneNumberId) {
      payload.phone_number_id = this.phoneNumberId;
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
