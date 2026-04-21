import { NormalizedDatasetRecord, RawDatasetRecord } from '../../domain/entities';
import { ResultType, SearchPlatform } from '../../domain/enums';
import { DatasetRecordNormalizerPort, UrlNormalizer } from '../../domain/repositories';

export class DatasetRecordNormalizer implements DatasetRecordNormalizerPort {
  constructor(private readonly urlNormalizer: UrlNormalizer) {}

  public normalize(record: RawDatasetRecord): NormalizedDatasetRecord | null {
    const canonicalUrl = this.resolveCanonicalUrl(record);
    if (!canonicalUrl) {
      return null;
    }

    const titleOrHeadline = this.pickFirstString(record.payload, [
      'title',
      'headline',
      'subtitle',
      'name',
      'company_name',
      'organization_name',
      'business_name',
      'page_name',
      'full_name',
      'display_name',
      'handle',
    ]);

    const nameOrLabel = this.pickFirstString(record.payload, [
      'name',
      'company_name',
      'organization_name',
      'business_name',
      'page_name',
      'full_name',
      'display_name',
      'title',
      'headline',
    ]) || titleOrHeadline;

    const location = this.pickFirstString(record.payload, [
      'location',
      'formatted_location',
      'city',
      'address',
      'headquarters',
      'country',
      'country_code',
    ]);

    const snippet = this.pickFirstString(record.payload, [
      'about',
      'description',
      'summary',
      'bio',
      'biography',
      'headline',
      'subtitle',
      'tagline',
      'slogan',
      'snippet',
      'specialties',
      'industries',
    ]);

    return {
      platform: record.platform,
      canonicalUrl,
      nameOrLabel,
      titleOrHeadline: titleOrHeadline || nameOrLabel || canonicalUrl,
      location,
      snippet,
      resultType: this.resolveResultType(record.platform, record.payload, canonicalUrl),
      sourceDataset: record.sourceDataset,
      sourceKeyword: record.sourceKeyword,
    };
  }

  private resolveCanonicalUrl(record: RawDatasetRecord): string {
    const url = this.pickFirstString(record.payload, [
      'canonical_url',
      'url',
      'profile_url',
      'page_url',
      'company_url',
      'website',
      'website_url',
      'homepage',
      'link',
      'final_url',
      'permalink',
    ]);

    if (!url) {
      return '';
    }

    return this.urlNormalizer.normalize(url, record.platform);
  }

  private resolveResultType(
    platform: SearchPlatform,
    payload: Record<string, any>,
    canonicalUrl: string
  ): ResultType {
    const typeHints = this.normalizeText([
      this.pickFirstString(payload, ['record_type', 'type', 'entity_type', 'kind', 'page_type']),
      this.pickFirstString(payload, ['profile_type', 'business_type', 'organization_type']),
      canonicalUrl,
    ].join(' '));

    if (platform === SearchPlatform.LINKEDIN) {
      if (canonicalUrl.includes('/company/') || typeHints.includes('company') || typeHints.includes('organization')) {
        return ResultType.BUSINESS_PROFILE;
      }

      if (canonicalUrl.includes('/in/') || typeHints.includes('profile') || typeHints.includes('person')) {
        return ResultType.PROFESSIONAL_PROFILE;
      }

      return ResultType.UNKNOWN;
    }

    if (platform === SearchPlatform.WEBSITE) {
      if (this.looksLikeHomepage(canonicalUrl) || typeHints.includes('homepage') || typeHints.includes('official')) {
        return ResultType.OFFICIAL_WEBSITE;
      }

      return ResultType.OFFICIAL_BUSINESS_PAGE;
    }

    return ResultType.UNKNOWN;
  }

  private looksLikeHomepage(url: string): boolean {
    try {
      const path = new URL(url).pathname.toLowerCase();
      return path === '/' || path === '' || /^\/([a-z]{2})?$/.test(path);
    } catch {
      return false;
    }
  }

  private pickFirstString(payload: Record<string, any>, keys: string[]): string {
    for (const key of keys) {
      const value = payload[key];
      const extracted = this.stringifyValue(value);
      if (extracted) {
        return extracted;
      }
    }

    return '';
  }

  private stringifyValue(value: unknown): string {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (Array.isArray(value)) {
      const firstUseful = value
        .map(item => this.stringifyValue(item))
        .find(item => item.length > 0);

      return firstUseful || '';
    }

    if (value && typeof value === 'object') {
      const objectValue = value as Record<string, unknown>;
      const nestedKeys = ['name', 'title', 'headline', 'city', 'country', 'formatted', 'label', 'value'];

      for (const nestedKey of nestedKeys) {
        const nested = this.stringifyValue(objectValue[nestedKey]);
        if (nested) {
          return nested;
        }
      }
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
}
