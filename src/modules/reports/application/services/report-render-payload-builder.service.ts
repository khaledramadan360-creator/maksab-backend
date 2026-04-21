import { ReportRenderPayload } from '../../domain/entities';
import {
  ReportsAnalysisLookupRepository,
  ReportsClientsLookupRepository,
  ReportsMarketingSeasonsLookupRepository,
} from '../../domain/repositories';
import { NotFoundError, ValidationError } from '../errors';

export class ReportRenderPayloadBuilderService {
  constructor(
    private readonly clientsLookupRepo: ReportsClientsLookupRepository,
    private readonly analysisLookupRepo: ReportsAnalysisLookupRepository,
    private readonly marketingSeasonsLookupRepo: ReportsMarketingSeasonsLookupRepository
  ) {}

  async buildForClient(clientId: string): Promise<ReportRenderPayload> {
    const activeMarketingSeason = await this.marketingSeasonsLookupRepo.findActiveMarketingSeason();
    const payload = await this.analysisLookupRepo.getReportRenderPayload(clientId);
    if (payload) {
      return this.normalizePayload({
        ...payload,
        marketingSeason: payload.marketingSeason ?? activeMarketingSeason,
      });
    }

    const client = await this.clientsLookupRepo.findClientForReport(clientId);
    if (!client) {
      throw new NotFoundError('Client not found');
    }

    const hasSavedAnalysis = await this.analysisLookupRepo.hasSavedAnalysis(clientId);
    if (!hasSavedAnalysis) {
      throw new ValidationError('Cannot generate report without a saved analysis');
    }

    const analysis = await this.analysisLookupRepo.findLatestAnalysisForClient(clientId);
    if (!analysis) {
      throw new ValidationError('Saved analysis data is unavailable for report generation');
    }

    const screenshots = await this.analysisLookupRepo.findSavedScreenshotsForClient(clientId);

    return this.normalizePayload({
      client,
      analysis,
      screenshots,
      marketingSeason: activeMarketingSeason,
    });
  }

  private normalizePayload(payload: ReportRenderPayload): ReportRenderPayload {
    return {
      client: {
        id: payload.client.id,
        name: String(payload.client.name || '').trim(),
        ownerUserId: payload.client.ownerUserId,
        ownerName: payload.client.ownerName ? payload.client.ownerName.trim() : null,
        saudiCity: payload.client.saudiCity ? payload.client.saudiCity.trim() : null,
      },
      analysis: {
        id: payload.analysis.id,
        summary: payload.analysis.summary ? payload.analysis.summary.trim() : null,
        overallScore: this.toNullableNumber(payload.analysis.overallScore),
        strengths: this.normalizeStringArray(payload.analysis.strengths),
        weaknesses: this.normalizeStringArray(payload.analysis.weaknesses),
        recommendations: this.normalizeStringArray(payload.analysis.recommendations),
        analyzedAt: payload.analysis.analyzedAt ? new Date(payload.analysis.analyzedAt) : null,
        platformAnalyses: payload.analysis.platformAnalyses.map(item => ({
          platform: String(item.platform || '').trim().toLowerCase(),
          platformUrl: String(item.platformUrl || '').trim(),
          platformScore: this.toNullableNumber(item.platformScore),
          summary: item.summary ? item.summary.trim() : null,
          strengths: this.normalizeStringArray(item.strengths),
          weaknesses: this.normalizeStringArray(item.weaknesses),
          recommendations: this.normalizeStringArray(item.recommendations),
        })),
      },
      screenshots: payload.screenshots.map(item => ({
        platform: String(item.platform || '').trim().toLowerCase(),
        platformUrl: String(item.platformUrl || '').trim(),
        publicUrl: item.publicUrl ? item.publicUrl.trim() : null,
        captureStatus: String(item.captureStatus || '').trim().toLowerCase() || 'failed',
        capturedAt: item.capturedAt ? new Date(item.capturedAt) : null,
      })),
      marketingSeason: payload.marketingSeason
        ? {
            id: payload.marketingSeason.id,
            title: String(payload.marketingSeason.title || '').trim(),
            description: payload.marketingSeason.description
              ? payload.marketingSeason.description.trim()
              : null,
          }
        : null,
    };
  }

  private normalizeStringArray(values: string[]): string[] {
    if (!Array.isArray(values)) {
      return [];
    }

    return values
      .filter(item => typeof item === 'string')
      .map(item => item.trim())
      .filter(item => item !== '');
  }

  private toNullableNumber(value: number | null): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return null;
    }

    return Number(value.toFixed(2));
  }
}
