import { ClientAnalysis } from '../../domain/entities';
import { AnalysisStatus } from '../../domain/enums';
import { ClientAnalysisModel } from '../persistence/models/client-analysis.model';

export class ClientAnalysisMapper {
  static toDomain(model: ClientAnalysisModel): ClientAnalysis {
    return {
      id: model.id,
      clientId: model.clientId,
      ownerUserId: model.ownerUserId,
      status: model.status as AnalysisStatus,
      summary: model.summary,
      overallScore: this.toNullableNumber(model.overallScore),
      strengths: this.toStringArray(model.strengths),
      weaknesses: this.toStringArray(model.weaknesses),
      recommendations: this.toStringArray(model.recommendations),
      analyzedAt: model.analyzedAt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  static toNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  static toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter(item => typeof item === 'string')
      .map(item => (item as string).trim())
      .filter(item => item.length > 0);
  }
}
