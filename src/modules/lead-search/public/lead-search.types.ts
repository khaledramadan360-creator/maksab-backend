// Public types exported for consumers of this module.
// DO NOT export internals like RawSearchResult, SearchQueryVariant, or anything provider-level.

export type { SearchRequest, LeadSearchOutput, PlatformSearchResult, CandidateResult } from '../domain/entities';
export { SearchPlatform, SupportedSaudiCity, RequestedResultsCount, ResultType } from '../domain/enums';
