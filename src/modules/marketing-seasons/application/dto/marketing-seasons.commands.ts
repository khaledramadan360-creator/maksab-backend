import {
  ActiveMarketingSeasonPayload,
  MarketingSeason,
  MarketingSeasonSummary,
} from '../../domain/entities';
import {
  MarketingSeasonsListFilters,
  PaginatedResult,
} from '../../domain/repositories';

export interface ActorContext {
  actorUserId: string;
  actorUserRole: string;
}

export interface CreateMarketingSeasonCommand
  extends ActorContext {
  title: string;
  description?: string | null;
}

export interface UpdateMarketingSeasonCommand
  extends ActorContext {
  seasonId: string;
  title?: string;
  description?: string | null;
}

export interface DeleteMarketingSeasonCommand
  extends ActorContext {
  seasonId: string;
}

export interface ListMarketingSeasonsQuery
  extends ActorContext {
  filters: MarketingSeasonsListFilters;
  page?: number;
  pageSize?: number;
}

export interface GetMarketingSeasonByIdQuery
  extends ActorContext {
  seasonId: string;
}

export interface ActivateMarketingSeasonCommand
  extends ActorContext {
  seasonId: string;
}

export interface GetActiveMarketingSeasonQuery
  extends ActorContext {}

export interface ActivateMarketingSeasonResult {
  activatedSeason: MarketingSeason;
  deactivatedSeason: MarketingSeason | null;
}

export interface ListMarketingSeasonsResult
  extends PaginatedResult<MarketingSeasonSummary> {}

export interface GetActiveMarketingSeasonResult
  extends ActiveMarketingSeasonPayload {}

