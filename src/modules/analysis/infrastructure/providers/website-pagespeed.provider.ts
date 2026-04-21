import {
  WebsitePageSpeedCategoryScores,
  WebsitePageSpeedKeyAudit,
  WebsitePageSpeedProviderContract,
  WebsitePageSpeedResult,
  WebsitePageSpeedStrategyResult,
} from '../../domain/repositories';

export class WebsitePageSpeedProvider implements WebsitePageSpeedProviderContract {
  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly timeoutMs: number;
  private readonly runDesktop: boolean;

  constructor() {
    this.apiKey =
      process.env.PAGESPEED_API_KEY ||
      process.env.GOOGLE_PAGESPEED_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      '';
    this.endpoint =
      process.env.PAGESPEED_API_ENDPOINT ||
      'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    this.timeoutMs = this.resolvePositiveInt(process.env.ANALYSIS_PAGESPEED_TIMEOUT_MS, 20000);
    this.runDesktop = this.resolveBoolean(process.env.ANALYSIS_PAGESPEED_INCLUDE_DESKTOP, false);
  }

  async analyzeWebsite(url: string): Promise<WebsitePageSpeedResult | null> {
    const normalizedUrl = url.trim();
    if (!normalizedUrl) {
      return null;
    }

    const mobile = await this.fetchStrategy(normalizedUrl, 'mobile');
    const desktop = this.runDesktop ? await this.fetchStrategy(normalizedUrl, 'desktop') : null;

    if (!mobile && !desktop) {
      return null;
    }

    return {
      url: normalizedUrl,
      mobile,
      desktop,
      aggregate: this.buildAggregateScores(mobile?.categories || null, desktop?.categories || null),
    };
  }

  private async fetchStrategy(
    url: string,
    strategy: 'mobile' | 'desktop'
  ): Promise<WebsitePageSpeedStrategyResult | null> {
    try {
      const queryParams = new URLSearchParams({
        url,
        strategy,
        category: 'performance',
      });
      queryParams.append('category', 'accessibility');
      queryParams.append('category', 'best-practices');
      queryParams.append('category', 'seo');
      if (this.apiKey) {
        queryParams.append('key', this.apiKey);
      }

      const response = await this.fetchWithTimeout(`${this.endpoint}?${queryParams.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        return null;
      }

      const payload = await response.json();
      const lighthouse = payload?.lighthouseResult;
      const categories = lighthouse?.categories || {};
      const audits = lighthouse?.audits || {};

      return {
        strategy,
        fetchedAt: new Date().toISOString(),
        categories: {
          performance: this.toScore100(categories?.performance?.score),
          accessibility: this.toScore100(categories?.accessibility?.score),
          bestPractices: this.toScore100(categories?.['best-practices']?.score),
          seo: this.toScore100(categories?.seo?.score),
        },
        keyAudits: [
          this.toAudit('first-contentful-paint', audits),
          this.toAudit('largest-contentful-paint', audits),
          this.toAudit('total-blocking-time', audits),
          this.toAudit('cumulative-layout-shift', audits),
          this.toAudit('speed-index', audits),
          this.toAudit('interactive', audits),
        ].filter((item): item is WebsitePageSpeedKeyAudit => !!item),
      };
    } catch {
      return null;
    }
  }

  private buildAggregateScores(
    mobile: WebsitePageSpeedCategoryScores | null,
    desktop: WebsitePageSpeedCategoryScores | null
  ): WebsitePageSpeedCategoryScores {
    const avg = (a: number | null, b: number | null): number | null => {
      const values = [a, b].filter((item): item is number => typeof item === 'number');
      if (values.length === 0) {
        return null;
      }
      return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
    };

    return {
      performance: avg(mobile?.performance ?? null, desktop?.performance ?? null),
      accessibility: avg(mobile?.accessibility ?? null, desktop?.accessibility ?? null),
      bestPractices: avg(mobile?.bestPractices ?? null, desktop?.bestPractices ?? null),
      seo: avg(mobile?.seo ?? null, desktop?.seo ?? null),
    };
  }

  private toAudit(auditId: string, audits: Record<string, any>): WebsitePageSpeedKeyAudit | null {
    const audit = audits?.[auditId];
    if (!audit) {
      return null;
    }

    return {
      id: auditId,
      title: typeof audit?.title === 'string' ? audit.title : auditId,
      score: this.toNullableScore100(audit?.score),
      numericValue: this.toNullableNumber(audit?.numericValue),
      displayValue: typeof audit?.displayValue === 'string' ? audit.displayValue : null,
    };
  }

  private toScore100(score: unknown): number | null {
    const numeric = this.toNullableNumber(score);
    if (numeric === null) {
      return null;
    }

    // PageSpeed categories usually return 0..1
    const normalized = numeric <= 1 ? numeric * 100 : numeric;
    return Math.max(0, Math.min(100, Number(normalized.toFixed(2))));
  }

  private toNullableScore100(score: unknown): number | null {
    const numeric = this.toNullableNumber(score);
    if (numeric === null) {
      return null;
    }
    const normalized = numeric <= 1 ? numeric * 100 : numeric;
    return Math.max(0, Math.min(100, Number(normalized.toFixed(2))));
  }

  private toNullableNumber(value: unknown): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private resolvePositiveInt(rawValue: string | undefined, fallback: number): number {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }
    return Math.floor(parsed);
  }

  private resolveBoolean(rawValue: string | undefined, fallback: boolean): boolean {
    if (!rawValue) {
      return fallback;
    }
    const normalized = rawValue.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'n'].includes(normalized)) {
      return false;
    }
    return fallback;
  }
}
