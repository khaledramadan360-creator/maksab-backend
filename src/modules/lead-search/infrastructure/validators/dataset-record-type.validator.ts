import { NormalizedDatasetRecord, RawDatasetRecord } from '../../domain/entities';
import { RejectedResultReason, ResultType, SearchPlatform } from '../../domain/enums';
import { DatasetRecordTypeValidatorPort } from '../../domain/repositories';

export class DatasetRecordTypeValidator implements DatasetRecordTypeValidatorPort {
  public validate(
    record: RawDatasetRecord,
    normalized?: NormalizedDatasetRecord | null
  ): { isValid: boolean; reason?: RejectedResultReason } {
    if (!normalized || !normalized.canonicalUrl) {
      return { isValid: false, reason: RejectedResultReason.MISSING_BASIC_FIELDS };
    }

    const typeHints = this.collectTypeHints(record, normalized);
    const typeTokens = this.extractTokens(typeHints);

    if (this.containsAnyToken(typeTokens, ['comment', 'comments'])) {
      return { isValid: false, reason: RejectedResultReason.CONTENT_PAGE };
    }

    if (this.containsAnyToken(typeTokens, ['post', 'posts', 'feed'])) {
      return { isValid: false, reason: RejectedResultReason.POST_PAGE };
    }

    if (this.containsAnyToken(typeTokens, ['reel', 'reels', 'video', 'videos', 'watch', 'clip', 'short'])) {
      return { isValid: false, reason: RejectedResultReason.VIDEO_PAGE };
    }

    if (
      this.containsAnyToken(typeTokens, ['article', 'articles', 'blog', 'blogs', 'news', 'story', 'stories']) ||
      typeHints.includes('content item') ||
      typeHints.includes('content_item')
    ) {
      return { isValid: false, reason: RejectedResultReason.CONTENT_PAGE };
    }

    if (record.platform === SearchPlatform.LINKEDIN) {
      if (!this.isAllowedLinkedinUrl(normalized.canonicalUrl)) {
        return { isValid: false, reason: RejectedResultReason.UNSUPPORTED_PAGE_TYPE };
      }

      if (normalized.resultType === ResultType.UNKNOWN) {
        return { isValid: false, reason: RejectedResultReason.UNSUPPORTED_PAGE_TYPE };
      }

      return { isValid: true };
    }

    if (record.platform === SearchPlatform.WEBSITE) {
      if (this.looksLikeContentWebsitePath(normalized.canonicalUrl)) {
        return { isValid: false, reason: RejectedResultReason.CONTENT_PAGE };
      }

      if (normalized.resultType === ResultType.UNKNOWN) {
        return { isValid: false, reason: RejectedResultReason.UNSUPPORTED_PAGE_TYPE };
      }

      return { isValid: true };
    }

    return { isValid: false, reason: RejectedResultReason.UNSUPPORTED_PAGE_TYPE };
  }

  private collectTypeHints(record: RawDatasetRecord, normalized: NormalizedDatasetRecord): string {
    const payload = record.payload;
    const values = [
      payload.record_type,
      payload.type,
      payload.entity_type,
      payload.kind,
      payload.page_type,
      payload.profile_type,
      payload.object_type,
      payload.media_type,
      payload.__typename,
      payload.path,
      payload.url,
      payload.canonical_url,
      normalized.canonicalUrl,
    ];

    return this.normalizeText(
      values
        .map(value => this.stringifyValue(value))
        .filter(Boolean)
        .join(' ')
    );
  }

  private isAllowedLinkedinUrl(url: string): boolean {
    try {
      const path = new URL(url).pathname.toLowerCase();
      return path.startsWith('/in/') || path.startsWith('/company/');
    } catch {
      return false;
    }
  }

  private looksLikeContentWebsitePath(url: string): boolean {
    try {
      const path = new URL(url).pathname.toLowerCase();
      return /\/(blog|blogs|article|articles|news|post|posts|category|tag|video|videos|watch|reel|reels|comment|comments)(\/|$)/i.test(path);
    } catch {
      return true;
    }
  }

  private containsAnyToken(tokens: string[], needles: string[]): boolean {
    return needles.some(needle => tokens.includes(needle));
  }

  private stringifyValue(value: unknown): string {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (Array.isArray(value)) {
      return value.map(item => this.stringifyValue(item)).join(' ');
    }

    if (value && typeof value === 'object') {
      return Object.values(value as Record<string, unknown>)
        .map(entry => this.stringifyValue(entry))
        .join(' ');
    }

    return '';
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

  private extractTokens(text: string): string[] {
    return Array.from(new Set(
      this.normalizeText(text)
        .replace(/[^a-z0-9\u0600-\u06FF\s/_-]/gi, ' ')
        .split(/[\s/_-]+/)
        .filter(token => token.length >= 2)
    ));
  }
}
