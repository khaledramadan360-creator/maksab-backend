import { ClientReport } from '../../domain/entities';
import { ReportFormat, ReportStatus, ReportTemplateKey } from '../../domain/enums';
import { ClientReportModel } from '../persistence/models/client-report.model';

export class ClientReportMapper {
  static toDomain(model: ClientReportModel): ClientReport {
    return {
      id: model.id,
      clientId: model.clientId,
      analysisId: model.analysisId,
      ownerUserId: model.ownerUserId,
      templateKey: model.templateKey as ReportTemplateKey,
      status: model.status as ReportStatus,
      format: model.format as ReportFormat,
      pdfPath: model.pdfPath,
      pdfUrl: model.pdfUrl,
      generatedAt: model.generatedAt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  static toNullableNumber(value: string | number | null): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return Number(parsed.toFixed(2));
  }
}
