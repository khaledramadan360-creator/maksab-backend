import { UnlockedPageResult } from '../../domain/entities';
import { UnlockerProvider, UnlockerProviderOptions } from '../../domain/repositories';

export class BrightDataUnlockerProvider implements UnlockerProvider {
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly zone: string;

  constructor() {
    this.endpoint = process.env.BRIGHTDATA_UNLOCKER_ENDPOINT || 'https://api.brightdata.com/request';
    this.apiKey =
      process.env.BRIGHT_DATA_API_TOKEN ||
      process.env.BRIGHTDATA_API_TOKEN ||
      process.env.BRIGHTDATA_API_KEY ||
      '';
    this.zone =
      process.env.BRIGHT_DATA_WEB_UNLOCKER_ZONE ||
      process.env.BRIGHTDATA_WEB_UNLOCKER_ZONE ||
      process.env.BRIGHT_DATA_UNLOCKER_ZONE ||
      process.env.BRIGHTDATA_UNLOCKER_ZONE ||
      '';
  }

  public async unlock(url: string, options?: UnlockerProviderOptions): Promise<UnlockedPageResult | null> {
    if (!this.apiKey || !this.zone || !url) {
      return null;
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          zone: this.zone,
          url,
          method: options?.method || 'GET',
          country: (options?.country || 'SA').toLowerCase(),
          format: 'json'
        })
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (data?.response_id) {
        return this.pollUnlockerResult(url, data.response_id);
      }

      return this.mapUnlockerPayload(url, data);
    } catch {
      return null;
    }
  }

  private async pollUnlockerResult(url: string, responseId: string): Promise<UnlockedPageResult | null> {
    const maxRetries = 10;
    const pollIntervalMs = 1500;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

      const params = new URLSearchParams({
        response_id: responseId,
        zone: this.zone
      });

      const response = await fetch(`https://api.brightdata.com/unblocker/get_result?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (response.status === 202) {
        continue;
      }

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return this.mapUnlockerPayload(url, data);
    }

    return null;
  }

  private mapUnlockerPayload(url: string, payload: any): UnlockedPageResult {
    const headers = payload?.headers || {};
    const contentType = this.getHeaderValue(headers, 'content-type');
    const rawBody = this.asString(payload?.body);
    const title = this.extractTitle(rawBody);

    return {
      url,
      finalUrl: payload?.url || payload?.final_url || url,
      statusCode: typeof payload?.status_code === 'number' ? payload.status_code : 200,
      contentType,
      title,
      body: rawBody,
      bodyText: this.stripHtml(rawBody)
    };
  }

  private getHeaderValue(headers: Record<string, string>, headerName: string): string {
    const normalizedHeaderName = headerName.toLowerCase();

    for (const key of Object.keys(headers)) {
      if (key.toLowerCase() === normalizedHeaderName) {
        return String(headers[key]);
      }
    }

    return '';
  }

  private asString(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    if (value == null) {
      return '';
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private extractTitle(body: string): string {
    const match = body.match(/<title[^>]*>(.*?)<\/title>/i);
    if (!match || !match[1]) {
      return '';
    }

    return this.decodeHtmlEntities(match[1]).trim();
  }

  private stripHtml(body: string): string {
    return this.decodeHtmlEntities(
      body
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
    )
      .replace(/\s+/g, ' ')
      .trim();
  }

  private decodeHtmlEntities(value: string): string {
    return value
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>');
  }
}
