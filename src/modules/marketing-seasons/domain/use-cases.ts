import {
  ActivateMarketingSeasonInput,
  ActiveMarketingSeasonPayload,
  MarketingSeason,
  MarketingSeasonSummary,
} from './entities';
import {
  MarketingSeasonsListFilters,
  PaginatedResult,
  PaginationParams,
} from './repositories';

export interface MarketingSeasonsActorContext {
  actorUserId: string;
  actorUserRole: string;
}

export interface CreateMarketingSeasonInput
  extends MarketingSeasonsActorContext {
  title: string;
  description?: string | null;
}

export interface UpdateMarketingSeasonInput
  extends MarketingSeasonsActorContext {
  seasonId: string;
  title?: string;
  description?: string | null;
}

export interface DeleteMarketingSeasonInput
  extends MarketingSeasonsActorContext {
  seasonId: string;
}

export interface ListMarketingSeasonsInput
  extends MarketingSeasonsActorContext {
  filters: MarketingSeasonsListFilters;
  pagination: PaginationParams;
}

export interface GetMarketingSeasonByIdInput
  extends MarketingSeasonsActorContext {
  seasonId: string;
}

export interface ActivateMarketingSeasonCommand
  extends ActivateMarketingSeasonInput {
  actorUserRole: string;
}

export interface IMarketingSeasonsUseCases {
  createMarketingSeason(input: CreateMarketingSeasonInput): Promise<MarketingSeason>;
  updateMarketingSeason(input: UpdateMarketingSeasonInput): Promise<MarketingSeason>;
  deleteMarketingSeason(input: DeleteMarketingSeasonInput): Promise<void>;
  listMarketingSeasons(
    input: ListMarketingSeasonsInput
  ): Promise<PaginatedResult<MarketingSeasonSummary>>;
  getMarketingSeasonById(input: GetMarketingSeasonByIdInput): Promise<MarketingSeason | null>;
  activateMarketingSeason(input: ActivateMarketingSeasonCommand): Promise<MarketingSeason>;
  getActiveMarketingSeason(): Promise<ActiveMarketingSeasonPayload | null>;
}
