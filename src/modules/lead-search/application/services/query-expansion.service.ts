import { BASE_QUERY_DICTIONARY, QueryDictionaryEntry } from '../../infrastructure/query-builders/base-query-expansion.dictionary';

export interface QueryExpansionResult {
  original: string;
  normalized: string;
  arabicVariants: string[];
  englishVariants: string[];
  allVariants: string[];
}

export class QueryExpansionService {
  private dictionary = BASE_QUERY_DICTIONARY;

  /**
   * Expands a keyword into its normalized variants and limited synonyms
   * based on the static rule-based dictionary.
   */
  public expand(keyword: string, language?: string): QueryExpansionResult {
    const original = keyword;
    const normalized = this.normalizeKeyword(keyword);

    // Look for a matching entry
    const matchedEntry = this.findMatchInDictionary(normalized);

    let arabicVariants: string[] = [];
    let englishVariants: string[] = [];
    let allVariants: string[] = [];

    if (matchedEntry) {
      // Entry found: populate variants
      arabicVariants = [...matchedEntry.arabicVariants];
      englishVariants = [...matchedEntry.englishVariants];
      
      // Merge all variants uniquely (in case of overlaps or duplicate forms)
      // Including original keyword and the natural dictionary variants.
      // We exclude 'normalized' here because aggressive Arabic normalization (ة -> ه)
      // is great for matching but might decrease search quality if sent to the search engine.
      const merged = new Set([
         original, 
         ...arabicVariants, 
         ...englishVariants
      ]);
      allVariants = Array.from(merged);
    } else {
      // Entry not found: return the original as the only search variant
      const merged = new Set([original]);
      allVariants = Array.from(merged);
    }

    return {
      original,
      normalized,
      arabicVariants,
      englishVariants,
      allVariants
    };
  }

  /**
   * Apply thorough string normalization for robust matching, removing tatweel, normalizing alef/taa.
   */
  private normalizeKeyword(keyword: string): string {
    let text = keyword.trim().toLowerCase();
    
    // Collapse multiple spaces into one
    text = text.replace(/\s+/g, ' ');

    // Basic Arabic normalization: removing accents "Tashkeel" and tatweel
    text = text.replace(/[\u064B-\u065F\u0640]/g, ''); 

    // Normalize commonly mixed Arabic characters
    text = text.replace(/[أإآ]/g, 'ا');
    text = text.replace(/ة/g, 'ه');
    text = text.replace(/ى/g, 'ي');

    return text;
  }

  /**
   * Search through the dictionary to find if the normalized keyword
   * matches any variant (Arabic or English), normalizing the dictionary entries as well for comparison.
   */
  private findMatchInDictionary(normalizedKeyword: string): QueryDictionaryEntry | null {
    for (const entry of this.dictionary) {
      // Check Arabic variants
      const arabicMatch = entry.arabicVariants.some(v => this.normalizeKeyword(v) === normalizedKeyword);
      if (arabicMatch) return entry;

      // Check English variants
      const englishMatch = entry.englishVariants.some(v => this.normalizeKeyword(v) === normalizedKeyword);
      if (englishMatch) return entry;
    }

    const keywordTokens = this.extractComparableTokens(normalizedKeyword);
    if (keywordTokens.length < 2) {
      return null;
    }

    for (const entry of this.dictionary) {
      const allVariants = [...entry.arabicVariants, ...entry.englishVariants];

      for (const variant of allVariants) {
        const variantTokens = this.extractComparableTokens(this.normalizeKeyword(variant));
        if (variantTokens.length === 0) continue;

        const overlapCount = keywordTokens.filter(token => variantTokens.includes(token)).length;
        if (overlapCount >= Math.min(2, keywordTokens.length)) {
          return entry;
        }
      }
    }

    return null;
  }

  private extractComparableTokens(text: string): string[] {
    return Array.from(new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF\s]/gi, ' ')
        .split(/\s+/)
        .map(token => this.normalizeComparableToken(token))
        .filter(token => token.length >= 2)
    ));
  }

  private normalizeComparableToken(token: string): string {
    if (/^[a-z]+$/i.test(token)) {
      if (token.endsWith('ies') && token.length > 4) {
        return `${token.slice(0, -3)}y`;
      }

      if (token.endsWith('es') && token.length > 4) {
        return token.slice(0, -2);
      }

      if (token.endsWith('s') && token.length > 3) {
        return token.slice(0, -1);
      }
    }

    return token;
  }
}
