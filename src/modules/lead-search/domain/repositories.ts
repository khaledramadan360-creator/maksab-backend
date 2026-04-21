import {
  CandidateResult,
  DatasetBatchResult,
  NormalizedDatasetRecord,
  RawDatasetRecord,
  RawSearchResult,
  SearchQueryVariant,
  PlatformSearchResult,
  SearchRequest,
  UnlockedPageResult
} from './entities';
import { RejectedResultReason, SearchPlatform } from './enums';

export interface SearchQueryBuilder {
  buildQueries(request: SearchRequest): SearchQueryVariant[];
}

export interface SearchProviderOptions {
  page?: number;
  offset?: number;
  country?: string;
  resultsPerPage?: number;
}

export interface SearchProvider {
  executeSearch(query: SearchQueryVariant, options?: SearchProviderOptions): Promise<RawSearchResult[]>;
}

export interface DatasetProviderOptions {
  page?: number;
  cursor?: string;
  batchSize?: number;
}

export interface DatasetProvider {
  fetchBatch(
    platform: SearchPlatform,
    request: SearchRequest,
    options?: DatasetProviderOptions
  ): Promise<DatasetBatchResult>;
}

export interface UrlNormalizer {
  normalize(url: string, platform: SearchPlatform): string;
}

export interface ResultDeduplicator {
  removeDuplicates(results: RawSearchResult[]): RawSearchResult[];
}

export interface FilterContext {
  originalPhrase?: string;
  normalizedPhrase?: string;
  phraseTokens?: string[];
  keywordVariants?: string[];
  city?: string;
}

export interface ResultFilter {
  isCandidateValid(result: RawSearchResult, context?: FilterContext): {
    isValid: boolean;
    reason?: RejectedResultReason;
  };
}

export interface DatasetRecordNormalizerPort {
  normalize(record: RawDatasetRecord): NormalizedDatasetRecord | null;
}

export interface DatasetRecordTypeValidatorPort {
  validate(record: RawDatasetRecord, normalized?: NormalizedDatasetRecord | null): {
    isValid: boolean;
    reason?: RejectedResultReason;
  };
}

export interface RankingContext {
  originalKeyword: string;
  normalizedPhrase?: string;
  phraseTokens?: string[];
  keywordVariants?: string[];
  saudiCity?: string;
}

export interface ResultRanker {
  score(result: CandidateResult, context: RankingContext): number;
  rank(results: CandidateResult[], context: RankingContext): CandidateResult[];
}

export interface VerificationContext {
  platform: SearchPlatform;
  originalPhrase?: string;
  normalizedPhrase?: string;
  phraseTokens?: string[];
  city?: string;
  country?: string;
}

export interface CandidateVerificationService {
  verifyCandidates(candidates: CandidateResult[], context: VerificationContext): Promise<CandidateResult[]>;
}

export interface UnlockerProviderOptions {
  country?: string;
  method?: string;
}

export interface UnlockerProvider {
  unlock(url: string, options?: UnlockerProviderOptions): Promise<UnlockedPageResult | null>;
}

export interface PlatformSearchService {
  search(request: SearchRequest): Promise<PlatformSearchResult>;
}

export interface SearchOrchestrator {
  execute(request: SearchRequest): Promise<PlatformSearchResult[]>;
}
