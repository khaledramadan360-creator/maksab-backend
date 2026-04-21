import { SearchRequest, LeadSearchOutput, PlatformSearchResult } from '../../domain/entities';
import { SearchPlatform, SupportedSaudiCity } from '../../domain/enums';

export class SearchOutputMapper {
  /**
   * Maps the aggregated PlatformSearchResult[] from the orchestrator
   * into the final, clean, save-ready LeadSearchOutput.
   */
  public map(request: SearchRequest, platformResults: PlatformSearchResult[]): LeadSearchOutput {
    const platformRecord: Record<string, PlatformSearchResult> = {};

    for (const result of platformResults) {
      platformRecord[result.platform] = {
        platform: result.platform,
        requestedCount: result.requestedCount,
        returnedCount: result.returnedCount,
        warning: result.warning,
        results: result.results.map(candidate => ({
          ...candidate,
          // Ensure save-ready fields are present and non-null
          canonicalUrl: candidate.canonicalUrl || '',
          extractedNameOrLabel: candidate.extractedNameOrLabel || candidate.title || '',
          extractedLocation: candidate.extractedLocation || '',
          resultType: candidate.resultType,
          platform: result.platform,
          sourceQuery: candidate.sourceQuery || '',
          title: candidate.title || '',
          snippet: candidate.snippet || '',
          score: candidate.score ?? 0
        }))
      };
    }

    return {
      keyword: request.keyword,
      country: request.country,
      saudiCity: request.saudiCity,
      platforms: request.platforms,
      requestedResultsCount: request.requestedResultsCount,
      platformResults: platformRecord
    };
  }
}
