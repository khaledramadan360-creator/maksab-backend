import { AnalysisSourcePlatform } from '../../domain/enums';
import { ScrapedPlatformInput } from '../../domain/entities';
import {
  ClientScrapingProviderContract,
  ScrapeClientPlatformsInput,
} from '../../domain/repositories';

interface ScrapeHttpResult {
  finalUrl: string;
  statusCode: number;
  contentType: string;
  html: string;
  source: 'brightdata_unlocker' | 'brightdata_ws_browser' | 'direct_http';
}

interface ScrapeAttemptResult {
  scraped: ScrapeHttpResult | null;
  failureReason: string | null;
}

export class ClientScrapingProvider implements ClientScrapingProviderContract {
  private readonly timeoutMs: number;
  private readonly directFetchTimeoutMs: number;
  private readonly brightDataApiToken: string;
  private readonly brightDataUnlockerZone: string;
  private readonly brightDataEndpoint: string;
  private readonly brightDataWsEndpoint: string;

  constructor() {
    this.timeoutMs = this.resolvePositiveInt(process.env.ANALYSIS_SCRAPING_TIMEOUT_MS, 15000);
    this.directFetchTimeoutMs = Math.min(
      this.resolvePositiveInt(process.env.ANALYSIS_DIRECT_FETCH_TIMEOUT_MS, 6000),
      15000
    );
    this.brightDataApiToken =
      process.env.BRIGHT_DATA_API_TOKEN ||
      process.env.BRIGHTDATA_API_TOKEN ||
      '';
    this.brightDataUnlockerZone =
      process.env.BRIGHT_DATA_WEB_UNLOCKER_ZONE ||
      process.env.BRIGHTDATA_WEB_UNLOCKER_ZONE ||
      process.env.BRIGHT_DATA_UNLOCKER_ZONE ||
      process.env.BRIGHTDATA_UNLOCKER_ZONE ||
      '';
    this.brightDataEndpoint =
      process.env.BRIGHTDATA_UNLOCKER_ENDPOINT ||
      process.env.BRIGHT_DATA_UNLOCKER_ENDPOINT ||
      'https://api.brightdata.com/request';
    this.brightDataWsEndpoint =
      process.env.BRIGHT_DATA_WS_ENDPOINT ||
      process.env.BRIGHTDATA_WS_ENDPOINT ||
      '';
  }

  async scrapeClientPlatforms(input: ScrapeClientPlatformsInput): Promise<ScrapedPlatformInput[]> {
    const entries = Object.entries(input.platformLinks).filter(
      ([, value]) => typeof value === 'string' && value.trim() !== ''
    ) as Array<[AnalysisSourcePlatform, string]>;

    if (entries.length === 0) {
      return [];
    }

    const results = await Promise.all(
      entries.map(async ([platform, platformUrl]) => {
        try {
          const attempt = await this.scrapeUrlWithPolicy(platform, platformUrl);
          if (!attempt.scraped) {
            if (this.isSocialPlatform(platform)) {
              return this.createFailedPlatformInput(
                platform,
                platformUrl,
                attempt.failureReason,
                this.inferFailureSource(attempt.failureReason)
              );
            }
            return null;
          }

          const scraped = attempt.scraped;
          let bodyText = this.extractText(scraped.html);
          if (bodyText.length < 30 && platform === AnalysisSourcePlatform.Instagram) {
            bodyText = this.extractInstagramFallbackText(scraped.html, scraped.finalUrl || platformUrl);
          }

          if (bodyText.length < 30) {
            if (this.isSocialPlatform(platform)) {
              return this.createFailedPlatformInput(
                platform,
                platformUrl,
                'insufficient_content_after_scraping'
              );
            }
            return null;
          }

          return {
            platform,
            platformUrl,
            scrapedText: bodyText,
            scrapedMetadata: {
              source: scraped.source,
              statusCode: scraped.statusCode,
              contentType: scraped.contentType,
              finalUrl: scraped.finalUrl,
              scrapeStatus: 'success',
              extractedAt: new Date().toISOString(),
            },
          } satisfies ScrapedPlatformInput;
        } catch {
          if (this.isSocialPlatform(platform)) {
            return this.createFailedPlatformInput(platform, platformUrl, 'unexpected_scraping_error');
          }
          return null;
        }
      })
    );

    const accepted: ScrapedPlatformInput[] = [];
    for (const item of results) {
      if (item) {
        accepted.push(item);
      }
    }

    return accepted;
  }

  private async scrapeUrlWithPolicy(
    platform: AnalysisSourcePlatform,
    url: string
  ): Promise<ScrapeAttemptResult> {
    if (this.isSocialPlatform(platform)) {
      const wsAttempt = await this.tryBrightDataScrapingBrowser(url);
      if (wsAttempt.scraped) {
        return wsAttempt;
      }

      // Keep Bright Data only for social by trying Unlocker after WS.
      const unlockerAttempt = await this.tryBrightDataUnlocker(url);
      if (unlockerAttempt.scraped) {
        return unlockerAttempt;
      }

      // Last resort: try plain HTTP so we still extract any public metadata
      // when Bright Data credentials/policies are temporarily blocked.
      const directAttempt = await this.tryDirectFetchDetailed(url);
      if (directAttempt.scraped) {
        return directAttempt;
      }

      return {
        scraped: null,
        failureReason:
          unlockerAttempt.failureReason ||
          wsAttempt.failureReason ||
          directAttempt.failureReason ||
          'social_scraping_failed_via_brightdata',
      };
    }

    const unlockerAttempt = await this.tryBrightDataUnlocker(url);
    if (unlockerAttempt.scraped) {
      return unlockerAttempt;
    }

    if (platform === AnalysisSourcePlatform.Website) {
      const directAttempt = await this.tryDirectFetchDetailed(url);
      if (directAttempt.scraped) {
        return directAttempt;
      }

      return {
        scraped: null,
        failureReason:
          directAttempt.failureReason || unlockerAttempt.failureReason || 'website_scraping_failed',
      };
    }

    return {
      scraped: null,
      failureReason: unlockerAttempt.failureReason || 'blocked_by_provider',
    };
  }

  private async tryBrightDataScrapingBrowser(url: string): Promise<ScrapeAttemptResult> {
    if (!this.brightDataWsEndpoint) {
      return {
        scraped: null,
        failureReason: 'brightdata_ws_not_configured',
      };
    }

    let browser: any = null;

    try {
      const playwright = await import('playwright-core');
      browser = await playwright.chromium.connectOverCDP(this.brightDataWsEndpoint, {
        timeout: this.timeoutMs,
      });

      const context = browser.contexts()[0];
      if (!context) {
        return {
          scraped: null,
          failureReason: 'brightdata_ws_no_context',
        };
      }

      const page = await context.newPage();
      try {
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: this.timeoutMs,
        });
        const html = await page.content();
        if (!html || html.trim() === '') {
          return {
            scraped: null,
            failureReason: 'brightdata_ws_empty_html',
          };
        }

        return {
          scraped: {
            finalUrl: page.url() || url,
            statusCode: 200,
            contentType: 'text/html',
            html,
            source: 'brightdata_ws_browser',
          },
          failureReason: null,
        };
      } finally {
        try {
          await page.close();
        } catch {
          // ignore close errors
        }
      }
    } catch (error) {
      return {
        scraped: null,
        failureReason: this.classifyWsFailure(error),
      };
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch {
          // ignore close errors
        }
      }
    }
  }

  private async tryBrightDataUnlocker(url: string): Promise<ScrapeAttemptResult> {
    if (!this.brightDataApiToken || !this.brightDataUnlockerZone) {
      return {
        scraped: null,
        failureReason: 'brightdata_not_configured',
      };
    }

    try {
      const response = await this.fetchWithTimeout(this.brightDataEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.brightDataApiToken}`,
        },
        body: JSON.stringify({
          zone: this.brightDataUnlockerZone,
          url,
          method: 'GET',
          format: 'json',
          country: 'sa',
        }),
      });

      if (!response.ok) {
        return {
          scraped: null,
          failureReason: `brightdata_http_${response.status}`,
        };
      }

      const payload = await response.json();
      if (payload?.response_id) {
        return this.pollBrightDataUnlocker(url, payload.response_id);
      }

      const mapped = this.mapUnlockerPayload(url, payload);
      if (!mapped) {
        return {
          scraped: null,
          failureReason: this.classifyUnlockerFailure(payload),
        };
      }

      return {
        scraped: mapped,
        failureReason: null,
      };
    } catch {
      return {
        scraped: null,
        failureReason: 'brightdata_request_failed',
      };
    }
  }

  private async pollBrightDataUnlocker(url: string, responseId: string): Promise<ScrapeAttemptResult> {
    const maxRetries = this.resolvePositiveInt(process.env.ANALYSIS_UNLOCKER_MAX_POLL_RETRIES, 8);
    const pollIntervalMs = this.resolvePositiveInt(process.env.ANALYSIS_UNLOCKER_POLL_INTERVAL_MS, 1500);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      await this.delay(pollIntervalMs);

      const params = new URLSearchParams({
        response_id: responseId,
        zone: this.brightDataUnlockerZone,
      });
      const response = await this.fetchWithTimeout(
        `https://api.brightdata.com/unblocker/get_result?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.brightDataApiToken}`,
          },
        }
      );

      if (response.status === 202) {
        continue;
      }

      if (!response.ok) {
        return {
          scraped: null,
          failureReason: `brightdata_poll_http_${response.status}`,
        };
      }

      const payload = await response.json();
      const mapped = this.mapUnlockerPayload(url, payload);
      if (!mapped) {
        return {
          scraped: null,
          failureReason: this.classifyUnlockerFailure(payload),
        };
      }

      return {
        scraped: mapped,
        failureReason: null,
      };
    }

    return {
      scraped: null,
      failureReason: 'brightdata_poll_timeout',
    };
  }

  private mapUnlockerPayload(url: string, payload: any): ScrapeHttpResult | null {
    const html = this.asString(payload?.body);
    if (!html) {
      return null;
    }

    return {
      finalUrl: this.asString(payload?.url) || this.asString(payload?.final_url) || url,
      statusCode: typeof payload?.status_code === 'number' ? payload.status_code : 200,
      contentType: this.getHeaderValue(payload?.headers ?? {}, 'content-type'),
      html,
      source: 'brightdata_unlocker',
    };
  }

  private async tryDirectFetch(url: string): Promise<ScrapeHttpResult | null> {
    const response = await this.fetchWithTimeoutMs(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      },
      redirect: 'follow',
    }, this.directFetchTimeoutMs);

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    if (!html) {
      return null;
    }

    return {
      finalUrl: response.url || url,
      statusCode: response.status,
      contentType: response.headers.get('content-type') || '',
      html,
      source: 'direct_http',
    };
  }

  private async tryDirectFetchDetailed(url: string): Promise<ScrapeAttemptResult> {
    try {
      const scraped = await this.tryDirectFetch(url);
      if (!scraped) {
        return {
          scraped: null,
          failureReason: 'direct_fetch_empty_or_non_ok',
        };
      }

      return {
        scraped,
        failureReason: null,
      };
    } catch {
      return {
        scraped: null,
        failureReason: 'direct_fetch_failed',
      };
    }
  }

  private extractText(html: string): string {
    const withoutScripts = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ');
    const text = withoutScripts.replace(/<[^>]*>/g, ' ');

    return this.decodeHtml(text)
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractInstagramFallbackText(html: string, finalUrl: string): string {
    const snippets: string[] = [];
    const username = this.extractInstagramUsername(finalUrl);
    if (username) {
      snippets.push(`Instagram profile ${username}`);
    }

    const title = this.extractHtmlTitle(html);
    if (title) {
      snippets.push(title);
    }

    const metaCandidates = [
      this.extractMetaContent(html, 'property', 'og:title'),
      this.extractMetaContent(html, 'property', 'og:description'),
      this.extractMetaContent(html, 'name', 'description'),
      this.extractMetaContent(html, 'name', 'title'),
      this.extractMetaContent(html, 'name', 'twitter:title'),
      this.extractMetaContent(html, 'name', 'twitter:description'),
    ];

    for (const value of metaCandidates) {
      if (value) {
        snippets.push(value);
      }
    }

    const normalized = this.decodeHtml(snippets.join(' '))
      .replace(/\s+/g, ' ')
      .trim();

    if (normalized.length >= 30) {
      return normalized;
    }

    if (username) {
      return `Instagram profile ${username}. Public profile metadata extracted for analysis.`;
    }

    return normalized;
  }

  private extractInstagramUsername(url: string): string {
    try {
      const parsed = new URL(url);
      const firstSegment = parsed.pathname
        .split('/')
        .map(item => item.trim())
        .filter(Boolean)[0];

      if (!firstSegment) {
        return '';
      }

      const blocked = new Set(['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'tv']);
      if (blocked.has(firstSegment.toLowerCase())) {
        return '';
      }

      return decodeURIComponent(firstSegment);
    } catch {
      return '';
    }
  }

  private extractHtmlTitle(html: string): string {
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!match?.[1]) {
      return '';
    }
    return this.decodeHtml(match[1]).replace(/\s+/g, ' ').trim();
  }

  private extractMetaContent(
    html: string,
    attributeName: 'name' | 'property',
    attributeValue: string
  ): string {
    const escaped = this.escapeRegex(attributeValue);
    const tagRegex = new RegExp(
      `<meta[^>]*${attributeName}\\s*=\\s*["']${escaped}["'][^>]*>`,
      'i'
    );
    const tagMatch = html.match(tagRegex);
    if (!tagMatch?.[0]) {
      return '';
    }

    const contentMatch = tagMatch[0].match(/content\s*=\s*["']([\s\S]*?)["']/i);
    if (!contentMatch?.[1]) {
      return '';
    }

    return this.decodeHtml(contentMatch[1]).replace(/\s+/g, ' ').trim();
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private classifyUnlockerFailure(payload: any): string {
    const statusCode = typeof payload?.status_code === 'number' ? payload.status_code : null;
    const proxyStatus = this.getHeaderValue(payload?.headers ?? {}, 'proxy-status').toLowerCase();

    if (proxyStatus.includes('policy_20052') || proxyStatus.includes('destination_ip_prohibited')) {
      return 'blocked_by_provider_policy_20052';
    }

    if (proxyStatus.includes('policy_20090') || proxyStatus.includes('connection_terminated')) {
      return 'blocked_by_provider_policy_20090';
    }

    if (statusCode === 999) {
      return 'anti_bot_detected_999';
    }

    if (statusCode === 403) {
      return 'blocked_by_provider_403';
    }

    if (statusCode === 429) {
      return 'provider_rate_limited';
    }

    if (statusCode === 400) {
      return 'provider_bad_request_or_unsupported_target';
    }

    return statusCode ? `provider_status_${statusCode}` : 'provider_failed_without_body';
  }

  private classifyWsFailure(error: unknown): string {
    const message = this.asString((error as { message?: unknown })?.message || error).toLowerCase();
    if (!message) {
      return 'brightdata_ws_failed';
    }

    if (message.includes('401') || message.includes('unauthorized')) {
      return 'brightdata_ws_auth_failed';
    }

    if (message.includes('403') || message.includes('forbidden')) {
      return 'brightdata_ws_forbidden';
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return 'brightdata_ws_timeout';
    }

    if (
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('dns') ||
      message.includes('connect')
    ) {
      return 'brightdata_ws_connection_failed';
    }

    return 'brightdata_ws_request_failed';
  }

  private isSocialPlatform(platform: AnalysisSourcePlatform): boolean {
    return (
      platform === AnalysisSourcePlatform.Facebook ||
      platform === AnalysisSourcePlatform.Instagram ||
      platform === AnalysisSourcePlatform.Snapchat ||
      platform === AnalysisSourcePlatform.Linkedin ||
      platform === AnalysisSourcePlatform.X ||
      platform === AnalysisSourcePlatform.Tiktok
    );
  }

  private createFailedPlatformInput(
    platform: AnalysisSourcePlatform,
    platformUrl: string,
    failureReason: string | null,
    source: ScrapeHttpResult['source'] = 'brightdata_unlocker'
  ): ScrapedPlatformInput {
    const reason = failureReason || 'scraping_failed';
    const humanReason = reason.replace(/_/g, ' ');
    return {
      platform,
      platformUrl,
      scrapedText: `SCRAPING_FAILED for ${platform} profile. reason: ${humanReason}.`,
      scrapedMetadata: {
        source,
        scrapeStatus: 'failed',
        scrapeFailureReason: reason,
        extractedAt: new Date().toISOString(),
      },
    };
  }

  private inferFailureSource(reason: string | null): ScrapeHttpResult['source'] {
    if (reason && reason.startsWith('brightdata_ws_')) {
      return 'brightdata_ws_browser';
    }
    if (reason && reason.startsWith('direct_fetch_')) {
      return 'direct_http';
    }
    return 'brightdata_unlocker';
  }

  private decodeHtml(value: string): string {
    return value
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>');
  }

  private getHeaderValue(headers: Record<string, unknown>, headerName: string): string {
    const normalized = headerName.toLowerCase();
    for (const [key, value] of Object.entries(headers || {})) {
      if (key.toLowerCase() === normalized && value != null) {
        return String(value);
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

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    return this.fetchWithTimeoutMs(url, init, this.timeoutMs);
  }

  private async fetchWithTimeoutMs(
    url: string,
    init: RequestInit,
    timeoutMs: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private async delay(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  private resolvePositiveInt(rawValue: string | undefined, fallback: number): number {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }
    return Math.floor(parsed);
  }
}
