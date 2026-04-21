import { ResultDeduplicator, UrlNormalizer } from '../../domain/repositories';
import { RawSearchResult } from '../../domain/entities';

export class DefaultResultDeduplicator implements ResultDeduplicator {
  
  constructor(private readonly urlNormalizer: UrlNormalizer) {}

  /**
   * Removes duplicate results from the provided array.
   * Uniqueness is determined by a compound key of (platform + canonicalUrl).
   * The first occurrence is preserved.
   */
  public removeDuplicates(results: RawSearchResult[]): RawSearchResult[] {
    const seen = new Set<string>();
    const deduplicated: RawSearchResult[] = [];

    for (const result of results) {
      // Compute the canonical URL for comparison
      const canonicalUrl = this.urlNormalizer.normalize(result.url, result.platform);
      
      // Create a unique key per platform to avoid cross-platform clash
      const uniqueKey = `${result.platform}::${canonicalUrl}`;

      if (!seen.has(uniqueKey)) {
        seen.add(uniqueKey);
        deduplicated.push(result);
      }
    }

    return deduplicated;
  }
}
