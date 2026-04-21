import { CandidateResult } from '../../domain/entities';
import {
  CandidateVerificationService,
  UnlockerProvider,
  VerificationContext
} from '../../domain/repositories';
import { ResultType } from '../../domain/enums';

export class WebsiteVerificationService implements CandidateVerificationService {
  constructor(private readonly unlockerProvider: UnlockerProvider) {}

  public async verifyCandidates(
    candidates: CandidateResult[],
    context: VerificationContext
  ): Promise<CandidateResult[]> {
    const verifiedCandidates: CandidateResult[] = [];

    for (const candidate of candidates) {
      const verifiedCandidate = await this.verifyCandidate(candidate, context);
      if (verifiedCandidate) {
        verifiedCandidates.push(verifiedCandidate);
      }
    }

    return verifiedCandidates;
  }

  private async verifyCandidate(
    candidate: CandidateResult,
    context: VerificationContext
  ): Promise<CandidateResult | null> {
    const page = await this.unlockerProvider.unlock(candidate.canonicalUrl, {
      country: context.country || 'SA'
    });

    if (!page) {
      return candidate;
    }

    if (page.statusCode >= 400) {
      return null;
    }

    const normalizedText = this.normalizeText(`${page.title} ${page.bodyText}`);
    if (this.looksLikeRejectedPage(candidate.canonicalUrl, normalizedText)) {
      return null;
    }

    const updatedTitle = this.pickBestTitle(candidate.title, page.title);
    const updatedSnippet = this.pickBestSnippet(candidate.snippet, page.bodyText);
    const extractedLocation = this.extractLocation(normalizedText, context) || candidate.extractedLocation;
    const resultType = this.resolveResultType(candidate.canonicalUrl, normalizedText, candidate.resultType);

    return {
      ...candidate,
      title: updatedTitle,
      snippet: updatedSnippet,
      extractedLocation,
      resultType
    };
  }

  private looksLikeRejectedPage(url: string, normalizedText: string): boolean {
    const loweredUrl = url.toLowerCase();

    if (/(\/blog\/|\/article\/|\/news\/|\/post\/|\/category\/|\/tag\/)/i.test(loweredUrl)) {
      return true;
    }

    const hardRejectSignals = [
      '404',
      'page not found',
      'privacy policy',
      'terms of use',
      'terms of service',
      'cookie policy',
      'read more',
      'author',
      'posted by',
      'المقال',
      'سياسه الخصوصيه',
      'الشروط والاحكام',
      'الكاتب',
    ];

    const businessSignals = [
      'services',
      'solutions',
      'products',
      'contact us',
      'about us',
      'our company',
      'our team',
      'خدماتنا',
      'حلولنا',
      'منتجاتنا',
      'عن الشركه',
      'تواصل معنا',
    ];

    const hasHardReject = hardRejectSignals.some(signal => normalizedText.includes(signal));
    const hasBusinessSignal = businessSignals.some(signal => normalizedText.includes(signal));

    return hasHardReject && !hasBusinessSignal;
  }

  private resolveResultType(url: string, normalizedText: string, fallbackType: ResultType): ResultType {
    const path = this.safePathname(url);

    if (path === '/' || path === '' || /^\/(home|about|contact|services?)(\/|$)/i.test(path)) {
      return ResultType.OFFICIAL_WEBSITE;
    }

    const businessSignals = [
      'services',
      'solutions',
      'products',
      'about us',
      'contact us',
      'خدماتنا',
      'حلولنا',
      'منتجاتنا',
      'عن الشركه',
      'تواصل معنا',
    ];

    if (businessSignals.some(signal => normalizedText.includes(signal))) {
      return ResultType.OFFICIAL_BUSINESS_PAGE;
    }

    return fallbackType;
  }

  private extractLocation(normalizedText: string, context: VerificationContext): string {
    if (!context.city) {
      return '';
    }

    const normalizedCity = this.normalizeText(context.city);
    if (normalizedCity && normalizedText.includes(normalizedCity)) {
      return `${context.city}, Saudi Arabia`;
    }

    return '';
  }

  private pickBestTitle(existingTitle: string, verifiedTitle: string): string {
    const cleanVerifiedTitle = (verifiedTitle || '').trim();
    if (!cleanVerifiedTitle) {
      return existingTitle;
    }

    return cleanVerifiedTitle.length >= existingTitle.length ? cleanVerifiedTitle : existingTitle;
  }

  private pickBestSnippet(existingSnippet: string, bodyText: string): string {
    if (existingSnippet && existingSnippet.trim().length >= 60) {
      return existingSnippet;
    }

    const preview = bodyText.trim().slice(0, 240);
    return preview || existingSnippet;
  }

  private safePathname(url: string): string {
    try {
      return new URL(url).pathname.toLowerCase();
    } catch {
      return '';
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
}
