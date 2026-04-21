import { CandidateResult } from '../../domain/entities';
import {
  CandidateVerificationService,
  UnlockerProvider,
  VerificationContext
} from '../../domain/repositories';
import { ResultType } from '../../domain/enums';

export class LinkedinVerificationService implements CandidateVerificationService {
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
    if (normalizedText.includes('page not found')) {
      return null;
    }

    const looksLikeGatedPage = this.looksLikeGatedPage(normalizedText);

    if (looksLikeGatedPage) {
      return candidate;
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

  private resolveResultType(url: string, normalizedText: string, fallbackType: ResultType): ResultType {
    if (url.includes('/company/')) {
      return ResultType.BUSINESS_PROFILE;
    }

    const companySignals = [
      'company size',
      'specialties',
      'headquarters',
      'industry',
      'employees',
      'overview',
      'about',
      'الموظفين',
      'التخصصات',
      'المقر الرئيسي',
    ];

    if (companySignals.some(signal => normalizedText.includes(signal))) {
      return ResultType.BUSINESS_PROFILE;
    }

    const profileSignals = [
      'experience',
      'skills',
      'connections',
      'current company',
      'about',
      'الخبره',
      'المهارات',
    ];

    if (profileSignals.some(signal => normalizedText.includes(signal))) {
      return ResultType.PROFESSIONAL_PROFILE;
    }

    return fallbackType;
  }

  private looksLikeGatedPage(normalizedText: string): boolean {
    const gatingSignals = [
      'sign in',
      'join now',
      'linkedin login',
      'sign in to linkedin',
      'انضم الان',
      'تسجيل الدخول',
    ];

    return gatingSignals.some(signal => normalizedText.includes(signal));
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
