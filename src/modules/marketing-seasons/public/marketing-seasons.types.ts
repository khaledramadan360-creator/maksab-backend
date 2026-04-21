export type MarketingSeasonStatusDto = 'active' | 'inactive';

export interface RequestActorContext {
  actorUserId: string;
  actorUserRole: string;
}

export interface MarketingSeasonDto {
  id: string;
  title: string;
  description: string | null;
  status: MarketingSeasonStatusDto;
  ownerUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingSeasonListItemDto {
  id: string;
  title: string;
  status: MarketingSeasonStatusDto;
  ownerUserId: string;
  createdAt: string;
}

export interface ActiveMarketingSeasonDto {
  id: string;
  title: string;
  description: string | null;
}

export interface MarketingSeasonsListRequestDto {
  keyword?: string;
  status?: MarketingSeasonStatusDto;
  ownerUserId?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  page: number;
  pageSize: number;
}

export interface MarketingSeasonsListResponseDto {
  items: MarketingSeasonListItemDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateMarketingSeasonRequestDto
  extends RequestActorContext {
  title: string;
  description?: string | null;
}

export interface UpdateMarketingSeasonRequestDto
  extends RequestActorContext {
  seasonId: string;
  title?: string;
  description?: string | null;
}

export interface DeleteMarketingSeasonRequestDto
  extends RequestActorContext {
  seasonId: string;
}

export interface GetMarketingSeasonByIdRequestDto
  extends RequestActorContext {
  seasonId: string;
}

export interface ActivateMarketingSeasonRequestDto
  extends RequestActorContext {
  seasonId: string;
}

export interface GetActiveMarketingSeasonRequestDto
  extends RequestActorContext {}

export interface ListMarketingSeasonsQueryDto
  extends RequestActorContext,
    MarketingSeasonsListRequestDto {}

