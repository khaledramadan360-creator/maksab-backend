import { ResultFilter, FilterContext } from '../../domain/repositories';
import { RawSearchResult } from '../../domain/entities';
import { RejectedResultReason, SearchPlatform } from '../../domain/enums';

export class ClientOnlyResultFilter implements ResultFilter {
  isCandidateValid(result: RawSearchResult, context?: FilterContext): { isValid: boolean; reason?: RejectedResultReason } {
    if (!result.title || result.title.trim() === '') {
      return { isValid: false, reason: RejectedResultReason.MISSING_BASIC_FIELDS };
    }

    const rawText = `${result.title} ${result.snippet}`.trim();
    const normalizedText = this.normalizeText(rawText);
    const url = this.tryParseUrl(result.url);
    const path = url?.pathname.toLowerCase() || '';

    if (this.matchesAnyPattern(normalizedText, [
      /\bhow to\b/,
      /\bguide\b/,
      /\btutorial\b/,
      /\bstep by step\b/,
      /\bbreaking news\b/,
      /\blast news\b/,
      /\bread more\b/,
      /\bwatch now\b/,
      /\bwatch this\b/,
      /\blive stream\b/,
      /\bpodcast\b/,
      /\bepisode\b/,
      /\bwebinar\b/,
      /\bcase study\b/,
      /\bwhitepaper\b/,
      /\btop\s+\d+\b/,
      /\bbest\s+\d+\b/,
      /\bnews[:\s]/,
      /\barticle[:\s]/,
      /\bblog[:\s]/,
    ])) {
      return { isValid: false, reason: RejectedResultReason.CONTENT_PAGE };
    }

    if (this.matchesAnyPattern(path, [
      /\/(blog|blogs|article|articles|news|post|posts|tag|category|podcast|webinar|press|insights|stories?|reels?|videos?|watch)(\/|$)/,
    ])) {
      return { isValid: false, reason: RejectedResultReason.CONTENT_PAGE };
    }

    if (result.platform === SearchPlatform.LINKEDIN) {
      if (this.matchesAnyPattern(normalizedText, [
        /\bposts?\b/,
        /\barticle\b/,
        /\bpulse\b/,
        /\bcomment\b/,
        /\bjob opening\b/,
        /\bjobs?\b/,
      ])) {
        return { isValid: false, reason: RejectedResultReason.CONTENT_PAGE };
      }
    }

    if (context?.city) {
      const normalizedCity = this.normalizeText(context.city);
      const mentionsRequestedCity = normalizedText.includes(normalizedCity);
      const mentionsSaudi = normalizedText.includes('saudi') || normalizedText.includes('ksa');

      if (!mentionsRequestedCity && !mentionsSaudi && this.looksLikePureGlobalContent(normalizedText)) {
        return { isValid: false, reason: RejectedResultReason.NOT_A_POTENTIAL_CLIENT };
      }
    }

    return { isValid: true };
  }

  private tryParseUrl(value: string): URL | null {
    try {
      return new URL(value);
    } catch {
      return null;
    }
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0640]/g, '')
      .replace(/[\u0623\u0625\u0622]/g, '\u0627')
      .replace(/\u0629/g, '\u0647')
      .replace(/\u0649/g, '\u064A')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private matchesAnyPattern(value: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(value));
  }

  private looksLikePureGlobalContent(normalizedText: string): boolean {
    return this.matchesAnyPattern(normalizedText, [
      /\bglobal\b/,
      /\bworldwide\b/,
      /\binternational news\b/,
      /\bindustry news\b/,
      /\bmarket report\b/,
      /\btrend report\b/,
    ]);
  }
}
