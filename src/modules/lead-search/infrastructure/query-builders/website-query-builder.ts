import { SearchQueryBuilder } from '../../domain/repositories';
import { SearchRequest, SearchQueryVariant } from '../../domain/entities';
import { SearchPlatform } from '../../domain/enums';
import { QueryPatternBuilderService } from '../../application/services/query-pattern-builder.service';

export class WebsiteQueryBuilder implements SearchQueryBuilder {
  constructor(private readonly patternBuilder: QueryPatternBuilderService) {}

  public buildQueries(request: SearchRequest): SearchQueryVariant[] {
    const prepared = this.patternBuilder.prepare(request.keyword, request.language);
    const queries: SearchQueryVariant[] = [];
    const seenQueries = new Set<string>();

    for (const pattern of prepared.patterns) {
      const locationParts: string[] = [];

      if (pattern.includeCity) {
        locationParts.push(`"${request.saudiCity}"`);
      }

      if (pattern.includeCountry) {
        locationParts.push('"Saudi Arabia"');
      }

      const finalQuery = [pattern.queryText, ...locationParts].filter(Boolean).join(' ').trim();

      if (!seenQueries.has(finalQuery.toLowerCase())) {
        seenQueries.add(finalQuery.toLowerCase());

        queries.push({
          platform: SearchPlatform.WEBSITE,
          originalKeyword: prepared.originalPhrase,
          variantKeyword: pattern.queryText,
          normalizedKeyword: prepared.normalizedPhrase,
          keywordTokens: prepared.tokens,
          patternType: pattern.type,
          includeCity: pattern.includeCity,
          includeCountry: pattern.includeCountry,
          saudiCity: request.saudiCity,
          finalQuery,
          language: prepared.language === 'ar' ? 'ar' : 'en',
        });
      }
    }

    return queries;
  }
}
