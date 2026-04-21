import { ClientPlatformAnalysis } from '../../domain/entities';
import { AnalysisSourcePlatform } from '../../domain/enums';
import { ClientAnalysisMapper } from './client-analysis.mapper';
import { ClientPlatformAnalysisModel } from '../persistence/models/client-platform-analysis.model';

export class ClientPlatformAnalysisMapper {
  static toDomain(model: ClientPlatformAnalysisModel): ClientPlatformAnalysis {
    return {
      id: model.id,
      clientAnalysisId: model.clientAnalysisId,
      platform: model.platform as AnalysisSourcePlatform,
      platformUrl: model.platformUrl,
      platformScore: ClientAnalysisMapper.toNullableNumber(model.platformScore),
      summary: model.summary,
      strengths: ClientAnalysisMapper.toStringArray(model.strengths),
      weaknesses: ClientAnalysisMapper.toStringArray(model.weaknesses),
      recommendations: ClientAnalysisMapper.toStringArray(model.recommendations),
    };
  }
}
