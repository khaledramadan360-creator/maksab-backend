import { DatasetBatchResult, SearchRequest } from '../../domain/entities';
import { SearchPlatform } from '../../domain/enums';
import { DatasetProvider, DatasetProviderOptions } from '../../domain/repositories';

interface DatasetPlatformConfig {
  datasetId: string;
  sourceDataset: string;
  inputTemplate?: Record<string, unknown>;
  queryParams: Record<string, string>;
}

interface TemplateContext {
  keyword: string;
  city: string;
  country: string;
  page: number;
  limit: number;
  cursor: string;
  location: string;
  platform: string;
}

export class BrightDataDatasetProvider implements DatasetProvider {
  private readonly endpoint: string;
  private readonly apiKey: string;

  constructor() {
    this.endpoint = (
      this.resolveEnv([
        'BRIGHT_DATA_DATASET_ENDPOINT',
        'BRIGHTDATA_DATASET_ENDPOINT',
      ]) ||
      'https://api.brightdata.com/datasets/v3'
    ).replace(/\/$/, '');
    this.apiKey = this.resolveEnv([
      'BRIGHT_DATA_API_TOKEN',
      'BRIGHTDATA_API_TOKEN',
      'BRIGHTDATA_API_KEY',
    ]);
  }

  public async fetchBatch(
    platform: SearchPlatform,
    request: SearchRequest,
    options?: DatasetProviderOptions
  ): Promise<DatasetBatchResult> {
    if (!this.apiKey) {
      throw new Error('BrightDataDatasetProvider Error: Bright Data API token is not configured.');
    }

    const config = this.resolvePlatformConfig(platform);
    const page = options?.page && options.page > 0 ? options.page : 1;
    const batchSize = options?.batchSize && options.batchSize > 0 ? options.batchSize : 25;
    const cursor = (options?.cursor || '').trim();
    const input = this.buildInput(config, request, {
      keyword: request.keyword,
      city: request.saudiCity,
      country: request.country,
      page,
      limit: batchSize,
      cursor,
      location: `${request.saudiCity}, ${request.country}`.trim(),
      platform,
    });

    try {
      const payload = await this.collectRecords(config, input);
      const records = this.extractRecords(payload).map((record: Record<string, any>) => ({
        platform,
        sourceDataset: config.sourceDataset,
        sourceKeyword: request.keyword,
        page,
        payload: record,
      }));

      return {
        platform,
        sourceDataset: config.sourceDataset,
        page,
        nextPage: records.length < batchSize ? undefined : page + 1,
        nextCursor: records.length < batchSize ? undefined : String(page + 1),
        exhausted: records.length < batchSize,
        records,
      };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('BrightDataDatasetProvider Error:')) {
        throw error;
      }

      throw new Error(
        `BrightDataDatasetProvider Error: ${error instanceof Error ? error.message : 'Unknown dataset error'}`
      );
    }
  }

  private resolvePlatformConfig(platform: SearchPlatform): DatasetPlatformConfig {
    switch (platform) {
      case SearchPlatform.WEBSITE:
        return this.buildPlatformConfig(
          this.resolveEnv([
            'BRIGHT_DATA_WEBSITE_DATASET_ID',
            'BRIGHTDATA_WEBSITE_DATASET_ID',
            'BRIGHT_DATA_DATASET_WEBSITE_ID',
            'BRIGHTDATA_DATASET_WEBSITE_ID',
            'BRIGHT_DATA_WEBSITES_DATASET_ID',
            'BRIGHTDATA_WEBSITES_DATASET_ID',
          ]),
          this.resolveEnv([
            'BRIGHT_DATA_WEBSITE_SOURCE_DATASET',
            'BRIGHTDATA_WEBSITE_SOURCE_DATASET',
            'BRIGHT_DATA_WEBSITE_DATASET_SOURCE',
            'BRIGHTDATA_WEBSITE_DATASET_SOURCE',
          ]),
          this.resolveEnv([
            'BRIGHT_DATA_WEBSITE_DATASET_INPUT_TEMPLATE',
            'BRIGHTDATA_WEBSITE_DATASET_INPUT_TEMPLATE',
          ]),
          this.resolveEnv([
            'BRIGHT_DATA_WEBSITE_DATASET_QUERY_PARAMS',
            'BRIGHTDATA_WEBSITE_DATASET_QUERY_PARAMS',
          ]),
          'website',
          [
            'BRIGHT_DATA_WEBSITE_DATASET_ID',
            'BRIGHTDATA_WEBSITE_DATASET_ID',
            'BRIGHT_DATA_DATASET_WEBSITE_ID',
            'BRIGHTDATA_DATASET_WEBSITE_ID',
            'BRIGHT_DATA_WEBSITES_DATASET_ID',
            'BRIGHTDATA_WEBSITES_DATASET_ID',
          ]
        );

      case SearchPlatform.LINKEDIN:
        return this.buildPlatformConfig(
          this.resolveEnv([
            'BRIGHT_DATA_LINKEDIN_DATASET_ID',
            'BRIGHTDATA_LINKEDIN_DATASET_ID',
            'BRIGHT_DATA_DATASET_LINKEDIN_ID',
            'BRIGHTDATA_DATASET_LINKEDIN_ID',
          ]),
          this.resolveEnv([
            'BRIGHT_DATA_LINKEDIN_SOURCE_DATASET',
            'BRIGHTDATA_LINKEDIN_SOURCE_DATASET',
            'BRIGHT_DATA_LINKEDIN_DATASET_SOURCE',
            'BRIGHTDATA_LINKEDIN_DATASET_SOURCE',
          ]),
          this.resolveEnv([
            'BRIGHT_DATA_LINKEDIN_DATASET_INPUT_TEMPLATE',
            'BRIGHTDATA_LINKEDIN_DATASET_INPUT_TEMPLATE',
          ]),
          this.resolveEnv([
            'BRIGHT_DATA_LINKEDIN_DATASET_QUERY_PARAMS',
            'BRIGHTDATA_LINKEDIN_DATASET_QUERY_PARAMS',
          ]),
          'linkedin',
          [
            'BRIGHT_DATA_LINKEDIN_DATASET_ID',
            'BRIGHTDATA_LINKEDIN_DATASET_ID',
            'BRIGHT_DATA_DATASET_LINKEDIN_ID',
            'BRIGHTDATA_DATASET_LINKEDIN_ID',
          ]
        );

      default:
        throw new Error(`BrightDataDatasetProvider Error: Platform '${platform}' is not configured for dataset search.`);
    }
  }

  private buildPlatformConfig(
    datasetId: string,
    sourceDataset: string,
    inputTemplateRaw: string | undefined,
    queryParamsRaw: string | undefined,
    defaultLabel: string,
    acceptedIdEnvNames: string[]
  ): DatasetPlatformConfig {
    if (!datasetId) {
      throw new Error(
        `BrightDataDatasetProvider Error: Missing dataset ID for platform '${defaultLabel}'. Set one of: ${acceptedIdEnvNames.join(', ')}.`
      );
    }

    return {
      datasetId,
      sourceDataset: sourceDataset || datasetId,
      inputTemplate: this.tryParseObject(inputTemplateRaw),
      queryParams: this.coerceStringMap(this.tryParseObject(queryParamsRaw)),
    };
  }

  private resolveEnv(keys: string[]): string {
    for (const key of keys) {
      const value = process.env[key];
      if (typeof value === 'string' && value.trim() !== '') {
        return value.trim();
      }
    }

    return '';
  }

  private buildInput(config: DatasetPlatformConfig, request: SearchRequest, context: TemplateContext): Record<string, unknown> {
    if (config.inputTemplate && Object.keys(config.inputTemplate).length > 0) {
      return this.applyTemplate(config.inputTemplate, context) as Record<string, unknown>;
    }

    return {
      keyword: request.keyword,
      city: request.saudiCity,
      country: request.country,
      page: context.page,
      limit: context.limit,
      cursor: context.cursor || undefined,
    };
  }

  private applyTemplate(value: unknown, context: TemplateContext): unknown {
    if (typeof value === 'string') {
      return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, rawKey: string) => {
        const key = rawKey as keyof TemplateContext;
        const resolved = context[key];
        return resolved == null ? '' : String(resolved);
      });
    }

    if (Array.isArray(value)) {
      return value.map(item => this.applyTemplate(item, context));
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
          key,
          this.applyTemplate(nestedValue, context),
        ])
      );
    }

    return value;
  }

  private async collectRecords(config: DatasetPlatformConfig, input: Record<string, unknown>): Promise<unknown> {
    const scrapeUrl = new URL(`${this.endpoint}/scrape`);
    scrapeUrl.searchParams.set('dataset_id', config.datasetId);
    scrapeUrl.searchParams.set('format', 'json');
    scrapeUrl.searchParams.set('include_errors', 'true');

    for (const [key, value] of Object.entries(config.queryParams)) {
      scrapeUrl.searchParams.set(key, value);
    }

    const response = await this.postDatasetRequest(scrapeUrl.toString(), { input: [input] }, true);
    const payload = await this.parseResponseBody(response);

    if (this.isSnapshotEnvelope(payload)) {
      return this.waitForSnapshotAndDownload(payload.snapshot_id);
    }

    return payload;
  }

  private async postDatasetRequest(url: string, body: unknown, allowFallback: boolean): Promise<Response> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (response.ok || !allowFallback || response.status !== 400) {
      return response;
    }

    const fallbackBody = Array.isArray((body as { input?: unknown[] })?.input)
      ? (body as { input: unknown[] }).input
      : body;

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(fallbackBody),
    });
  }

  private async waitForSnapshotAndDownload(snapshotId: string): Promise<unknown> {
    const maxRetries = 20;
    const pollIntervalMs = 2000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

      const progressResponse = await fetch(`${this.endpoint}/progress/${encodeURIComponent(snapshotId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!progressResponse.ok) {
        throw new Error(
          `Snapshot progress request failed with status ${progressResponse.status}: ${await this.readErrorBody(progressResponse)}`
        );
      }

      const progressPayload = await this.parseResponseBody(progressResponse) as Record<string, any>;
      const status = String(progressPayload?.status || '').toLowerCase();

      if (status === 'ready') {
        return this.downloadSnapshot(snapshotId);
      }

      if (status === 'failed' || status === 'canceled') {
        throw new Error(`Snapshot ${snapshotId} ended with status '${status}'.`);
      }
    }

    throw new Error(`Timed out waiting for dataset snapshot '${snapshotId}'.`);
  }

  private async downloadSnapshot(snapshotId: string): Promise<unknown> {
    const snapshotUrl = new URL(`${this.endpoint}/snapshot/${encodeURIComponent(snapshotId)}`);
    snapshotUrl.searchParams.set('format', 'json');

    const response = await fetch(snapshotUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Snapshot download failed with status ${response.status}: ${await this.readErrorBody(response)}`
      );
    }

    return this.parseResponseBody(response);
  }

  private extractRecords(payload: unknown): Record<string, any>[] {
    if (Array.isArray(payload)) {
      return payload.filter(item => item && typeof item === 'object') as Record<string, any>[];
    }

    if (!payload || typeof payload !== 'object') {
      return [];
    }

    const container = payload as Record<string, unknown>;
    const candidateArrays = [
      container.records,
      container.results,
      container.items,
      container.data,
      container.output,
    ];

    for (const value of candidateArrays) {
      if (Array.isArray(value)) {
        return value.filter(item => item && typeof item === 'object') as Record<string, any>[];
      }
    }

    return [];
  }

  private isSnapshotEnvelope(payload: unknown): payload is { snapshot_id: string } {
    return Boolean(
      payload &&
      typeof payload === 'object' &&
      typeof (payload as { snapshot_id?: unknown }).snapshot_id === 'string'
    );
  }

  private tryParseObject(rawValue: string | undefined): Record<string, unknown> | undefined {
    if (!rawValue) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(rawValue);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : undefined;
    } catch {
      return undefined;
    }
  }

  private coerceStringMap(value: Record<string, unknown> | undefined): Record<string, string> {
    if (!value) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue != null)
        .map(([key, entryValue]) => [key, String(entryValue)])
    );
  }

  private async parseResponseBody(response: Response): Promise<unknown> {
    const rawBody = await response.text();

    if (!response.ok) {
      throw new Error(`API failed with status ${response.status}: ${rawBody || 'Empty error body'}`);
    }

    if (!rawBody) {
      return [];
    }

    try {
      return JSON.parse(rawBody);
    } catch {
      return rawBody;
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
}
