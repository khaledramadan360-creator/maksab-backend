import { ResultFilter, FilterContext } from '../../domain/repositories';
import { RawSearchResult } from '../../domain/entities';
import { RejectedResultReason } from '../../domain/enums';

export class RelevanceResultFilter implements ResultFilter {
  isCandidateValid(result: RawSearchResult, context?: FilterContext): { isValid: boolean; reason?: RejectedResultReason; } {
    if (!context) {
      return { isValid: true };
    }

    const rawText = `${result.title} ${result.snippet} ${result.url}`;
    const normalizedText = this.normalizeText(rawText);

    const originalPhrase = (context.originalPhrase || '').trim();
    const normalizedPhrase = (context.normalizedPhrase || this.normalizeText(originalPhrase)).trim();

    if (originalPhrase && rawText.toLowerCase().includes(originalPhrase.toLowerCase())) {
      return { isValid: true };
    }

    if (normalizedPhrase && normalizedText.includes(normalizedPhrase)) {
      return { isValid: true };
    }

    const phraseTokens = this.resolvePhraseTokens(context, originalPhrase, normalizedPhrase);
    if (phraseTokens.length === 0) {
      return { isValid: true };
    }

    const candidateTokens = this.extractComparableTokens(rawText);
    const overlapCount = phraseTokens.filter(token => candidateTokens.includes(token)).length;
    const requiredOverlap = phraseTokens.length === 1 ? 1 : 2;

    if (overlapCount >= requiredOverlap) {
      return { isValid: true };
    }

    return { isValid: false, reason: RejectedResultReason.LOW_RELEVANCE };
  }

  private resolvePhraseTokens(context: FilterContext, originalPhrase: string, normalizedPhrase: string): string[] {
    if (context.phraseTokens && context.phraseTokens.length > 0) {
      return Array.from(new Set(context.phraseTokens.map(token => this.normalizeComparableToken(token))));
    }

    const fallbackText = originalPhrase || normalizedPhrase || (context.keywordVariants || []).join(' ');
    return this.extractComparableTokens(fallbackText);
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0640]/g, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractComparableTokens(text: string): string[] {
    return Array.from(new Set(
      this.normalizeText(text)
        .replace(/[^a-z0-9\u0600-\u06FF\s]/gi, ' ')
        .split(/\s+/)
        .map(token => this.normalizeComparableToken(token))
        .filter(token => token.length >= 2)
    ));
  }

  private normalizeComparableToken(token: string): string {
    const normalizedToken = token.toLowerCase();

    if (/^[a-z]+$/i.test(normalizedToken)) {
      if (normalizedToken.endsWith('ies') && normalizedToken.length > 4) {
        return `${normalizedToken.slice(0, -3)}y`;
      }

      if (normalizedToken.endsWith('es') && normalizedToken.length > 4) {
        return normalizedToken.slice(0, -2);
      }

      if (normalizedToken.endsWith('s') && normalizedToken.length > 3) {
        return normalizedToken.slice(0, -1);
      }
    }

    return normalizedToken;
  }
}
