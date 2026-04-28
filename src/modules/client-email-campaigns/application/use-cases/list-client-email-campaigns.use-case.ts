import { Role } from '../../../auth/domain/enums';
import { CampaignStatus } from '../../domain/enums';
import {
  ClientEmailCampaignAccessDeniedError,
  ClientEmailCampaignValidationError,
} from '../../domain/errors';
import { ClientEmailCampaignRepository } from '../../domain/repositories';
import { ClientEmailCampaignMapperService } from '../services/client-email-campaign-mapper.service';
import {
  ListClientEmailCampaignsQueryDto,
  ListClientEmailCampaignsResponseDto,
  RequestActorContext,
} from '../../public/client-email-campaigns.types';

export class ListClientEmailCampaignsUseCase {
  constructor(
    private readonly campaignRepo: ClientEmailCampaignRepository,
    private readonly mapper: ClientEmailCampaignMapperService
  ) {}

  async execute(
    query: ListClientEmailCampaignsQueryDto,
    actor: RequestActorContext
  ): Promise<ListClientEmailCampaignsResponseDto> {
    if (![Role.Admin, Role.Manager, Role.Employee].includes(actor.role as Role)) {
      throw new ClientEmailCampaignAccessDeniedError();
    }

    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.max(1, Math.min(100, Number(query.pageSize ?? 20)));
    const createdAtFrom = this.toDateFilter(query.createdAtFrom ?? query.dateFrom, 'from');
    const createdAtTo = this.toDateFilter(query.createdAtTo ?? query.dateTo, 'to');

    if (createdAtFrom && createdAtTo && createdAtFrom.getTime() > createdAtTo.getTime()) {
      throw new ClientEmailCampaignValidationError('createdAtFrom must be before or equal to createdAtTo');
    }

    const result = await this.campaignRepo.list(
      {
        requestedByUserId: actor.role === Role.Employee ? actor.userId : undefined,
        status: query.status as CampaignStatus | undefined,
        createdAtFrom,
        createdAtTo,
      },
      { page, pageSize }
    );

    return {
      items: result.items.map(item => this.mapper.toCampaignDto(item)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
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
      throw new ClientEmailCampaignValidationError(
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
