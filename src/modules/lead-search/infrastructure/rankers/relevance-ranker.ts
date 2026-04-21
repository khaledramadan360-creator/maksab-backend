import { ResultRanker, RankingContext } from '../../domain/repositories';
import { CandidateResult } from '../../domain/entities';
import { ResultType } from '../../domain/enums';

export interface ScoreBreakdown {
  keywordMatchScore: number;       // Max 45
  cityMatchScore: number;          // Max 20
  resultClarityScore: number;      // Max 15
  clientTypeStrengthScore: number; // Max 10
  fieldCompletenessScore: number;  // Max 10
  totalScore: number;              // Max 100
}

export class DefaultRelevanceRanker implements ResultRanker {
  public rank(results: CandidateResult[], context: RankingContext): CandidateResult[] {
    const scoredResults = results.map(result => ({
      ...result,
      score: this.score(result, context)
    }));

    return scoredResults.sort((a, b) => b.score - a.score);
  }

  public score(result: CandidateResult, context: RankingContext): number {
    const breakdown = this.calculateBreakdown(result, context);
    return breakdown.totalScore;
  }

  public calculateBreakdown(result: CandidateResult, context: RankingContext): ScoreBreakdown {
    const keywordMatchScore = this.calculateKeywordMatchScore(result, context);
    const cityMatchScore = this.calculateCityMatchScore(result, context);
    const resultClarityScore = this.calculateClarityScore(result);
    const clientTypeStrengthScore = this.calculateClientTypeScore(result);
    const fieldCompletenessScore = this.calculateCompletenessScore(result);

    const totalScore =
      keywordMatchScore +
      cityMatchScore +
      resultClarityScore +
      clientTypeStrengthScore +
      fieldCompletenessScore;

    return {
      keywordMatchScore,
      cityMatchScore,
      resultClarityScore,
      clientTypeStrengthScore,
      fieldCompletenessScore,
      totalScore
    };
  }

  private calculateKeywordMatchScore(result: CandidateResult, context: RankingContext): number {
    const titleAndLabelRaw = `${result.title} ${result.extractedNameOrLabel}`;
    const snippetRaw = result.snippet || '';

    const titleAndLabel = this.normalizeText(titleAndLabelRaw);
    const snippet = this.normalizeText(snippetRaw);
    const combined = `${titleAndLabel} ${snippet}`.trim();

    const normalizedPhrase = (context.normalizedPhrase || this.normalizeText(context.originalKeyword)).trim();
    const phraseTokens = this.resolvePhraseTokens(context);

    if (normalizedPhrase && titleAndLabel.includes(normalizedPhrase)) return 45;
    if (normalizedPhrase && snippet.includes(normalizedPhrase)) return 38;

    const titleOverlap = this.countTokenOverlap(phraseTokens, titleAndLabelRaw);
    const snippetOverlap = this.countTokenOverlap(phraseTokens, snippetRaw);
    const combinedOverlap = this.countTokenOverlap(phraseTokens, combined);

    if (titleOverlap >= 3) return 34;
    if (titleOverlap >= 2) return 30;
    if (snippetOverlap >= 3) return 26;
    if (snippetOverlap >= 2) return 22;
    if (combinedOverlap >= 1) return 12;

    return 0;
  }

  private calculateCityMatchScore(result: CandidateResult, context: RankingContext): number {
    if (!context.saudiCity) return 0;

    const city = this.normalizeText(context.saudiCity);
    const strongLocationFields = this.normalizeText(
      `${result.title} ${result.extractedNameOrLabel} ${result.extractedLocation}`
    );
    const snippet = this.normalizeText(result.snippet || '');

    if (strongLocationFields.includes(city)) return 20;
    if (snippet.includes(city)) return 15;

    const allText = `${strongLocationFields} ${snippet}`;
    if (allText.includes('saudi') || allText.includes('ksa') || allText.includes('السعوديه')) {
      return 10;
    }

    return 0;
  }

  private calculateClarityScore(result: CandidateResult): number {
    let score = 0;

    if (result.title && result.title.trim() !== '') score += 5;
    if (result.snippet && result.snippet.trim().length > 20) score += 5;
    if (result.extractedNameOrLabel && result.extractedNameOrLabel.trim() !== '') score += 5;

    return score;
  }

  private calculateClientTypeScore(result: CandidateResult): number {
    switch (result.resultType) {
      case ResultType.OFFICIAL_WEBSITE: return 10;
      case ResultType.OFFICIAL_BUSINESS_PAGE: return 8;
      case ResultType.BUSINESS_PROFILE: return 6;
      case ResultType.PROFESSIONAL_PROFILE: return 4;
      default: return 0;
    }
  }

  private calculateCompletenessScore(result: CandidateResult): number {
    let score = 0;
    if (result.canonicalUrl) score += 2;
    if (result.title) score += 2;
    if (result.extractedNameOrLabel) score += 2;
    if (result.extractedLocation) score += 2;
    if (result.snippet) score += 2;
    return score;
  }

  private resolvePhraseTokens(context: RankingContext): string[] {
    if (context.phraseTokens && context.phraseTokens.length > 0) {
      return Array.from(new Set(context.phraseTokens.map(token => this.normalizeComparableToken(token))));
    }

    return this.extractComparableTokens(
      context.originalKeyword || context.normalizedPhrase || (context.keywordVariants || []).join(' ')
    );
  }

  private countTokenOverlap(tokens: string[], text: string): number {
    if (tokens.length === 0) {
      return 0;
    }

    const textTokens = this.extractComparableTokens(text);
    return tokens.filter(token => textTokens.includes(token)).length;
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
