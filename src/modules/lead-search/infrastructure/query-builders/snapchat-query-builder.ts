import { SearchQueryBuilder } from '../../domain/repositories';
import { SearchRequest, SearchQueryVariant } from '../../domain/entities';
import { SearchPlatform, SupportedSaudiCity } from '../../domain/enums';
import { QueryPatternBuilderService } from '../../application/services/query-pattern-builder.service';

export class SnapchatQueryBuilder implements SearchQueryBuilder {
  constructor(private readonly patternBuilder: QueryPatternBuilderService) {}

  public buildQueries(request: SearchRequest): SearchQueryVariant[] {
    const prepared = this.patternBuilder.prepare(request.keyword, request.language);
    const queries: SearchQueryVariant[] = [];
    const seenQueries = new Set<string>();
    const maxQueries = 6;

    for (const pattern of prepared.patterns) {
      if (queries.length >= maxQueries) {
        break;
      }

      const locationParts: string[] = [];

      if (pattern.includeCity && request.saudiCity !== SupportedSaudiCity.ALL) {
        locationParts.push(`"${request.saudiCity}"`);
      } else if (pattern.includeCity && request.saudiCity === SupportedSaudiCity.ALL && !pattern.includeCountry) {
        locationParts.push('"Saudi Arabia"');
      }

      if (pattern.includeCountry) {
        locationParts.push('"Saudi Arabia"');
      }

      const finalQuery = ['site:snapchat.com', pattern.queryText, ...locationParts].filter(Boolean).join(' ').trim();
      const normalizedQuery = finalQuery.toLowerCase();

      if (!seenQueries.has(normalizedQuery)) {
        seenQueries.add(normalizedQuery);

        queries.push({
          platform: SearchPlatform.SNAPCHAT,
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
