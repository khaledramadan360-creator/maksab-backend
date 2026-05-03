import path from 'node:path';
import { ClientReport } from '../../domain/entities';
import { FileReferenceResolver, ReportPdfStorageProviderContract, SendableReportFileReference } from '../../domain/repositories';
import { ReportFileMissingError } from '../../domain/errors';

export class ReportFileReferenceResolver implements FileReferenceResolver {
  private readonly appBaseUrl: string;
  private hasWarnedAboutRelativeUrl = false;

  constructor(private readonly pdfStorageProvider: ReportPdfStorageProviderContract) {
    this.appBaseUrl = this.resolveAppBaseUrl();
  }

  async resolveSendableFile(report: ClientReport): Promise<SendableReportFileReference> {
    const deliveryUrl = await this.resolveDeliveryUrl(report);

    return {
      type: 'url',
      url: deliveryUrl,
      fileName: this.resolveFileName(report),
      contentType: 'application/pdf',
    };
  }

  private async resolveDeliveryUrl(report: ClientReport): Promise<string> {
    // Use the URL stored in the report record first, and normalize to absolute URL if needed.
    const persistedPdfUrl = String(report.pdfUrl || '').trim();
    if (persistedPdfUrl) {
      return this.toAbsoluteUrl(persistedPdfUrl);
    }

    // Fallback to storage provider only when no persisted URL exists.
    if (report.pdfPath) {
      try {
        const storageResolvedUrl = String(
          await this.pdfStorageProvider.getAccessibleUrl(report.pdfPath)
        ).trim();
        if (storageResolvedUrl) {
          return this.toAbsoluteUrl(storageResolvedUrl);
        }
      } catch {
        // Continue to final error.
      }
    }

    throw new ReportFileMissingError('Report file URL is missing and could not be resolved');
  }

  private resolveFileName(report: ClientReport): string {
    if (report.pdfPath) {
      const normalizedPath = report.pdfPath.replace(/\\/g, '/');
      const basename = path.posix.basename(normalizedPath);
      if (basename && basename.toLowerCase().endsWith('.pdf')) {
        return basename;
      }
    }

    return `client-report-${report.id}.pdf`;
  }

  private toAbsoluteUrl(value: string): string {
    const trimmed = String(value || '').trim();
    if (!trimmed) {
      return trimmed;
    }

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    if (!this.appBaseUrl) {
      if (!this.hasWarnedAboutRelativeUrl) {
        this.hasWarnedAboutRelativeUrl = true;
        console.warn(
          '[REPORT_FILE_URL] Relative report URL detected without APP_BASE_URL. ' +
            'Set APP_BASE_URL or use an absolute REPORTS_FILES_BASE_URL.'
        );
      }
      return trimmed;
    }

    const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${this.appBaseUrl}${normalizedPath}`;
  }

  private resolveAppBaseUrl(): string {
    const envCandidates = [
      process.env.APP_BASE_URL,
      process.env.REPORTS_PUBLIC_BASE_URL,
      process.env.BACKEND_BASE_URL,
      process.env.PUBLIC_API_BASE_URL,
    ];

    for (const candidate of envCandidates) {
      const normalized = this.normalizeAbsoluteBaseUrl(candidate);
      if (normalized) {
        return normalized;
      }
    }

    const reportsFilesBaseUrl = String(process.env.REPORTS_FILES_BASE_URL || '').trim();
    const fromReportsBase = this.extractOriginFromAbsoluteUrl(reportsFilesBaseUrl);
    if (fromReportsBase) {
      return fromReportsBase;
    }

    return '';
  }

  private normalizeAbsoluteBaseUrl(value: string | undefined): string {
    const trimmed = String(value || '')
      .trim()
      .replace(/\/+$/g, '');
    if (!trimmed) {
      return '';
    }

    return /^https?:\/\//i.test(trimmed) ? trimmed : '';
  }

  private extractOriginFromAbsoluteUrl(value: string): string {
    const trimmed = String(value || '').trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      return '';
    }

    try {
      return new URL(trimmed).origin;
    } catch {
      return '';
    }
  }
}
