import {
  FilterContext,
  RankingContext,
  ResultDeduplicator,
  ResultFilter,
  ResultRanker,
  SearchProvider,
  SearchProviderOptions,
  SearchQueryBuilder,
  UrlNormalizer
} from '../../domain/repositories';
import {
  CandidateResult,
  PlatformSearchResult,
  RawSearchResult,
  SearchRequest
} from '../../domain/entities';
import { ResultType, SearchPlatform } from '../../domain/enums';
import {
  CandidateBuckets,
  addBucketCandidatesToPool,
  buildBestCandidatesFromPools
} from '../../application/services/candidate-selection.service';
import { SearchStopPolicyService } from '../../application/services/search-stop-policy.service';

export class TiktokSearchService {
  constructor(
    private readonly queryBuilder: SearchQueryBuilder,
    private readonly searchProvider: SearchProvider,
    private readonly normalizer: UrlNormalizer,
    private readonly deduplicator: ResultDeduplicator,
    private readonly platformUrlFilter: ResultFilter,
    private readonly clientOnlyFilter: ResultFilter,
    private readonly relevanceFilter: ResultFilter,
    private readonly ranker: ResultRanker,
    private readonly stopPolicy: SearchStopPolicyService
  ) {}

  public async search(request: SearchRequest): Promise<PlatformSearchResult> {
    const queries = this.queryBuilder.buildQueries(request);
    const originalPhrase = queries[0]?.originalKeyword || request.keyword;
    const normalizedPhrase = queries[0]?.normalizedKeyword || request.keyword.trim().toLowerCase();
    const phraseTokens = Array.from(new Set(
      queries.reduce<string[]>((allTokens, query) => {
        if (query.keywordTokens && query.keywordTokens.length > 0) {
          allTokens.push(...query.keywordTokens);
        }

        return allTokens;
      }, [])
    ));
    const keywordVariants = Array.from(new Set([originalPhrase, normalizedPhrase, ...phraseTokens]));

    const filterContext: FilterContext = {
      originalPhrase,
      normalizedPhrase,
      phraseTokens,
      keywordVariants,
      city: request.saudiCity,
    };

    const rankingContext: RankingContext = {
      originalKeyword: originalPhrase,
      normalizedPhrase,
      phraseTokens,
      keywordVariants,
      saudiCity: request.saudiCity,
    };

    const strictPool = new Map<string, CandidateResult>();
    const relaxedPool = new Map<string, CandidateResult>();
    const fallbackPool = new Map<string, CandidateResult>();
    const providerWarnings: string[] = [];
    const resultsPerPage = 10;
    const maxPagesPerQuery = this.stopPolicy.getMaxPagesPerQuery(request.requestedResultsCount);
    const filterStopTarget = this.stopPolicy.getFilterStopTarget(request.requestedResultsCount);
    const getAcceptedPoolCount = () =>
      this.stopPolicy.getAcceptedCount(strictPool.size, relaxedPool.size, fallbackPool.size);
    let rawResultCount = 0;
    let acceptedDuringFiltering = 0;
    let queriedPageCount = 0;
    let sawAnyRawResults = false;
    let stoppedAtFilterThreshold = false;

    outer:
    for (const query of queries) {
      for (let page = 1; page <= maxPagesPerQuery; page++) {
        if (this.stopPolicy.shouldStopFiltering(getAcceptedPoolCount(), request.requestedResultsCount)) {
          stoppedAtFilterThreshold = true;
          break outer;
        }

        queriedPageCount += 1;
        let rawResults: RawSearchResult[];

        try {
          const options: SearchProviderOptions = {
            country: 'SA',
            page,
            offset: (page - 1) * resultsPerPage,
            resultsPerPage,
          };
          rawResults = await this.searchProvider.executeSearch(query, options);
        } catch (error: any) {
          providerWarnings.push(`Provider error on query [${query.finalQuery}] page ${page}: ${error.message}`);
          break;
        }

        if (!rawResults || rawResults.length === 0) {
          break;
        }

        sawAnyRawResults = true;
        rawResultCount += rawResults.length;
        const uniqueBatch = this.deduplicator.removeDuplicates(rawResults);
        const acceptedBatch = this.collectAcceptedCandidates(uniqueBatch, filterContext);

        acceptedDuringFiltering +=
          acceptedBatch.strictAccepted.length +
          acceptedBatch.relaxedAccepted.length +
          acceptedBatch.fallbackAccepted.length;

        addBucketCandidatesToPool({
          targetPool: strictPool,
          candidates: acceptedBatch.strictAccepted,
          ranker: this.ranker,
          rankingContext,
          removeFrom: [relaxedPool, fallbackPool],
        });
        addBucketCandidatesToPool({
          targetPool: relaxedPool,
          candidates: acceptedBatch.relaxedAccepted,
          ranker: this.ranker,
          rankingContext,
          blockIfExistsIn: [strictPool],
          removeFrom: [fallbackPool],
        });
        addBucketCandidatesToPool({
          targetPool: fallbackPool,
          candidates: acceptedBatch.fallbackAccepted,
          ranker: this.ranker,
          rankingContext,
          blockIfExistsIn: [strictPool, relaxedPool],
        });

        if (this.stopPolicy.shouldStopFiltering(getAcceptedPoolCount(), request.requestedResultsCount)) {
          stoppedAtFilterThreshold = true;
          break outer;
        }

        if (rawResults.length < resultsPerPage) {
          break;
        }
      }
    }

    const bestCandidates = buildBestCandidatesFromPools({
      requestedCount: request.requestedResultsCount,
      ranker: this.ranker,
      rankingContext,
      strictPool,
      relaxedPool,
      fallbackPool,
    });

    const warning = bestCandidates.length < request.requestedResultsCount
      ? this.buildWarning(
          providerWarnings,
          sawAnyRawResults,
          rawResultCount,
          acceptedDuringFiltering,
          bestCandidates.length,
          queriedPageCount,
          stoppedAtFilterThreshold,
          filterStopTarget
        )
      : undefined;

    return {
      platform: SearchPlatform.TIKTOK,
      requestedCount: request.requestedResultsCount,
      returnedCount: bestCandidates.length,
      warning,
      results: bestCandidates,
    };
  }

  private collectAcceptedCandidates(
    results: RawSearchResult[],
    filterContext: FilterContext
  ): CandidateBuckets {
    const strictAccepted: CandidateResult[] = [];
    const relaxedAccepted: CandidateResult[] = [];
    const fallbackAccepted: CandidateResult[] = [];

    for (const raw of results) {
      const candidate = this.extractLightweightCandidate(raw);
      if (!candidate) {
        continue;
      }

      const normalizedRaw = this.toRawSearchResult(candidate);

      if (!this.platformUrlFilter.isCandidateValid(normalizedRaw, filterContext).isValid) {
        continue;
      }

      const clientValid = this.clientOnlyFilter.isCandidateValid(normalizedRaw, filterContext).isValid;
      const relevanceValid = this.relevanceFilter.isCandidateValid(normalizedRaw, filterContext).isValid;

      if (clientValid && relevanceValid) {
        strictAccepted.push(candidate);
      } else if (clientValid || relevanceValid) {
        relaxedAccepted.push(candidate);
      } else {
        fallbackAccepted.push(candidate);
      }
    }

    return {
      strictAccepted,
      relaxedAccepted,
      fallbackAccepted,
    };
  }

  private extractLightweightCandidate(raw: RawSearchResult): CandidateResult | null {
    const canonicalUrl = this.normalizer.normalize(raw.url, SearchPlatform.TIKTOK);
    if (!canonicalUrl) {
      return null;
    }

    const titleLower = raw.title.toLowerCase();
    const snippetLower = raw.snippet.toLowerCase();
    const combinedLower = `${titleLower} ${snippetLower}`;
    const resultType = this.matchesAny(combinedLower, [
      'official',
      'business',
      'company',
      'agency',
      'store',
      'clinic',
      'restaurant',
      'shop',
      'brand',
    ])
      ? ResultType.BUSINESS_PROFILE
      : ResultType.PROFESSIONAL_PROFILE;

    const extractedLocation = this.extractLocation(`${raw.title} ${raw.snippet}`);
    const extractedName = this.extractName(raw.title);

    return {
      platform: SearchPlatform.TIKTOK,
      canonicalUrl,
      title: raw.title,
      snippet: raw.snippet,
      extractedNameOrLabel: extractedName,
      extractedLocation,
      resultType,
      score: 0,
      sourceQuery: raw.sourceQuery,
    };
  }

  private toRawSearchResult(candidate: CandidateResult): RawSearchResult {
    return {
      platform: candidate.platform,
      title: candidate.title,
      snippet: candidate.snippet,
      url: candidate.canonicalUrl,
      sourceQuery: candidate.sourceQuery,
    };
  }

  private extractName(title: string): string {
    const cleanedTitle = title
      .replace(/\s*[|:-]\s*tiktok$/i, '')
      .replace(/\(@[^)]+\)/g, '')
      .replace(/\s*[^a-z0-9]+\s*tiktok$/i, '')
      .trim();

    return cleanedTitle || title.trim();
  }

  private extractLocation(text: string): string {
    const normalizedText = text.toLowerCase();
    const cityPatterns = ['riyadh', 'jeddah', 'dammam', 'khobar', 'makkah', 'madinah', 'saudi arabia', 'ksa'];

    for (const cityPattern of cityPatterns) {
      if (normalizedText.includes(cityPattern)) {
        return cityPattern === 'saudi arabia' || cityPattern === 'ksa'
          ? 'Saudi Arabia'
          : `${cityPattern.charAt(0).toUpperCase()}${cityPattern.slice(1)}, Saudi Arabia`;
      }
    }

    return '';
  }

  private matchesAny(value: string, patterns: string[]): boolean {
    return patterns.some(pattern => value.includes(pattern));
  }

  private buildWarning(
    providerWarnings: string[],
    sawAnyRawResults: boolean,
    rawResultCount: number,
    acceptedDuringFiltering: number,
    finalCount: number,
    queriedPageCount: number,
    stoppedAtFilterThreshold: boolean,
    filterStopTarget: number
  ): string {
    if (!sawAnyRawResults) {
      return providerWarnings[0] || 'Exhausted all TikTok query/page combinations before collecting candidates.';
    }

    if (stoppedAtFilterThreshold) {
      return `Stopped TikTok filtering after reaching the shared acceptance threshold of ${filterStopTarget} results.`;
    }

    if (acceptedDuringFiltering === 0) {
      return `Fetched ${rawResultCount} raw TikTok SERP results across ${queriedPageCount} pages, but none passed the platform, client-only, and relevance filters.`;
    }

    if (providerWarnings.length > 0) {
      return `Returned ${finalCount} TikTok results after scanning ${queriedPageCount} pages, but some query/page requests failed during collection.`;
    }

    return `Fetched ${rawResultCount} raw TikTok SERP results, accepted ${acceptedDuringFiltering} after filtering, and returned ${finalCount} best results.`;
  }
}
