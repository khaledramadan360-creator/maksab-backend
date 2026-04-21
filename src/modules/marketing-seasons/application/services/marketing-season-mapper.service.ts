import {
  ActiveMarketingSeasonPayload,
  MarketingSeason,
  MarketingSeasonSummary,
} from '../../domain/entities';
import { PaginatedResult } from '../../domain/repositories';
import {
  ActiveMarketingSeasonDto,
  MarketingSeasonDto,
  MarketingSeasonListItemDto,
  MarketingSeasonsListResponseDto,
} from '../../public/marketing-seasons.types';

export class MarketingSeasonMapperService {
  toMarketingSeasonDto(season: MarketingSeason): MarketingSeasonDto {
    return {
      id: season.id,
      title: season.title,
      description: season.description,
      status: season.status as MarketingSeasonDto['status'],
      ownerUserId: season.ownerUserId,
      createdAt: season.createdAt.toISOString(),
      updatedAt: season.updatedAt.toISOString(),
    };
  }

  toMarketingSeasonListResponseDto(
    result: PaginatedResult<MarketingSeasonSummary>
  ): MarketingSeasonsListResponseDto {
    return {
      items: result.items.map(item => this.toMarketingSeasonListItemDto(item)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  toActiveMarketingSeasonDto(payload: ActiveMarketingSeasonPayload): ActiveMarketingSeasonDto {
    return {
      id: payload.id,
      title: payload.title,
      description: payload.description,
    };
  }

  private toMarketingSeasonListItemDto(item: MarketingSeasonSummary): MarketingSeasonListItemDto {
    return {
      id: item.id,
      title: item.title,
      status: item.status as MarketingSeasonListItemDto['status'],
      ownerUserId: item.ownerUserId,
      createdAt: item.createdAt.toISOString(),
    };
  }
}

