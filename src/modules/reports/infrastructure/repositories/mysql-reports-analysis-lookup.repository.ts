import { ClientModel } from '../../../clients/infrastructure/persistence/models/client.model';
import { UserModel } from '../../../auth/infrastructure/persistence/models/user.model';
import { ClientAnalysisModel } from '../../../analysis/infrastructure/persistence/models/client-analysis.model';
import { ClientPlatformAnalysisModel } from '../../../analysis/infrastructure/persistence/models/client-platform-analysis.model';
import { ClientAnalysisScreenshotModel } from '../../../analysis/infrastructure/persistence/models/client-analysis-screenshot.model';
import {
  ReportAnalysisSnapshot,
  ReportClientSnapshot,
  ReportRenderPayload,
  ReportScreenshotSnapshot,
} from '../../domain/entities';
import { ReportsAnalysisLookupRepository } from '../../domain/repositories';
import { ClientReportMapper } from '../mappers/client-report.mapper';

export class MySQLReportsAnalysisLookupRepository implements ReportsAnalysisLookupRepository {
  async hasSavedAnalysis(clientId: string): Promise<boolean> {
    const count = await ClientAnalysisModel.count({
      where: { clientId },
    });

    return count > 0;
  }

  async findLatestAnalysisForClient(clientId: string): Promise<ReportAnalysisSnapshot | null> {
    const analysisModel = await this.findLatestAnalysisModel(clientId);
    if (!analysisModel) {
      return null;
    }

    return this.toAnalysisSnapshot(analysisModel);
  }

  async findSavedScreenshotsForClient(clientId: string): Promise<ReportScreenshotSnapshot[]> {
    const analysisModel = await this.findLatestAnalysisModel(clientId);
    if (!analysisModel) {
      return [];
    }

    return this.findScreenshotsByAnalysisId(analysisModel.id);
  }

  async getReportRenderPayload(clientId: string): Promise<ReportRenderPayload | null> {
    const client = await this.findClientSnapshot(clientId);
    if (!client) {
      return null;
    }

    const analysisModel = await this.findLatestAnalysisModel(clientId);
    if (!analysisModel) {
      return null;
    }

    const analysis = await this.toAnalysisSnapshot(analysisModel);
    const screenshots = await this.findScreenshotsByAnalysisId(analysis.id);

    return {
      client,
      analysis,
      screenshots,
    };
  }

  private async findClientSnapshot(clientId: string): Promise<ReportClientSnapshot | null> {
    const client = await ClientModel.findByPk(clientId);
    if (!client) {
      return null;
    }

    const owner = await UserModel.findByPk(client.ownerUserId, {
      attributes: ['id', 'fullName'],
    });

    return {
      id: client.id,
      name: client.name,
      ownerUserId: client.ownerUserId,
      ownerName: owner?.fullName ?? null,
      saudiCity: client.saudiCity,
    };
  }

  private async findLatestAnalysisModel(clientId: string): Promise<ClientAnalysisModel | null> {
    return ClientAnalysisModel.findOne({
      where: { clientId },
      order: [
        ['analyzedAt', 'DESC'],
        ['updatedAt', 'DESC'],
      ],
    });
  }

  private async toAnalysisSnapshot(model: ClientAnalysisModel): Promise<ReportAnalysisSnapshot> {
    const platformRows = await ClientPlatformAnalysisModel.findAll({
      where: { clientAnalysisId: model.id },
      order: [
        ['createdAt', 'ASC'],
        ['platform', 'ASC'],
      ],
    });

    return {
      id: model.id,
      summary: model.summary,
      overallScore: ClientReportMapper.toNullableNumber(model.overallScore),
      strengths: this.normalizeStringArray(model.strengths),
      weaknesses: this.normalizeStringArray(model.weaknesses),
      recommendations: this.normalizeStringArray(model.recommendations),
      analyzedAt: model.analyzedAt,
      platformAnalyses: platformRows.map(item => ({
        platform: item.platform,
        platformUrl: item.platformUrl,
        platformScore: ClientReportMapper.toNullableNumber(item.platformScore),
        summary: item.summary,
        strengths: this.normalizeStringArray(item.strengths),
        weaknesses: this.normalizeStringArray(item.weaknesses),
        recommendations: this.normalizeStringArray(item.recommendations),
      })),
    };
  }

  private async findScreenshotsByAnalysisId(analysisId: string): Promise<ReportScreenshotSnapshot[]> {
    const rows = await ClientAnalysisScreenshotModel.findAll({
      where: { clientAnalysisId: analysisId },
      order: [
        ['createdAt', 'ASC'],
        ['platform', 'ASC'],
      ],
    });

    return rows.map(row => ({
      platform: row.platform,
      platformUrl: row.platformUrl,
      publicUrl: row.publicUrl,
      captureStatus: row.captureStatus,
      capturedAt: row.capturedAt,
    }));
  }

  private normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter(item => typeof item === 'string')
      .map(item => (item as string).trim())
      .filter(item => item !== '');
  }
}
