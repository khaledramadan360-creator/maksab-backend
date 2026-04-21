import { v4 as uuidv4 } from 'uuid';
import { Op, Transaction, WhereOptions } from 'sequelize';
import {
  MarketingSeasonCreateRecord,
  MarketingSeasonRepository,
  MarketingSeasonUpdatePatch,
  MarketingSeasonsListFilters,
  PaginatedResult,
  PaginationParams,
  RepositoryActionOptions,
} from '../../domain/repositories';
import { MarketingSeason, MarketingSeasonSummary } from '../../domain/entities';
import { MarketingSeasonStatus } from '../../domain/enums';
import { MarketingSeasonModel } from '../persistence/models/marketing-season.model';
import { MarketingSeasonMapper } from '../mappers/marketing-season.mapper';

export class MySQLMarketingSeasonRepository implements MarketingSeasonRepository {
  async create(
    record: MarketingSeasonCreateRecord,
    options?: RepositoryActionOptions
  ): Promise<MarketingSeason> {
    const now = new Date();
    const model = await MarketingSeasonModel.create(
      {
        id: uuidv4(),
        title: record.title,
        description: record.description,
        status: record.status,
        ownerUserId: record.ownerUserId,
        createdAt: now,
        updatedAt: now,
      },
      this.toWriteOptions(options)
    );

    return MarketingSeasonMapper.toDomain(model);
  }

  async update(
    seasonId: string,
    patch: MarketingSeasonUpdatePatch,
    options?: RepositoryActionOptions
  ): Promise<MarketingSeason> {
    const model = await MarketingSeasonModel.findByPk(seasonId, this.toFindOptions(options));
    if (!model) {
      throw new Error('Marketing season not found');
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (patch.title !== undefined) {
      updates.title = patch.title;
    }
    if (patch.description !== undefined) {
      updates.description = patch.description;
    }

    await model.update(updates, this.toWriteOptions(options));
    return MarketingSeasonMapper.toDomain(model);
  }

  async delete(seasonId: string, options?: RepositoryActionOptions): Promise<void> {
    await MarketingSeasonModel.destroy({
      where: { id: seasonId },
      transaction: this.toTransaction(options),
    });
  }

  async findById(
    seasonId: string,
    options?: RepositoryActionOptions
  ): Promise<MarketingSeason | null> {
    const model = await MarketingSeasonModel.findByPk(seasonId, this.toFindOptions(options));
    return model ? MarketingSeasonMapper.toDomain(model) : null;
  }

  async list(
    filters: MarketingSeasonsListFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<MarketingSeasonSummary>> {
    const where: WhereOptions = {};

    if (filters.keyword && filters.keyword.trim() !== '') {
      const keyword = `%${filters.keyword.trim()}%`;
      (where as any)[Op.or] = [
        { title: { [Op.like]: keyword } },
        { description: { [Op.like]: keyword } },
      ];
    }

    if (filters.status) {
      where['status'] = filters.status;
    }

    if (filters.ownerUserId) {
      where['ownerUserId'] = filters.ownerUserId;
    }

    if (filters.createdAtFrom || filters.createdAtTo) {
      const createdAtRange: Record<symbol, Date> = {};
      if (filters.createdAtFrom) {
        createdAtRange[Op.gte] = filters.createdAtFrom;
      }
      if (filters.createdAtTo) {
        createdAtRange[Op.lte] = filters.createdAtTo;
      }
      (where as any).createdAt = createdAtRange;
    }

    const page = Math.max(1, pagination.page);
    const pageSize = Math.max(1, Math.min(100, pagination.pageSize));
    const offset = (page - 1) * pageSize;

    const { count, rows } = await MarketingSeasonModel.findAndCountAll({
      where,
      order: [
        ['createdAt', 'DESC'],
        ['updatedAt', 'DESC'],
      ],
      limit: pageSize,
      offset,
    });

    return {
      items: rows.map(row => MarketingSeasonMapper.toSummary(row)),
      total: count,
      page,
      pageSize,
    };
  }

  async findActive(options?: RepositoryActionOptions): Promise<MarketingSeason | null> {
    const model = await MarketingSeasonModel.findOne({
      where: {
        status: MarketingSeasonStatus.Active,
      },
      order: [
        ['updatedAt', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      transaction: this.toTransaction(options),
    });

    return model ? MarketingSeasonMapper.toDomain(model) : null;
  }

  async deactivateAll(options?: RepositoryActionOptions): Promise<void> {
    await MarketingSeasonModel.update(
      {
        status: MarketingSeasonStatus.Inactive,
        updatedAt: new Date(),
      },
      {
        where: {
          status: MarketingSeasonStatus.Active,
        },
        transaction: this.toTransaction(options),
      }
    );
  }

  async activateById(
    seasonId: string,
    options?: RepositoryActionOptions
  ): Promise<MarketingSeason> {
    const model = await MarketingSeasonModel.findByPk(seasonId, this.toFindOptions(options));
    if (!model) {
      throw new Error('Marketing season not found');
    }

    await model.update(
      {
        status: MarketingSeasonStatus.Active,
        updatedAt: new Date(),
      },
      this.toWriteOptions(options)
    );

    return MarketingSeasonMapper.toDomain(model);
  }

  private toTransaction(options?: RepositoryActionOptions): Transaction | undefined {
    return options?.transaction as Transaction | undefined;
  }

  private toFindOptions(options?: RepositoryActionOptions): { transaction?: Transaction } {
    return {
      transaction: this.toTransaction(options),
    };
  }

  private toWriteOptions(options?: RepositoryActionOptions): { transaction?: Transaction } {
    return {
      transaction: this.toTransaction(options),
    };
  }
}

