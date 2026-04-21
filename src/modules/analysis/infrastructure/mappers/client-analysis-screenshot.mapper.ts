import { ClientAnalysisScreenshot } from '../../domain/entities';
import { AnalysisScreenshotStatus, AnalysisSourcePlatform } from '../../domain/enums';
import { ClientAnalysisScreenshotModel } from '../persistence/models/client-analysis-screenshot.model';

export class ClientAnalysisScreenshotMapper {
  static toDomain(model: ClientAnalysisScreenshotModel): ClientAnalysisScreenshot {
    return {
      id: model.id,
      clientAnalysisId: model.clientAnalysisId,
      platform: model.platform as AnalysisSourcePlatform,
      platformUrl: model.platformUrl,
      supabasePath: model.supabasePath,
      publicUrl: model.publicUrl,
      captureStatus: model.captureStatus as AnalysisScreenshotStatus,
      capturedAt: model.capturedAt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
