import { SearchProvider, SearchProviderOptions } from '../../domain/repositories';
import { RawSearchResult, SearchQueryVariant } from '../../domain/entities';
import { SearchPlatform } from '../../domain/enums';

export class BrightDataSerpProvider implements SearchProvider {
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly zone: string;
  private readonly requestTimeoutMs: number;
  private readonly maxPollRetries: number;
  private readonly pollIntervalMs: number;
  private readonly tiktokMaxPollRetries: number;
  private readonly tiktokPollIntervalMs: number;

  constructor() {
    this.endpoint =
      process.env.BRIGHTDATA_SERP_ENDPOINT ||
      process.env.BRIGHT_DATA_SERP_ENDPOINT ||
      'https://api.brightdata.com/serp/req';
    this.apiKey =
      process.env.BRIGHT_DATA_API_TOKEN ||
      process.env.BRIGHTDATA_API_TOKEN ||
      process.env.BRIGHTDATA_API_KEY ||
      '';
    this.zone =
      process.env.BRIGHT_DATA_SERP_ZONE ||
      process.env.BRIGHTDATA_SERP_ZONE ||
      'serp_api1';
    // 0 means "no local timeout cap" for provider HTTP calls.
    this.requestTimeoutMs = this.resolvePositiveInt(process.env.LEAD_SEARCH_HTTP_TIMEOUT_MS, 0);
    // 0 means "no local retries cap" (poll until provider resolves or request fails).
    this.maxPollRetries = this.resolvePositiveInt(process.env.LEAD_SEARCH_SERP_MAX_POLL_RETRIES, 0);
    this.pollIntervalMs = this.resolvePositiveInt(process.env.LEAD_SEARCH_SERP_POLL_INTERVAL_MS, 1500);
    this.tiktokMaxPollRetries = this.resolvePositiveInt(
      process.env.LEAD_SEARCH_SERP_TIKTOK_MAX_POLL_RETRIES,
      this.maxPollRetries
    );
    this.tiktokPollIntervalMs = this.resolvePositiveInt(
      process.env.LEAD_SEARCH_SERP_TIKTOK_POLL_INTERVAL_MS,
      this.pollIntervalMs
    );
  }

  public async executeSearch(query: SearchQueryVariant, options?: SearchProviderOptions): Promise<RawSearchResult[]> {
    try {
      if (!this.apiKey || this.apiKey.trim() === '') {
        throw new Error('Bright Data API token is missing. Set BRIGHT_DATA_API_TOKEN.');
      }

      const country = options?.country || 'SA';
      const language = query.language === 'en' ? 'en' : 'ar';
      const resultsPerPage = options?.resultsPerPage || 10;
      const page = options?.page && options.page > 0 ? options.page : 1;
      const offset = typeof options?.offset === 'number'
        ? Math.max(0, options.offset)
        : (page - 1) * resultsPerPage;
      const searchUrl = this.buildGoogleSearchUrl(query.finalQuery, country, language, offset, resultsPerPage);

      if (this.endpoint.toLowerCase().includes('/request')) {
        return this.executeSyncRequest(query, searchUrl, country);
      }

      return this.executeAsyncRequest(query, {
        searchUrl,
        country,
        language,
        resultsPerPage,
        offset,
      });
    } catch (error) {
      throw new Error(`BrightDataSerpProvider Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async executeSyncRequest(
    query: SearchQueryVariant,
    searchUrl: string,
    country: string
  ): Promise<RawSearchResult[]> {
    const response = await this.fetchWithTimeout(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        zone: this.zone,
        url: searchUrl,
        format: 'json',
        method: 'GET',
        country: country.toLowerCase()
      })
    });

    if (!response.ok) {
      throw new Error(`API failed with status ${response.status}: ${await this.readErrorBody(response)}`);
    }

    const data = await response.json();
    return this.mapOrganicResults(query, data);
  }

  private async executeAsyncRequest(
    query: SearchQueryVariant,
    request: {
      searchUrl: string;
      country: string;
      language: string;
      resultsPerPage: number;
      offset: number;
    }
  ): Promise<RawSearchResult[]> {
    const { searchUrl, country, language, resultsPerPage, offset } = request;
    const response = await this.fetchWithTimeout(`${this.endpoint}?zone=${encodeURIComponent(this.zone)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        // Keep url payload for compatibility with endpoints that expect a full Google URL.
        url: searchUrl,
        country: country,
        brd_json: 'json',
        // Also include structured query payload for Bright Data SERP /serp/req format.
        query: {
          q: query.finalQuery,
          hl: language,
          gl: country.toLowerCase(),
          num: resultsPerPage,
          ...(offset > 0 ? { start: offset } : {}),
        },
      })
    });

    if (!response.ok) {
      throw new Error(`API failed with status ${response.status}: ${await this.readErrorBody(response)}`);
    }

    const requestData = await response.json();
    const directResults = this.mapOrganicResults(query, requestData);
    if (directResults.length > 0) {
      return directResults;
    }

    const responseId = requestData?.response_id;

    if (!responseId) {
      const providerMessage = this.extractProviderMessage(requestData);
      if (providerMessage) {
        throw new Error(providerMessage);
      }

      // Some responses may legitimately return an empty SERP payload.
      return [];
    }

    const maxPollRetries = query.platform === SearchPlatform.TIKTOK
      ? this.tiktokMaxPollRetries
      : this.maxPollRetries;
    const pollIntervalMs = query.platform === SearchPlatform.TIKTOK
      ? this.tiktokPollIntervalMs
      : this.pollIntervalMs;

    let attempts = 0;
    while (maxPollRetries <= 0 || attempts < maxPollRetries) {
      attempts += 1;
      await this.delay(pollIntervalMs);

      const resultParams = new URLSearchParams({
        response_id: responseId,
        zone: this.zone
      });

      const resultResponse = await this.fetchWithTimeout(`https://api.brightdata.com/serp/get_result?${resultParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (resultResponse.status === 202) {
        continue;
      }

      if (!resultResponse.ok) {
        throw new Error(
          `Result fetching failed with status ${resultResponse.status}: ${await this.readErrorBody(resultResponse)}`
        );
      }

      const data = await resultResponse.json();
      return this.mapOrganicResults(query, data);
    }

    throw new Error(`Timeout waiting for SERP results from Bright Data after ${maxPollRetries} polling attempts`);
  }

  private buildGoogleSearchUrl(
    finalQuery: string,
    country: string,
    language: string,
    offset: number,
    resultsPerPage: number
  ): string {
    const searchUrl = new URL('https://www.google.com/search');
    searchUrl.searchParams.append('q', finalQuery);
    searchUrl.searchParams.append('gl', country.toLowerCase());
    searchUrl.searchParams.append('hl', language);

    if (offset > 0) {
      searchUrl.searchParams.append('start', String(offset));
    }

    if (resultsPerPage !== 10) {
      searchUrl.searchParams.append('num', String(resultsPerPage));
    }

    return searchUrl.toString();
  }

  private mapOrganicResults(query: SearchQueryVariant, data: any): RawSearchResult[] {
    let organicResults = [];

    if (data && data.organic) {
      organicResults = data.organic;
    } else if (data && data.organic_results) {
      organicResults = data.organic_results;
    } else if (data?.body) {
      const innerPayload = this.tryParseJson(data.body);
      if (innerPayload?.organic) {
        organicResults = innerPayload.organic;
      } else if (innerPayload?.organic_results) {
        organicResults = innerPayload.organic_results;
      }
    } else if (Array.isArray(data)) {
      organicResults = data[0]?.organic || data[0]?.organic_results || [];
    }

    if (!Array.isArray(organicResults)) {
      return [];
    }

    return organicResults.map((item: any) => ({
      platform: query.platform,
      title: item.title || '',
      snippet: item.snippet || item.description || '',
      url: item.link || item.url || '',
      sourceQuery: query.finalQuery,
    }));
  }

  private extractProviderMessage(payload: any): string | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const rawMessage =
      payload.error ||
      payload.message ||
      payload.details ||
      payload.description ||
      payload.status_message ||
      null;

    if (!rawMessage) {
      return null;
    }

    if (typeof rawMessage === 'string') {
      return rawMessage;
    }

    try {
      return JSON.stringify(rawMessage);
    } catch {
      return String(rawMessage);
    }
  }

  private tryParseJson(value: string): any {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private async readErrorBody(response: Response): Promise<string> {
    const rawBody = await response.text();

    if (!rawBody) {
      return 'Empty error body';
    }

    try {
      return JSON.stringify(JSON.parse(rawBody));
    } catch {
      return rawBody;
    }
  }

  private async fetchWithTimeout(url: string, init: RequestInit, timeoutMs = this.requestTimeoutMs): Promise<Response> {
    if (!timeoutMs || timeoutMs <= 0) {
      return fetch(url, init);
    }

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }

      throw error;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private resolvePositiveInt(rawValue: string | undefined, fallback: number): number {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }

    return Math.floor(parsed);
  }
}
