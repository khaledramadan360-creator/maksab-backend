import { v4 as uuidv4 } from 'uuid';
import { QueryTypes, Transaction } from 'sequelize';
import {
  ClientAnalysisCreateRecord,
  ClientAnalysisRepository,
  PaginatedResult,
  PaginationParams,
  ReplaceClientAnalysisRecord,
  TeamAnalysisOverviewFilters,
} from '../../domain/repositories';
import { ClientAnalysis, TeamAnalysisOverviewItem } from '../../domain/entities';
import { ClientAnalysisModel } from '../persistence/models/client-analysis.model';
import { ClientPlatformAnalysisModel } from '../persistence/models/client-platform-analysis.model';
import { ClientAnalysisMapper } from '../mappers/client-analysis.mapper';
import { sequelize } from '../../../../core/database/sequelize.config';

export class MySQLClientAnalysisRepository implements ClientAnalysisRepository {
  async create(record: ClientAnalysisCreateRecord): Promise<ClientAnalysis> {
    const now = new Date();
    const model = await ClientAnalysisModel.create({
      id: uuidv4(),
      clientId: record.clientId,
      ownerUserId: record.ownerUserId,
      status: record.status,
      summary: record.summary,
      overallScore: record.overallScore,
      strengths: record.strengths,
      weaknesses: record.weaknesses,
      recommendations: record.recommendations,
      analyzedAt: record.analyzedAt,
      createdAt: now,
      updatedAt: now,
    });

    return ClientAnalysisMapper.toDomain(model);
  }

  async replaceForClient(clientId: string, record: ReplaceClientAnalysisRecord): Promise<ClientAnalysis> {
    return sequelize.transaction(async (transaction: Transaction) => {
      const existing = await ClientAnalysisModel.findOne({
        where: { clientId },
        transaction,
      });

      const now = new Date();
      const analysisPayload = {
        clientId,
        ownerUserId: record.analysis.ownerUserId,
        status: record.analysis.status,
        summary: record.analysis.summary,
        overallScore: record.analysis.overallScore,
        strengths: record.analysis.strengths,
        weaknesses: record.analysis.weaknesses,
        recommendations: record.analysis.recommendations,
        analyzedAt: record.analysis.analyzedAt,
      };

      let savedAnalysisModel: ClientAnalysisModel;

      if (existing) {
        await ClientPlatformAnalysisModel.destroy({
          where: { clientAnalysisId: existing.id },
          transaction,
        });

        await existing.update(
          {
            ...analysisPayload,
            updatedAt: now,
          },
          { transaction }
        );
        savedAnalysisModel = existing;
      } else {
        savedAnalysisModel = await ClientAnalysisModel.create(
          {
            id: uuidv4(),
            ...analysisPayload,
            createdAt: now,
            updatedAt: now,
          },
          { transaction }
        );
      }

      if (record.platformAnalyses.length > 0) {
        await ClientPlatformAnalysisModel.bulkCreate(
          record.platformAnalyses.map(item => ({
            id: uuidv4(),
            clientAnalysisId: savedAnalysisModel.id,
            platform: item.platform,
            platformUrl: item.platformUrl,
            platformScore: item.platformScore,
            summary: item.summary,
            strengths: item.strengths,
            weaknesses: item.weaknesses,
            recommendations: item.recommendations,
            createdAt: now,
            updatedAt: now,
          })),
          { transaction }
        );
      }

      return ClientAnalysisMapper.toDomain(savedAnalysisModel);
    });
  }

  async findByClientId(clientId: string): Promise<ClientAnalysis | null> {
    const model = await ClientAnalysisModel.findOne({
      where: { clientId },
    });

    if (!model) {
      return null;
    }

    return ClientAnalysisMapper.toDomain(model);
  }

  async deleteByClientId(clientId: string): Promise<void> {
    await ClientAnalysisModel.destroy({
      where: { clientId },
    });
  }

  async listTeamOverview(
    filters: TeamAnalysisOverviewFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<TeamAnalysisOverviewItem>> {
    const page = Math.max(1, pagination.page);
    const pageSize = Math.max(1, pagination.pageSize);
    const offset = (page - 1) * pageSize;

    const whereParts: string[] = [];
    const replacements: Record<string, any> = {
      limit: pageSize,
      offset,
    };

    if (filters.keyword && filters.keyword.trim() !== '') {
      replacements.keyword = `%${filters.keyword.trim()}%`;
      whereParts.push('(c.name LIKE :keyword OR u.full_name LIKE :keyword)');
    }

    if (filters.ownerUserId) {
      replacements.ownerUserId = filters.ownerUserId;
      whereParts.push('c.owner_user_id = :ownerUserId');
    }

    if (typeof filters.hasAnalysis === 'boolean') {
      whereParts.push(filters.hasAnalysis ? 'ca.id IS NOT NULL' : 'ca.id IS NULL');
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    const rows = await sequelize.query<{
      clientId: string;
      clientName: string;
      ownerUserId: string;
      ownerName: string | null;
      overallScore: string | number | null;
      analyzedAt: Date | null;
      hasAnalysis: number;
    }>(
      `
      SELECT
        c.id AS clientId,
        c.name AS clientName,
        c.owner_user_id AS ownerUserId,
        u.full_name AS ownerName,
        ca.overall_score AS overallScore,
        ca.analyzed_at AS analyzedAt,
        CASE WHEN ca.id IS NULL THEN 0 ELSE 1 END AS hasAnalysis
      FROM clients c
      LEFT JOIN users u ON u.id = c.owner_user_id
      LEFT JOIN client_analyses ca ON ca.client_id = c.id
      ${whereClause}
      ORDER BY
        CASE WHEN ca.analyzed_at IS NULL THEN 1 ELSE 0 END ASC,
        ca.analyzed_at DESC,
        c.created_at DESC
      LIMIT :limit OFFSET :offset
      `,
      {
        type: QueryTypes.SELECT,
        replacements,
      }
    );

    const countRows = await sequelize.query<{ total: number }>(
      `
      SELECT COUNT(*) AS total
      FROM clients c
      LEFT JOIN users u ON u.id = c.owner_user_id
      LEFT JOIN client_analyses ca ON ca.client_id = c.id
      ${whereClause}
      `,
      {
        type: QueryTypes.SELECT,
        replacements,
      }
    );

    const total = Number(countRows[0]?.total ?? 0);

    return {
      items: rows.map(row => ({
        clientId: row.clientId,
        clientName: row.clientName,
        ownerUserId: row.ownerUserId,
        ownerName: (row.ownerName || '').trim(),
        overallScore: ClientAnalysisMapper.toNullableNumber(row.overallScore),
        analyzedAt: row.analyzedAt,
        hasAnalysis: Number(row.hasAnalysis) > 0,
      })),
      total,
      page,
      pageSize,
    };
  }
}
