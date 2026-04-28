import path from 'node:path';
import { ClientReport } from '../../domain/entities';
import { FileReferenceResolver, ReportPdfStorageProviderContract, SendableReportFileReference } from '../../domain/repositories';
import { ReportFileMissingError } from '../../domain/errors';

export class ReportFileReferenceResolver implements FileReferenceResolver {
  private readonly appBaseUrl: string;

  constructor(private readonly pdfStorageProvider: ReportPdfStorageProviderContract) {
    this.appBaseUrl = String(process.env.APP_BASE_URL || '')
      .trim()
      .replace(/\/+$/g, '');
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
      return trimmed;
    }

    const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${this.appBaseUrl}${normalizedPath}`;
  }
}
