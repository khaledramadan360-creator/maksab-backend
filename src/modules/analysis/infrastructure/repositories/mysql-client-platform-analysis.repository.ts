import { v4 as uuidv4 } from 'uuid';
import {
  ClientPlatformAnalysisCreateRecord,
  ClientPlatformAnalysisRepository,
} from '../../domain/repositories';
import { ClientPlatformAnalysis } from '../../domain/entities';
import { ClientPlatformAnalysisModel } from '../persistence/models/client-platform-analysis.model';
import { ClientPlatformAnalysisMapper } from '../mappers/client-platform-analysis.mapper';

export class MySQLClientPlatformAnalysisRepository implements ClientPlatformAnalysisRepository {
  async saveForAnalysis(
    clientAnalysisId: string,
    platformAnalyses: ClientPlatformAnalysisCreateRecord[]
  ): Promise<ClientPlatformAnalysis[]> {
    if (platformAnalyses.length === 0) {
      return [];
    }

    const now = new Date();
    const rows = await ClientPlatformAnalysisModel.bulkCreate(
      platformAnalyses.map(item => ({
        id: uuidv4(),
        clientAnalysisId,
        platform: item.platform,
        platformUrl: item.platformUrl,
        platformScore: item.platformScore,
        summary: item.summary,
        strengths: item.strengths,
        weaknesses: item.weaknesses,
        recommendations: item.recommendations,
        createdAt: now,
        updatedAt: now,
      }))
    );

    return rows.map(ClientPlatformAnalysisMapper.toDomain);
  }

  async deleteByClientAnalysisId(clientAnalysisId: string): Promise<void> {
    await ClientPlatformAnalysisModel.destroy({
      where: { clientAnalysisId },
    });
  }

  async findByClientAnalysisId(clientAnalysisId: string): Promise<ClientPlatformAnalysis[]> {
    const rows = await ClientPlatformAnalysisModel.findAll({
      where: { clientAnalysisId },
      order: [['createdAt', 'ASC']],
    });

    return rows.map(ClientPlatformAnalysisMapper.toDomain);
  }
}
