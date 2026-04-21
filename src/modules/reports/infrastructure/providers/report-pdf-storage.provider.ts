import { mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ReportPdfStorageProviderContract,
  SavePdfInput,
  SavePdfResult,
} from '../../domain/repositories';

const DEFAULT_REPORTS_STORAGE_DIR = 'storage/reports';
const DEFAULT_REPORTS_FILES_BASE_URL = '/api/v1/reports-files';

export const resolveReportsStorageRootPath = (): string => {
  const configured = String(process.env.REPORTS_LOCAL_STORAGE_DIR || '').trim();
  if (!configured) {
    return path.resolve(process.cwd(), DEFAULT_REPORTS_STORAGE_DIR);
  }

  return path.isAbsolute(configured)
    ? path.normalize(configured)
    : path.resolve(process.cwd(), configured);
};

export const resolveReportsFilesBaseUrl = (): string => {
  const configured = String(process.env.REPORTS_FILES_BASE_URL || '').trim();
  if (!configured) {
    return DEFAULT_REPORTS_FILES_BASE_URL;
  }

  return configured.replace(/\/+$/g, '');
};

export class ReportPdfStorageProvider implements ReportPdfStorageProviderContract {
  private readonly storageRootPath: string;
  private readonly filesBaseUrl: string;

  constructor() {
    this.storageRootPath = resolveReportsStorageRootPath();
    this.filesBaseUrl = resolveReportsFilesBaseUrl();
  }

  async savePdf(input: SavePdfInput): Promise<SavePdfResult> {
    const storagePath = this.buildPdfPath(input.clientId, input.reportId, input.fileName);
    const absoluteTargetPath = this.resolveAbsoluteStoragePath(storagePath);

    await mkdir(path.dirname(absoluteTargetPath), { recursive: true });
    await writeFile(absoluteTargetPath, input.pdf.data);

    return {
      path: storagePath,
      url: this.buildAccessibleUrl(storagePath),
    };
  }

  async replacePdf(previousPath: string, input: SavePdfInput): Promise<SavePdfResult> {
    const saved = await this.savePdf(input);
    const normalizedPreviousPath = this.normalizePath(previousPath);

    if (normalizedPreviousPath && normalizedPreviousPath !== saved.path) {
      try {
        await this.deletePdf(normalizedPreviousPath);
      } catch {
        // old file cleanup is best-effort.
      }
    }

    return saved;
  }

  async deletePdf(pathValue: string): Promise<void> {
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

  async getAccessibleUrl(pathValue: string): Promise<string> {
    const normalizedPath = this.normalizePath(pathValue);
    if (!normalizedPath) {
      throw new Error('invalid_report_pdf_storage_path');
    }

    const absolutePath = this.resolveAbsoluteStoragePath(normalizedPath);
    const fileStats = await stat(absolutePath).catch(() => null);
    if (!fileStats || !fileStats.isFile()) {
      throw new Error('report_pdf_file_not_found');
    }

    return this.buildAccessibleUrl(normalizedPath);
  }

  private buildPdfPath(clientId: string, reportId: string, fileName: string): string {
    const normalizedClientId = this.normalizePathSegment(clientId, 'client');
    const normalizedReportId = this.normalizePathSegment(reportId, 'report');
    const normalizedFileName = this.normalizeFileName(fileName);

    return `${normalizedClientId}/${normalizedReportId}/${normalizedFileName}`;
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

  private normalizeFileName(fileName: string): string {
    const trimmed = String(fileName || '').trim();
    const base = trimmed === '' ? 'report.pdf' : trimmed;
    const safe = base
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-._]+|[-._]+$/g, '');

    if (safe.toLowerCase().endsWith('.pdf')) {
      return safe || 'report.pdf';
    }

    return `${safe || 'report'}.pdf`;
  }

  private resolveAbsoluteStoragePath(relativePath: string): string {
    const normalizedRoot = path.resolve(this.storageRootPath);
    const absolutePath = path.resolve(normalizedRoot, relativePath);
    const rel = path.relative(normalizedRoot, absolutePath);

    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new Error('invalid_report_pdf_storage_path');
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
