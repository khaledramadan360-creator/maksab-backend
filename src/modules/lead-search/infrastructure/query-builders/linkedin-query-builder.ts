import { SearchQueryBuilder } from '../../domain/repositories';
import { SearchRequest, SearchQueryVariant } from '../../domain/entities';
import { SearchPlatform } from '../../domain/enums';
import { QueryPatternBuilderService } from '../../application/services/query-pattern-builder.service';

export class LinkedinQueryBuilder implements SearchQueryBuilder {
  constructor(private readonly patternBuilder: QueryPatternBuilderService) {}

  public buildQueries(request: SearchRequest): SearchQueryVariant[] {
    const prepared = this.patternBuilder.prepare(request.keyword, request.language);
    const siteRestrictions = this.getSiteRestrictions(prepared.originalPhrase, prepared.tokens);
    const queries: SearchQueryVariant[] = [];
    const seenQueries = new Set<string>();
    const maxQueries = 8;

    for (const pattern of prepared.patterns) {
      if (queries.length >= maxQueries) {
        break;
      }

      const locationParts: string[] = [];

      if (pattern.includeCity) {
        locationParts.push(`"${request.saudiCity}"`);
      }

      if (pattern.includeCountry) {
        locationParts.push('"Saudi Arabia"');
      }

      for (const siteRestriction of siteRestrictions) {
        if (queries.length >= maxQueries) {
          break;
        }

        const finalQuery = [siteRestriction, pattern.queryText, ...locationParts].filter(Boolean).join(' ').trim();

        if (!seenQueries.has(finalQuery.toLowerCase())) {
          seenQueries.add(finalQuery.toLowerCase());

          queries.push({
            platform: SearchPlatform.LINKEDIN,
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
    }

    return queries;
  }

  private getSiteRestrictions(originalPhrase: string, tokens: string[]): string[] {
    if (this.isCompanyIntent(originalPhrase, tokens)) {
      return ['site:linkedin.com/company/', 'site:linkedin.com/in/'];
    }

    return ['site:linkedin.com/in/', 'site:linkedin.com/company/'];
  }

  private isCompanyIntent(originalPhrase: string, tokens: string[]): boolean {
    const joinedText = `${originalPhrase} ${tokens.join(' ')}`.toLowerCase();
    const companySignals = [
      'company',
      'companies',
      'firm',
      'agency',
      'studio',
      'startup',
      'house',
      'office',
      'شركة',
      'شركات',
      'مؤسسة',
      'وكالة',
      'مكتب',
    ];

    return companySignals.some(signal => joinedText.includes(signal));
  }
}
