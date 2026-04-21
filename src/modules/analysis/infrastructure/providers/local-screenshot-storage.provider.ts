import { mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  AnalysisScreenshotStorageProviderContract,
  UploadScreenshotInput,
  UploadScreenshotResult,
} from '../../domain/repositories';

const DEFAULT_ANALYSIS_SCREENSHOTS_STORAGE_DIR = 'storage/analysis-screenshots';
const DEFAULT_ANALYSIS_SCREENSHOTS_FILES_BASE_URL = '/api/v1/analysis-screenshots';

export const resolveAnalysisScreenshotsStorageRootPath = (): string => {
  const configured = String(process.env.ANALYSIS_SCREENSHOT_LOCAL_STORAGE_DIR || '').trim();
  if (!configured) {
    return path.resolve(process.cwd(), DEFAULT_ANALYSIS_SCREENSHOTS_STORAGE_DIR);
  }

  return path.isAbsolute(configured)
    ? path.normalize(configured)
    : path.resolve(process.cwd(), configured);
};

export const resolveAnalysisScreenshotsFilesBaseUrl = (): string => {
  const configured = String(process.env.ANALYSIS_SCREENSHOT_FILES_BASE_URL || '').trim();
  if (!configured) {
    return DEFAULT_ANALYSIS_SCREENSHOTS_FILES_BASE_URL;
  }

  return configured.replace(/\/+$/g, '');
};

export class LocalScreenshotStorageProvider implements AnalysisScreenshotStorageProviderContract {
  private readonly storageRootPath: string;
  private readonly filesBaseUrl: string;

  constructor() {
    this.storageRootPath = resolveAnalysisScreenshotsStorageRootPath();
    this.filesBaseUrl = resolveAnalysisScreenshotsFilesBaseUrl();
  }

  async uploadScreenshot(input: UploadScreenshotInput): Promise<UploadScreenshotResult> {
    const normalizedPath = this.normalizePath(input.path);
    if (!normalizedPath) {
      throw new Error('invalid_analysis_screenshot_storage_path');
    }

    const absoluteTargetPath = this.resolveAbsoluteStoragePath(normalizedPath);
    await mkdir(path.dirname(absoluteTargetPath), { recursive: true });
    await writeFile(absoluteTargetPath, input.data);

    return {
      path: normalizedPath,
      publicUrl: this.buildAccessibleUrl(normalizedPath),
    };
  }

  async deleteScreenshot(pathValue: string): Promise<void> {
    const normalizedPath = this.normalizePath(pathValue);
    if (!normalizedPath) {
      return;
    }

    const absolutePath = this.resolveAbsoluteStoragePath(normalizedPath);
    try {
      await unlink(absolutePath);
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async deleteAnalysisScreenshots(paths: string[]): Promise<void> {
    const uniquePaths = Array.from(
      new Set(paths.map(item => this.normalizePath(item)).filter((item): item is string => !!item))
    );

    if (uniquePaths.length === 0) {
      return;
    }

    const deletions = await Promise.allSettled(uniquePaths.map(pathValue => this.deleteScreenshot(pathValue)));
    const failed = deletions.find(item => item.status === 'rejected') as PromiseRejectedResult | undefined;
    if (failed) {
      throw failed.reason;
    }
  }

  async getAccessibleUrl(pathValue: string): Promise<string> {
    const normalizedPath = this.normalizePath(pathValue);
    if (!normalizedPath) {
      throw new Error('invalid_analysis_screenshot_storage_path');
    }

    const absolutePath = this.resolveAbsoluteStoragePath(normalizedPath);
    const fileStats = await stat(absolutePath).catch(() => null);
    if (!fileStats || !fileStats.isFile()) {
      throw new Error('analysis_screenshot_file_not_found');
    }

    return this.buildAccessibleUrl(normalizedPath);
  }

  private normalizePath(pathValue: string): string {
    const raw = String(pathValue || '').trim().replace(/\\/g, '/');
    if (!raw) {
      return '';
    }

    const segments = raw
      .split('/')
      .map(part => this.normalizePathSegment(part, ''))
      .filter(Boolean);
    return segments.join('/');
  }

  private normalizePathSegment(value: string, fallback: string): string {
    const normalized = String(value || '')
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-._]+|[-._]+$/g, '');

    return normalized || fallback;
  }

  private resolveAbsoluteStoragePath(relativePath: string): string {
    const normalizedRoot = path.resolve(this.storageRootPath);
    const absolutePath = path.resolve(normalizedRoot, relativePath);
    const rel = path.relative(normalizedRoot, absolutePath);

    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new Error('invalid_analysis_screenshot_storage_path');
    }

    return absolutePath;
  }

  private buildAccessibleUrl(storagePath: string): string {
    const encodedPath = storagePath
      .split('/')
      .filter(Boolean)
      .map(part => encodeURIComponent(part))
      .join('/');
    const baseUrl = this.filesBaseUrl.replace(/\/+$/g, '');

    if (/^https?:\/\//i.test(baseUrl)) {
      return `${baseUrl}/${encodedPath}`;
    }

    const withLeadingSlash = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
    return `${withLeadingSlash}/${encodedPath}`;
  }
}
