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

/**
 * Public gateway for the marketing-seasons module.
 * External consumers must depend on this facade only.
 */
export interface MarketingSeasonsFacade {
  createMarketingSeason(input: CreateMarketingSeasonRequestDto): Promise<MarketingSeasonDto>;
  updateMarketingSeason(input: UpdateMarketingSeasonRequestDto): Promise<MarketingSeasonDto>;
  deleteMarketingSeason(input: DeleteMarketingSeasonRequestDto): Promise<void>;
  listMarketingSeasons(input: ListMarketingSeasonsQueryDto): Promise<MarketingSeasonsListResponseDto>;
  getMarketingSeasonById(input: GetMarketingSeasonByIdRequestDto): Promise<MarketingSeasonDto | null>;
  activateMarketingSeason(input: ActivateMarketingSeasonRequestDto): Promise<MarketingSeasonDto>;
  getActiveMarketingSeason(
    input: GetActiveMarketingSeasonRequestDto
  ): Promise<ActiveMarketingSeasonDto | null>;
}

