import {
  AnalysisScreenshotStorageProviderContract,
  UploadScreenshotInput,
  UploadScreenshotResult,
} from '../../domain/repositories';

export class SupabaseScreenshotStorageProvider implements AnalysisScreenshotStorageProviderContract {
  private readonly supabaseUrl: string;
  private readonly serviceKey: string;
  private readonly bucket: string;
  private readonly timeoutMs: number;
  private readonly useSignedUrl: boolean;
  private readonly signedUrlExpiresInSec: number;

  constructor() {
    this.supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/g, '');
    this.serviceKey =
      (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim() ||
      (process.env.SUPABASE_ANON_KEY || '').trim();
    this.bucket =
      (process.env.ANALYSIS_SCREENSHOT_SUPABASE_BUCKET || '').trim() ||
      (process.env.SUPABASE_STORAGE_BUCKET_ANALYSIS_SCREENSHOTS || '').trim() ||
      'analysis-screenshots';
    this.timeoutMs = this.resolvePositiveInt(process.env.ANALYSIS_SCREENSHOT_STORAGE_TIMEOUT_MS, 20000);
    this.useSignedUrl = String(process.env.ANALYSIS_SCREENSHOT_USE_SIGNED_URL || '')
      .trim()
      .toLowerCase() === 'true';
    this.signedUrlExpiresInSec = this.resolvePositiveInt(
      process.env.ANALYSIS_SCREENSHOT_SIGNED_URL_EXPIRES_IN_SEC,
      86400
    );
  }

  async uploadScreenshot(input: UploadScreenshotInput): Promise<UploadScreenshotResult> {
    this.assertConfigured();

    const normalizedPath = this.normalizePath(input.path);
    if (!normalizedPath) {
      throw new Error('invalid_screenshot_storage_path');
    }

    const response = await this.fetchWithTimeout(
      `${this.supabaseUrl}/storage/v1/object/${encodeURIComponent(this.bucket)}/${this.encodeObjectPath(normalizedPath)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.serviceKey}`,
          apikey: this.serviceKey,
          'Content-Type': input.contentType || 'application/octet-stream',
          'x-upsert': 'true',
        },
        body: new Uint8Array(input.data),
      }
    );

    if (!response.ok) {
      throw new Error(`supabase_upload_failed_${response.status}_${await this.safeReadBody(response)}`);
    }

    const publicUrl = await this.getAccessibleUrl(normalizedPath);
    return {
      path: normalizedPath,
      publicUrl,
    };
  }

  async deleteScreenshot(path: string): Promise<void> {
    this.assertConfigured();

    const normalizedPath = this.normalizePath(path);
    if (!normalizedPath) {
      return;
    }

    const response = await this.fetchWithTimeout(
      `${this.supabaseUrl}/storage/v1/object/${encodeURIComponent(this.bucket)}/${this.encodeObjectPath(normalizedPath)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.serviceKey}`,
          apikey: this.serviceKey,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      throw new Error(`supabase_delete_failed_${response.status}_${await this.safeReadBody(response)}`);
    }
  }

  async deleteAnalysisScreenshots(paths: string[]): Promise<void> {
    const uniquePaths = Array.from(
      new Set(paths.map(item => this.normalizePath(item)).filter((item): item is string => !!item))
    );

    if (uniquePaths.length === 0) {
      return;
    }

    const deletions = await Promise.allSettled(uniquePaths.map(path => this.deleteScreenshot(path)));
    const failed = deletions.find(item => item.status === 'rejected') as PromiseRejectedResult | undefined;
    if (failed) {
      throw failed.reason;
    }
  }

  async getAccessibleUrl(path: string): Promise<string> {
    this.assertConfigured();

    const normalizedPath = this.normalizePath(path);
    if (!normalizedPath) {
      throw new Error('invalid_screenshot_storage_path');
    }

    if (!this.useSignedUrl) {
      return this.buildPublicUrl(normalizedPath);
    }

    const response = await this.fetchWithTimeout(
      `${this.supabaseUrl}/storage/v1/object/sign/${encodeURIComponent(this.bucket)}/${this.encodeObjectPath(normalizedPath)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.serviceKey}`,
          apikey: this.serviceKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expiresIn: this.signedUrlExpiresInSec,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`supabase_signed_url_failed_${response.status}_${await this.safeReadBody(response)}`);
    }

    const payload = await response.json();
    const signedValue: string =
      String(payload?.signedURL || payload?.signedUrl || payload?.url || '').trim();

    if (!signedValue) {
      throw new Error('supabase_signed_url_missing');
    }

    if (signedValue.startsWith('http://') || signedValue.startsWith('https://')) {
      return signedValue;
    }

    return `${this.supabaseUrl}/storage/v1${signedValue.startsWith('/') ? signedValue : `/${signedValue}`}`;
  }

  private buildPublicUrl(path: string): string {
    return `${this.supabaseUrl}/storage/v1/object/public/${encodeURIComponent(this.bucket)}/${this.encodeObjectPath(path)}`;
  }

  private normalizePath(path: string): string {
    return String(path || '')
      .replace(/\\/g, '/')
      .replace(/^\/+/g, '')
      .trim();
  }

  private encodeObjectPath(path: string): string {
    return path
      .split('/')
      .filter(Boolean)
      .map(segment => encodeURIComponent(segment))
      .join('/');
  }

  private assertConfigured(): void {
    if (!this.supabaseUrl || !this.serviceKey || !this.bucket) {
      throw new Error('supabase_storage_not_configured_for_analysis_screenshots');
    }
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async safeReadBody(response: Response): Promise<string> {
    try {
      const text = await response.text();
      return text || 'empty_error_body';
    } catch {
      return 'error_body_unavailable';
    }
  }

  private resolvePositiveInt(rawValue: string | undefined, fallback: number): number {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }
    return Math.floor(parsed);
  }
}
