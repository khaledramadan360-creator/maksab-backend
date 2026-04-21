import { v4 as uuidv4 } from 'uuid';
import {
  ClientAnalysisScreenshotCreateRecord,
  ClientAnalysisScreenshotRepository,
} from '../../domain/repositories';
import { ClientAnalysisScreenshot } from '../../domain/entities';
import { ClientAnalysisScreenshotModel } from '../persistence/models/client-analysis-screenshot.model';
import { ClientAnalysisScreenshotMapper } from '../mappers/client-analysis-screenshot.mapper';

export class MySQLClientAnalysisScreenshotRepository implements ClientAnalysisScreenshotRepository {
  async saveForAnalysis(
    clientAnalysisId: string,
    screenshots: ClientAnalysisScreenshotCreateRecord[]
  ): Promise<ClientAnalysisScreenshot[]> {
    if (screenshots.length === 0) {
      return [];
    }

    const now = new Date();
    const rows = await ClientAnalysisScreenshotModel.bulkCreate(
      screenshots.map(item => ({
        id: uuidv4(),
        clientAnalysisId,
        platform: item.platform,
        platformUrl: item.platformUrl,
        supabasePath: item.supabasePath,
        publicUrl: item.publicUrl,
        captureStatus: item.captureStatus,
        capturedAt: item.capturedAt,
        createdAt: now,
        updatedAt: now,
      }))
    );

    return rows.map(ClientAnalysisScreenshotMapper.toDomain);
  }

  async findByClientAnalysisId(clientAnalysisId: string): Promise<ClientAnalysisScreenshot[]> {
    const rows = await ClientAnalysisScreenshotModel.findAll({
      where: { clientAnalysisId },
      order: [
        ['createdAt', 'ASC'],
        ['platform', 'ASC'],
      ],
    });

    return rows.map(ClientAnalysisScreenshotMapper.toDomain);
  }

  async deleteByClientAnalysisId(clientAnalysisId: string): Promise<void> {
    await ClientAnalysisScreenshotModel.destroy({
      where: { clientAnalysisId },
    });
  }
}
