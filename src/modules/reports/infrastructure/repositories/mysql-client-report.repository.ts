import { v4 as uuidv4 } from 'uuid';
import { QueryTypes, Transaction } from 'sequelize';
import {
  ClientReportCreateRecord,
  ClientReportRepository,
  PaginatedResult,
  PaginationParams,
  ReplaceClientReportRecord,
  ReportsListFilters,
} from '../../domain/repositories';
import { ClientReport, TeamReportOverviewItem } from '../../domain/entities';
import { ClientReportModel } from '../persistence/models/client-report.model';
import { ClientReportMapper } from '../mappers/client-report.mapper';
import { ReportStatus } from '../../domain/enums';
import { sequelize } from '../../../../core/database/sequelize.config';

export class MySQLClientReportRepository implements ClientReportRepository {
  async create(record: ClientReportCreateRecord): Promise<ClientReport> {
    const now = new Date();
    const model = await ClientReportModel.create({
      id: uuidv4(),
      clientId: record.clientId,
      analysisId: record.analysisId,
      ownerUserId: record.ownerUserId,
      templateKey: record.templateKey,
      status: record.status,
      format: record.format,
      pdfPath: record.pdfPath,
      pdfUrl: record.pdfUrl,
      generatedAt: record.generatedAt,
      createdAt: now,
      updatedAt: now,
    });

    return ClientReportMapper.toDomain(model);
  }

  async replaceForClient(clientId: string, record: ReplaceClientReportRecord): Promise<ClientReport> {
    return sequelize.transaction(async (transaction: Transaction) => {
      const existing = await ClientReportModel.findOne({
        where: { clientId },
        transaction,
      });

      const now = new Date();
      const payload = {
        clientId,
        analysisId: record.report.analysisId,
        ownerUserId: record.report.ownerUserId,
        templateKey: record.report.templateKey,
        status: record.report.status,
        format: record.report.format,
        pdfPath: record.report.pdfPath,
        pdfUrl: record.report.pdfUrl,
        generatedAt: record.report.generatedAt,
      };

      if (existing) {
        await existing.update(
          {
            ...payload,
            updatedAt: now,
          },
          { transaction }
        );

        return ClientReportMapper.toDomain(existing);
      }

      const created = await ClientReportModel.create(
        {
          id: uuidv4(),
          ...payload,
          createdAt: now,
          updatedAt: now,
        },
        { transaction }
      );

      return ClientReportMapper.toDomain(created);
    });
  }

  async findByClientId(clientId: string): Promise<ClientReport | null> {
    const row = await ClientReportModel.findOne({
      where: { clientId },
    });

    if (!row) {
      return null;
    }

    return ClientReportMapper.toDomain(row);
  }

  async findById(reportId: string): Promise<ClientReport | null> {
    const row = await ClientReportModel.findByPk(reportId);
    if (!row) {
      return null;
    }

    return ClientReportMapper.toDomain(row);
  }

  async list(
    filters: ReportsListFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<TeamReportOverviewItem>> {
    const page = Math.max(1, pagination.page);
    const pageSize = Math.max(1, Math.min(100, pagination.pageSize));
    const offset = (page - 1) * pageSize;

    const whereParts: string[] = [];
    const replacements: Record<string, unknown> = {
      limit: pageSize,
      offset,
    };

    if (filters.keyword && filters.keyword.trim() !== '') {
      replacements.keyword = `%${filters.keyword.trim()}%`;
      whereParts.push('(c.name LIKE :keyword OR u.full_name LIKE :keyword)');
    }

    if (filters.ownerUserId) {
      replacements.ownerUserId = filters.ownerUserId;
      whereParts.push('r.owner_user_id = :ownerUserId');
    }

    if (filters.status) {
      replacements.status = filters.status;
      whereParts.push('r.status = :status');
    }

    if (filters.generatedAtFrom) {
      replacements.generatedAtFrom = filters.generatedAtFrom;
      whereParts.push('r.generated_at >= :generatedAtFrom');
    }

    if (filters.generatedAtTo) {
      replacements.generatedAtTo = filters.generatedAtTo;
      whereParts.push('r.generated_at <= :generatedAtTo');
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    const rows = await sequelize.query<{
      reportId: string;
      clientId: string;
      clientName: string;
      ownerUserId: string;
      ownerName: string | null;
      status: string;
      generatedAt: Date | null;
      updatedAt: Date;
    }>(
      `
      SELECT
        r.id AS reportId,
        r.client_id AS clientId,
        c.name AS clientName,
        r.owner_user_id AS ownerUserId,
        u.full_name AS ownerName,
        r.status AS status,
        r.generated_at AS generatedAt,
        r.updated_at AS updatedAt
      FROM client_reports r
      INNER JOIN clients c ON c.id = r.client_id
      LEFT JOIN users u ON u.id = r.owner_user_id
      ${whereClause}
      ORDER BY
        CASE WHEN r.generated_at IS NULL THEN 1 ELSE 0 END ASC,
        r.generated_at DESC,
        r.updated_at DESC
      LIMIT :limit OFFSET :offset
      `,
      {
        type: QueryTypes.SELECT,
        replacements,
      }
    );

    const countRows = await sequelize.query<{ total: number | string }>(
      `
      SELECT COUNT(*) AS total
      FROM client_reports r
      INNER JOIN clients c ON c.id = r.client_id
      LEFT JOIN users u ON u.id = r.owner_user_id
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
        reportId: row.reportId,
        clientId: row.clientId,
        clientName: row.clientName,
        ownerUserId: row.ownerUserId,
        ownerName: this.normalizeOptionalName(row.ownerName),
        status: row.status as ReportStatus,
        generatedAt: row.generatedAt,
        updatedAt: row.updatedAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async deleteById(reportId: string): Promise<void> {
    await ClientReportModel.destroy({
      where: { id: reportId },
    });
  }

  private normalizeOptionalName(value: string | null): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
}
