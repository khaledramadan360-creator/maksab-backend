import { MarketingSeasonStatus } from './enums';

export interface MarketingSeason {
  id: string;
  title: string;
  description: string | null;
  status: MarketingSeasonStatus;
  ownerUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketingSeasonSummary {
  id: string;
  title: string;
  status: MarketingSeasonStatus;
  ownerUserId: string;
  createdAt: Date;
}

export interface ActivateMarketingSeasonInput {
  seasonId: string;
  actorUserId: string;
}

export interface ActiveMarketingSeasonPayload {
  id: string;
  title: string;
  description: string | null;
}
