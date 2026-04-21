import { MarketingSeasonStatus } from '../domain/enums';
import {
  ActivateMarketingSeasonRequestDto,
  ActiveMarketingSeasonDto,
  CreateMarketingSeasonRequestDto,
  DeleteMarketingSeasonRequestDto,
  GetActiveMarketingSeasonRequestDto,
  GetMarketingSeasonByIdRequestDto,
  ListMarketingSeasonsQueryDto,
  MarketingSeasonDto,
  MarketingSeasonsListResponseDto,
  UpdateMarketingSeasonRequestDto,
} from './marketing-seasons.types';
import { MarketingSeasonsFacade } from './marketing-seasons.facade';
import { ValidationError, NotFoundError } from '../application/errors';
import { MarketingSeasonMapperService } from '../application/services/marketing-season-mapper.service';
import { CreateMarketingSeasonUseCase } from '../application/use-cases/create-marketing-season.use-case';
import { UpdateMarketingSeasonUseCase } from '../application/use-cases/update-marketing-season.use-case';
import { DeleteMarketingSeasonUseCase } from '../application/use-cases/delete-marketing-season.use-case';
import { ListMarketingSeasonsUseCase } from '../application/use-cases/list-marketing-seasons.use-case';
import { GetMarketingSeasonByIdUseCase } from '../application/use-cases/get-marketing-season-by-id.use-case';
import { ActivateMarketingSeasonUseCase } from '../application/use-cases/activate-marketing-season.use-case';
import { GetActiveMarketingSeasonUseCase } from '../application/use-cases/get-active-marketing-season.use-case';

export class MarketingSeasonsFacadeImpl implements MarketingSeasonsFacade {
  constructor(
    private readonly mapper: MarketingSeasonMapperService,
    private readonly createMarketingSeasonUseCase: CreateMarketingSeasonUseCase,
    private readonly updateMarketingSeasonUseCase: UpdateMarketingSeasonUseCase,
    private readonly deleteMarketingSeasonUseCase: DeleteMarketingSeasonUseCase,
    private readonly listMarketingSeasonsUseCase: ListMarketingSeasonsUseCase,
    private readonly getMarketingSeasonByIdUseCase: GetMarketingSeasonByIdUseCase,
    private readonly activateMarketingSeasonUseCase: ActivateMarketingSeasonUseCase,
    private readonly getActiveMarketingSeasonUseCase: GetActiveMarketingSeasonUseCase
  ) {}

  async createMarketingSeason(input: CreateMarketingSeasonRequestDto): Promise<MarketingSeasonDto> {
    const season = await this.createMarketingSeasonUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      title: input.title,
      description: input.description,
    });

    return this.mapper.toMarketingSeasonDto(season);
  }

  async updateMarketingSeason(input: UpdateMarketingSeasonRequestDto): Promise<MarketingSeasonDto> {
    const season = await this.updateMarketingSeasonUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      seasonId: input.seasonId,
      title: input.title,
      description: input.description,
    });

    return this.mapper.toMarketingSeasonDto(season);
  }

  async deleteMarketingSeason(input: DeleteMarketingSeasonRequestDto): Promise<void> {
    await this.deleteMarketingSeasonUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      seasonId: input.seasonId,
    });
  }

  async listMarketingSeasons(input: ListMarketingSeasonsQueryDto): Promise<MarketingSeasonsListResponseDto> {
    const createdAtFrom = this.toDateFilter(input.createdAtFrom, 'from');
    const createdAtTo = this.toDateFilter(input.createdAtTo, 'to');

    if (createdAtFrom && createdAtTo && createdAtFrom.getTime() > createdAtTo.getTime()) {
      throw new ValidationError('createdAtFrom must be before or equal to createdAtTo');
    }

    const result = await this.listMarketingSeasonsUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      filters: {
        keyword: input.keyword,
        status: input.status ? this.toStatus(input.status) : undefined,
        ownerUserId: input.ownerUserId,
        createdAtFrom,
        createdAtTo,
      },
      page: input.page,
      pageSize: input.pageSize,
    });

    return this.mapper.toMarketingSeasonListResponseDto(result);
  }

  async getMarketingSeasonById(input: GetMarketingSeasonByIdRequestDto): Promise<MarketingSeasonDto | null> {
    try {
      const season = await this.getMarketingSeasonByIdUseCase.execute({
        actorUserId: input.actorUserId,
        actorUserRole: input.actorUserRole,
        seasonId: input.seasonId,
      });
      return this.mapper.toMarketingSeasonDto(season);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null;
      }
      throw error;
    }
  }

  async activateMarketingSeason(input: ActivateMarketingSeasonRequestDto): Promise<MarketingSeasonDto> {
    const season = await this.activateMarketingSeasonUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      seasonId: input.seasonId,
    });

    return this.mapper.toMarketingSeasonDto(season);
  }

  async getActiveMarketingSeason(
    input: GetActiveMarketingSeasonRequestDto
  ): Promise<ActiveMarketingSeasonDto | null> {
    const activeSeason = await this.getActiveMarketingSeasonUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
    });

    return activeSeason ? this.mapper.toActiveMarketingSeasonDto(activeSeason) : null;
  }

  private toStatus(value: string): MarketingSeasonStatus {
    return value as MarketingSeasonStatus;
  }

  private toDateFilter(value: string | undefined, direction: 'from' | 'to'): Date | undefined {
    if (!value) {
      return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const parsed = this.parseDateFilterValue(trimmed, direction);
    if (!parsed) {
      throw new ValidationError(
        `Invalid ${direction === 'from' ? 'createdAtFrom' : 'createdAtTo'} format`
      );
    }

    return parsed;
  }

  private parseDateFilterValue(value: string, direction: 'from' | 'to'): Date | null {
    const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (isoDateMatch) {
      return this.buildUtcDateBoundary(
        Number(isoDateMatch[1]),
        Number(isoDateMatch[2]),
        Number(isoDateMatch[3]),
        direction
      );
    }

    const slashDateMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
    if (slashDateMatch) {
      const first = Number(slashDateMatch[1]);
      const second = Number(slashDateMatch[2]);
      const year = Number(slashDateMatch[3]);

      let month = first;
      let day = second;
      if (first > 12 && second <= 12) {
        day = first;
        month = second;
      } else if (first > 12 && second > 12) {
        return null;
      }

      return this.buildUtcDateBoundary(year, month, day, direction);
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    const hasExplicitTime = /T\d{2}:\d{2}| \d{1,2}:\d{2}/.test(value);
    if (hasExplicitTime) {
      return parsed;
    }

    return this.buildUtcDateBoundary(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth() + 1,
      parsed.getUTCDate(),
      direction
    );
  }

  private buildUtcDateBoundary(
    year: number,
    month: number,
    day: number,
    direction: 'from' | 'to'
  ): Date | null {
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    const parsed = new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        direction === 'from' ? 0 : 23,
        direction === 'from' ? 0 : 59,
        direction === 'from' ? 0 : 59,
        direction === 'from' ? 0 : 999
      )
    );

    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      return null;
    }

    return parsed;
  }
}

