import { v4 as uuidv4 } from 'uuid';
import { ClientReport } from '../../domain/entities';
import { ReportFormat, ReportStatus, ReportTemplateKey } from '../../domain/enums';
import { ClientReportRepository, ReportPdfFilePayload, ReportPdfStorageProviderContract } from '../../domain/repositories';

export interface ReplaceClientReportInput {
  clientId: string;
  analysisId: string;
  ownerUserId: string;
  templateKey: ReportTemplateKey;
  pdf: ReportPdfFilePayload;
  fileName: string;
}

export interface ReplaceClientReportResult {
  report: ClientReport;
  replaced: boolean;
}

export class ClientReportReplacementService {
  constructor(
    private readonly reportRepo: ClientReportRepository,
    private readonly pdfStorageProvider: ReportPdfStorageProviderContract
  ) {}

  async replaceForClient(input: ReplaceClientReportInput): Promise<ReplaceClientReportResult> {
    const previous = await this.reportRepo.findByClientId(input.clientId);
    const reportId = previous?.id || uuidv4();

    const storedPdf = previous?.pdfPath
      ? await this.pdfStorageProvider.replacePdf(previous.pdfPath, {
          clientId: input.clientId,
          reportId,
          fileName: input.fileName,
          pdf: input.pdf,
        })
      : await this.pdfStorageProvider.savePdf({
          clientId: input.clientId,
          reportId,
          fileName: input.fileName,
          pdf: input.pdf,
        });

    try {
      const record = {
        clientId: input.clientId,
        analysisId: input.analysisId,
        ownerUserId: input.ownerUserId,
        templateKey: input.templateKey,
        status: ReportStatus.Ready,
        format: ReportFormat.Pdf,
        pdfPath: storedPdf.path,
        pdfUrl: storedPdf.url,
        generatedAt: new Date(),
      };

      const saved = previous
        ? await this.reportRepo.replaceForClient(input.clientId, { report: record })
        : await this.reportRepo.create(record);

      return {
        report: saved,
        replaced: !!previous,
      };
    } catch (error) {
      await this.safeDeleteStoredFile(storedPdf.path);
      throw error;
    }
  }

  private async safeDeleteStoredFile(path: string): Promise<void> {
    try {
      await this.pdfStorageProvider.deletePdf(path);
    } catch {
      // cleanup should be best-effort only.
    }
  }
}
