import { ScrapedPlatformInput } from '../../domain/entities';
import { AnalysisSourcePlatform } from '../../domain/enums';
import { WebsitePageSpeedResult, WebsitePageSpeedStrategyResult } from '../../domain/repositories';

export interface NormalizeScrapedInputOptions {
  websitePageSpeed?: WebsitePageSpeedResult | null;
}

export class ScrapedDataNormalizationService {
  private readonly maxTextLength: number;

  constructor(maxTextLength = 12000) {
    this.maxTextLength = maxTextLength;
  }

  normalize(
    inputs: ScrapedPlatformInput[],
    options?: NormalizeScrapedInputOptions
  ): ScrapedPlatformInput[] {
    const dedupe = new Set<string>();
    const normalized: ScrapedPlatformInput[] = [];
    const websitePageSpeed = options?.websitePageSpeed || null;

    for (const item of inputs) {
      const platformUrl = item.platformUrl.trim();
      if (!platformUrl) {
        continue;
      }

      const dedupeKey = `${item.platform}|${platformUrl}`;
      if (dedupe.has(dedupeKey)) {
        continue;
      }
      dedupe.add(dedupeKey);

      const compactText = this.compactWhitespace(item.scrapedText);
      if (compactText.length < 30) {
        continue;
      }

      const mergedMetadata = this.normalizeMetadata(item.scrapedMetadata);
      let mergedText = compactText;

      if (item.platform === AnalysisSourcePlatform.Website && websitePageSpeed) {
        mergedMetadata.pageSpeed = this.normalizePageSpeedMetadata(websitePageSpeed);
        const pageSpeedText = this.buildPageSpeedText(websitePageSpeed);
        if (pageSpeedText) {
          mergedText = `${compactText}\n\n${pageSpeedText}`;
        }
      }

      normalized.push({
        platform: item.platform,
        platformUrl,
        scrapedText: mergedText.slice(0, this.maxTextLength),
        scrapedMetadata: mergedMetadata,
      });
    }

    // If website scraping failed but PageSpeed exists, keep website signals available for AI interpretation.
    if (
      websitePageSpeed &&
      !normalized.some(item => item.platform === AnalysisSourcePlatform.Website)
    ) {
      const pageSpeedText = this.buildPageSpeedText(websitePageSpeed);
      if (pageSpeedText) {
        normalized.push({
          platform: AnalysisSourcePlatform.Website,
          platformUrl: websitePageSpeed.url,
          scrapedText: pageSpeedText.slice(0, this.maxTextLength),
          scrapedMetadata: {
            source: 'pagespeed_only',
            pageSpeed: this.normalizePageSpeedMetadata(websitePageSpeed),
          },
        });
      }
    }

    return normalized;
  }

  private compactWhitespace(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  private normalizeMetadata(value: Record<string, unknown>): Record<string, unknown> {
    const output: Record<string, unknown> = {};
    for (const [key, rawValue] of Object.entries(value || {})) {
      if (rawValue === null || rawValue === undefined) {
        continue;
      }

      if (typeof rawValue === 'string') {
        const compact = this.compactWhitespace(rawValue);
        if (compact.length > 0) {
          output[key] = compact;
        }
        continue;
      }

      output[key] = rawValue;
    }

    return output;
  }

  private normalizePageSpeedMetadata(value: WebsitePageSpeedResult): Record<string, unknown> {
    return {
      url: value.url,
      aggregate: value.aggregate,
      mobile: value.mobile
        ? {
            strategy: value.mobile.strategy,
            fetchedAt: value.mobile.fetchedAt,
            categories: value.mobile.categories,
            keyAudits: value.mobile.keyAudits,
          }
        : null,
      desktop: value.desktop
        ? {
            strategy: value.desktop.strategy,
            fetchedAt: value.desktop.fetchedAt,
            categories: value.desktop.categories,
            keyAudits: value.desktop.keyAudits,
          }
        : null,
    };
  }

  private buildPageSpeedText(value: WebsitePageSpeedResult): string {
    const lines: string[] = [];
    lines.push('Website PageSpeed Insights signals:');

    const appendStrategy = (strategy: WebsitePageSpeedStrategyResult | null) => {
      if (!strategy) {
        return;
      }

      const { categories } = strategy;
      lines.push(
        `${strategy.strategy.toUpperCase()} scores -> performance: ${this.displayScore(
          categories.performance
        )}, accessibility: ${this.displayScore(categories.accessibility)}, best practices: ${this.displayScore(
          categories.bestPractices
        )}, seo: ${this.displayScore(categories.seo)}`
      );

      if (strategy.keyAudits.length > 0) {
        const auditsPreview = strategy.keyAudits
          .slice(0, 4)
          .map(item => `${item.title}: ${item.displayValue || this.displayScore(item.score)}`)
          .join(' | ');
        lines.push(`${strategy.strategy.toUpperCase()} key audits -> ${auditsPreview}`);
      }
    };

    appendStrategy(value.mobile);
    appendStrategy(value.desktop);

    const aggregate = value.aggregate;
    if (
      aggregate.performance !== null ||
      aggregate.accessibility !== null ||
      aggregate.bestPractices !== null ||
      aggregate.seo !== null
    ) {
      lines.push(
        `AGGREGATE scores -> performance: ${this.displayScore(
          aggregate.performance
        )}, accessibility: ${this.displayScore(aggregate.accessibility)}, best practices: ${this.displayScore(
          aggregate.bestPractices
        )}, seo: ${this.displayScore(aggregate.seo)}`
      );
    }

    return lines.join('\n').trim();
  }

  private displayScore(value: number | null): string {
    if (value === null || !Number.isFinite(value)) {
      return 'n/a';
    }
    return `${Number(value.toFixed(2))}/100`;
  }
}
