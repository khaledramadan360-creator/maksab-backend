import { SearchPlatform, SupportedSaudiCity, RequestedResultsCount, ResultType } from './enums';

export interface SearchRequest {
  keyword: string;
  country: string;
  saudiCity: SupportedSaudiCity;
  platforms: SearchPlatform[];
  requestedResultsCount: RequestedResultsCount;
  language?: string;
  actorUserId?: string;
  actorUserRole?: string;
}

export interface SearchQueryVariant {
  platform: SearchPlatform;
  originalKeyword: string;
  variantKeyword: string;
  normalizedKeyword?: string;
  keywordTokens?: string[];
  patternType?: string;
  includeCity?: boolean;
  includeCountry?: boolean;
  saudiCity: SupportedSaudiCity;
  finalQuery: string;
  language: string;
}

export interface RawSearchResult {
  platform: SearchPlatform;
  title: string;
  snippet: string;
  url: string;
  sourceQuery: string;
}

export interface RawDatasetRecord {
  platform: SearchPlatform;
  sourceDataset: string;
  sourceKeyword: string;
  page: number;
  payload: Record<string, any>;
}

export interface NormalizedDatasetRecord {
  platform: SearchPlatform;
  canonicalUrl: string;
  nameOrLabel: string;
  titleOrHeadline: string;
  location: string;
  snippet: string;
  resultType: ResultType;
  sourceDataset: string;
  sourceKeyword: string;
}

export interface DatasetBatchResult {
  platform: SearchPlatform;
  sourceDataset: string;
  page: number;
  nextPage?: number;
  nextCursor?: string;
  exhausted: boolean;
  records: RawDatasetRecord[];
}

export interface CandidateResult {
  platform: SearchPlatform;
  canonicalUrl: string;
  title: string;
  snippet: string;
  extractedNameOrLabel: string;
  extractedLocation: string;
  resultType: ResultType;
  score: number;
  sourceQuery: string;
}

export interface UnlockedPageResult {
  url: string;
  finalUrl: string;
  statusCode: number;
  contentType: string;
  title: string;
  body: string;
  bodyText: string;
}

export interface PlatformSearchResult {
  platform: SearchPlatform;
  requestedCount: RequestedResultsCount;
  returnedCount: number;
  warning?: string;
  results: CandidateResult[];
}

export interface LeadSearchOutput {
  keyword: string;
  country: string;
  saudiCity: SupportedSaudiCity;
  platforms: SearchPlatform[];
  requestedResultsCount: RequestedResultsCount;
  platformResults: Record<string, PlatformSearchResult>;
}
