import {
  BrevoMarketingGateway,
  BrevoMarketingSendCommand,
  BrevoMarketingSendResult,
} from '../../domain/repositories';
import {
  BrevoMarketingDisabledError,
  BrevoMarketingRateLimitedError,
  BrevoMarketingRejectedError,
  BrevoMarketingTimeoutError,
  BrevoMarketingUnavailableError,
} from '../../domain/errors';
import { EmailTemplateRendererService } from '../../domain/services';

type HttpMethod = 'GET' | 'POST' | 'PUT';

export class BrevoMarketingHttpGateway implements BrevoMarketingGateway {
  constructor(private readonly templateRenderer: EmailTemplateRendererService) {}

  async sendCampaign(command: BrevoMarketingSendCommand): Promise<BrevoMarketingSendResult> {
    this.assertEnabled();

    const folderId = await this.resolveFolderId();
    const listId = await this.createList(folderId, command.title);
    const canUseCityAttribute = await this.ensureTextAttribute('CITY');
    const contactFailures: Array<{ email: string; reason: string }> = [];

    for (const recipient of command.recipients) {
      try {
        await this.createOrUpdateContact(listId, recipient, canUseCityAttribute);
      } catch (error: any) {
        contactFailures.push({
          email: recipient.email,
          reason: error?.message ?? 'Failed to add contact to Brevo list',
        });
      }
    }

    const acceptedRecipients = command.recipients.filter(
      recipient => !contactFailures.some(failure => failure.email.toLowerCase() === recipient.email.toLowerCase())
    );

    if (acceptedRecipients.length === 0) {
      throw new BrevoMarketingRejectedError('Brevo rejected all campaign recipients');
    }

    const campaignId = await this.createEmailCampaign(command, listId, canUseCityAttribute);
    await this.sendNow(campaignId);

    return {
      accepted: true,
      providerCampaignId: String(campaignId),
      providerListId: String(listId),
      sentCount: acceptedRecipients.length,
      failedCount: contactFailures.length,
      failures: contactFailures,
    };
  }

  private assertEnabled(): void {
    const explicitlyDisabled = process.env.BREVO_MARKETING_ENABLED?.trim().toLowerCase() === 'false';
    if (explicitlyDisabled) {
      throw new BrevoMarketingDisabledError();
    }

    if (!this.apiKey) {
      throw new BrevoMarketingDisabledError('BREVO_MARKETING_API_KEY is missing');
    }
  }

  private async resolveFolderId(): Promise<number> {
    const configuredFolderId = Number(process.env.BREVO_MARKETING_FOLDER_ID);
    if (Number.isFinite(configuredFolderId) && configuredFolderId > 0) {
      return configuredFolderId;
    }

    const folderName = process.env.BREVO_MARKETING_FOLDER_NAME?.trim() || 'Maksab Campaigns';
    const foldersResponse = await this.request<{ folders?: Array<{ id: number; name: string }> }>(
      'GET',
      '/contacts/folders?limit=50&offset=0&sort=desc'
    );
    const existing = foldersResponse.folders?.find(folder => folder.name === folderName);
    if (existing) {
      return Number(existing.id);
    }

    const created = await this.request<{ id: number }>('POST', '/contacts/folders', {
      name: folderName,
    });
    return Number(created.id);
  }

  private async createList(folderId: number, campaignTitle: string): Promise<number> {
    const suffix = new Date().toISOString().replace(/[:.]/g, '-');
    const created = await this.request<{ id: number }>('POST', '/contacts/lists', {
      folderId,
      name: `${campaignTitle.slice(0, 80)} - ${suffix}`,
    });
    return Number(created.id);
  }

  private async createOrUpdateContact(
    listId: number,
    recipient: BrevoMarketingSendCommand['recipients'][number],
    includeCityAttribute: boolean
  ): Promise<void> {
    const attributes: Record<string, string> = {
      FIRSTNAME: recipient.variables.clientName ?? recipient.name ?? '',
    };

    if (includeCityAttribute) {
      attributes.CITY = recipient.variables.clientCity ?? '';
    }

    await this.request('POST', '/contacts', {
      email: recipient.email,
      attributes,
      listIds: [listId],
      updateEnabled: true,
    });
  }

  private async createEmailCampaign(
    command: BrevoMarketingSendCommand,
    listId: number,
    includeCityAttribute: boolean
  ): Promise<number> {
    const htmlContent = command.htmlContent
      ? this.toBrevoTemplate(command.htmlContent, includeCityAttribute)
      : this.textToHtml(command.textContent ?? '', includeCityAttribute);

    const created = await this.request<{ id: number }>('POST', '/emailCampaigns', {
      name: command.title,
      sender: {
        name: command.senderName,
        email: command.senderEmail,
      },
      subject: command.subject,
      htmlContent,
      recipients: {
        listIds: [listId],
      },
    });

    return Number(created.id);
  }

  private async sendNow(campaignId: number): Promise<void> {
    await this.request('POST', `/emailCampaigns/${campaignId}/sendNow`);
  }

  private async ensureTextAttribute(attributeName: string): Promise<boolean> {
    try {
      await this.request('POST', `/contacts/attributes/normal/${attributeName}`, {
        type: 'text',
      });
      return true;
    } catch (error: any) {
      const message = String(error?.message ?? '').toLowerCase();
      if (error instanceof BrevoMarketingRejectedError && (
        message.includes('already') ||
        message.includes('exist') ||
        message.includes('duplicate')
      )) {
        return true;
      }

      return false;
    }
  }

  private async request<T = unknown>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'api-key': this.apiKey,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      const payload = await this.readPayload(response);
      if (!response.ok) {
        this.throwForStatus(response.status, payload);
      }

      return payload as T;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new BrevoMarketingTimeoutError();
      }

      if (error instanceof BrevoMarketingRejectedError ||
        error instanceof BrevoMarketingUnavailableError ||
        error instanceof BrevoMarketingRateLimitedError ||
        error instanceof BrevoMarketingTimeoutError) {
        throw error;
      }

      throw new BrevoMarketingUnavailableError(error?.message ?? 'Brevo request failed');
    } finally {
      clearTimeout(timeout);
    }
  }

  private async readPayload(response: Response): Promise<unknown> {
    if (response.status === 204) {
      return {};
    }

    const text = await response.text();
    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  }

  private throwForStatus(status: number, payload: unknown): never {
    const message = this.extractErrorMessage(payload);
    if (status === 429) {
      throw new BrevoMarketingRateLimitedError(message);
    }

    if (status >= 500) {
      throw new BrevoMarketingUnavailableError(message);
    }

    throw new BrevoMarketingRejectedError(message);
  }

  private extractErrorMessage(payload: unknown): string {
    if (payload && typeof payload === 'object') {
      const data = payload as Record<string, unknown>;
      const message = data.message || data.error || data.code;
      if (message) {
        return String(message);
      }
    }

    return 'Brevo marketing request failed';
  }

  private textToHtml(textContent: string, includeCityAttribute: boolean): string {
    const escaped = textContent
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
      .replaceAll('\n', '<br>');
    return `<div>${this.toBrevoTemplate(escaped, includeCityAttribute)}</div>`;
  }

  private toBrevoTemplate(content: string, includeCityAttribute: boolean): string {
    const withDefaultAttributes = this.templateRenderer.toBrevoTemplate(content);
    return includeCityAttribute
      ? withDefaultAttributes
      : withDefaultAttributes.replaceAll('{{contact.CITY}}', '');
  }

  private get apiKey(): string {
    return process.env.BREVO_MARKETING_API_KEY?.trim() || '';
  }

  private get baseUrl(): string {
    return (process.env.BREVO_MARKETING_BASE_URL?.trim() || 'https://api.brevo.com/v3').replace(/\/+$/, '');
  }

  private get timeoutMs(): number {
    const value = Number(process.env.BREVO_MARKETING_TIMEOUT_MS ?? 30000);
    return Number.isFinite(value) && value > 0 ? value : 30000;
  }
}
