export type QueryPatternType =
  | 'original_city_country'
  | 'normalized_city_country'
  | 'token_city_country'
  | 'original_country_only'
  | 'normalized_country_only'
  | 'token_country_only'
  | 'original_city_only'
  | 'token_city_only'
  | 'original_global'
  | 'token_global';

export interface QueryPattern {
  type: QueryPatternType;
  queryText: string;
  includeCity: boolean;
  includeCountry: boolean;
}

export interface PreparedSearchPhrase {
  originalPhrase: string;
  normalizedPhrase: string;
  querySafePhrase: string;
  tokens: string[];
  language: 'ar' | 'en' | 'mixed';
  patterns: QueryPattern[];
}

export class QueryPatternBuilderService {
  public prepare(keyword: string, language?: string): PreparedSearchPhrase {
    const originalPhrase = this.sanitizePhrase(keyword);
    const querySafePhrase = this.buildQuerySafePhrase(originalPhrase);
    const normalizedPhrase = this.normalizeForMatching(originalPhrase);
    const tokens = this.extractTokens(querySafePhrase);

    return {
      originalPhrase,
      normalizedPhrase,
      querySafePhrase,
      tokens,
      language: this.resolveLanguage(originalPhrase, language),
      patterns: this.buildPatterns(originalPhrase, querySafePhrase, tokens),
    };
  }

  private buildPatterns(
    originalPhrase: string,
    querySafePhrase: string,
    tokens: string[]
  ): QueryPattern[] {
    const patterns: QueryPattern[] = [];
    const originalPattern = this.quoteAsPhrase(originalPhrase);
    const shouldIncludeNormalizedPattern = Boolean(querySafePhrase && querySafePhrase !== originalPhrase);
    const normalizedPattern = shouldIncludeNormalizedPattern ? this.quoteAsPhrase(querySafePhrase) : '';
    const tokenPattern = this.buildTokenPattern(tokens);

    this.pushPattern(patterns, {
      type: 'original_city_country',
      queryText: originalPattern,
      includeCity: true,
      includeCountry: true,
    });

    if (normalizedPattern && shouldIncludeNormalizedPattern) {
      this.pushPattern(patterns, {
        type: 'normalized_city_country',
        queryText: normalizedPattern,
        includeCity: true,
        includeCountry: true,
      });
    }

    if (tokenPattern) {
      this.pushPattern(patterns, {
        type: 'token_city_country',
        queryText: tokenPattern,
        includeCity: true,
        includeCountry: true,
      });
    }

    this.pushPattern(patterns, {
      type: 'original_country_only',
      queryText: originalPattern,
      includeCity: false,
      includeCountry: true,
    });

    if (normalizedPattern && shouldIncludeNormalizedPattern) {
      this.pushPattern(patterns, {
        type: 'normalized_country_only',
        queryText: normalizedPattern,
        includeCity: false,
        includeCountry: true,
      });
    }

    if (tokenPattern) {
      this.pushPattern(patterns, {
        type: 'token_country_only',
        queryText: tokenPattern,
        includeCity: false,
        includeCountry: true,
      });
    }

    this.pushPattern(patterns, {
      type: 'original_city_only',
      queryText: originalPattern,
      includeCity: true,
      includeCountry: false,
    });

    if (tokenPattern) {
      this.pushPattern(patterns, {
        type: 'token_city_only',
        queryText: tokenPattern,
        includeCity: true,
        includeCountry: false,
      });
    }

    this.pushPattern(patterns, {
      type: 'original_global',
      queryText: originalPattern,
      includeCity: false,
      includeCountry: false,
    });

    if (tokenPattern) {
      this.pushPattern(patterns, {
        type: 'token_global',
        queryText: tokenPattern,
        includeCity: false,
        includeCountry: false,
      });
    }

    return patterns.slice(0, 8);
  }

  private pushPattern(patterns: QueryPattern[], nextPattern: QueryPattern): void {
    if (!nextPattern.queryText) {
      return;
    }

    const key = [
      nextPattern.includeCity ? '1' : '0',
      nextPattern.includeCountry ? '1' : '0',
      nextPattern.queryText.toLowerCase()
    ].join(':');

    const alreadyExists = patterns.some(pattern => {
      const patternKey = [
        pattern.includeCity ? '1' : '0',
        pattern.includeCountry ? '1' : '0',
        pattern.queryText.toLowerCase()
      ].join(':');

      return patternKey === key;
    });

    if (!alreadyExists) {
      patterns.push(nextPattern);
    }
  }

  private sanitizePhrase(keyword: string): string {
    return keyword
      .replace(/["'`\u2018\u2019\u201C\u201D]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private buildQuerySafePhrase(phrase: string): string {
    return phrase
      .replace(/[\u060C,;:|/\\]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeForMatching(phrase: string): string {
    return phrase
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[\u064B-\u065F\u0640]/g, '')
      .replace(/[\u0623\u0625\u0622]/g, '\u0627')
      .replace(/\u0629/g, '\u0647')
      .replace(/\u0649/g, '\u064A');
  }

  private extractTokens(phrase: string): string[] {
    const rawTokens = phrase
      .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, ' ')
      .split(/\s+/)
      .map(token => token.trim())
      .filter(token => token.length >= 2);

    return Array.from(new Set(rawTokens));
  }

  private buildTokenPattern(tokens: string[]): string {
    if (tokens.length < 2) {
      return '';
    }

    return tokens.map(token => this.quoteAsPhrase(token)).join(' ');
  }

  private quoteAsPhrase(value: string): string {
    const cleanValue = value.trim();
    return cleanValue ? `"${cleanValue}"` : '';
  }

  private resolveLanguage(phrase: string, language?: string): 'ar' | 'en' | 'mixed' {
    if (language === 'ar' || language === 'en') {
      return language;
    }

    const hasArabic = /[\u0600-\u06FF]/.test(phrase);
    const hasLatin = /[a-zA-Z]/.test(phrase);

    if (hasArabic && hasLatin) return 'mixed';
    if (hasLatin) return 'en';
    return 'ar';
  }
}
