import { AnalysisSourcePlatform } from '../../domain/enums';
import {
  CapturedPlatformScreenshot,
  PlatformScreenshotProviderContract,
} from '../../domain/repositories';

export class PlatformScreenshotProvider implements PlatformScreenshotProviderContract {
  private readonly timeoutMs: number;
  private readonly brightDataWsEndpoint: string;
  private readonly viewportWidth: number;
  private readonly viewportHeight: number;
  private readonly bioCaptureHeight: number;

  constructor() {
    this.timeoutMs = this.resolvePositiveInt(process.env.ANALYSIS_SCREENSHOT_TIMEOUT_MS, 25000);
    this.brightDataWsEndpoint =
      process.env.BRIGHT_DATA_WS_ENDPOINT ||
      process.env.BRIGHTDATA_WS_ENDPOINT ||
      '';
    this.viewportWidth = this.resolvePositiveInt(process.env.ANALYSIS_SCREENSHOT_VIEWPORT_WIDTH, 1440);
    this.viewportHeight = this.resolvePositiveInt(process.env.ANALYSIS_SCREENSHOT_VIEWPORT_HEIGHT, 900);
    this.bioCaptureHeight = this.resolvePositiveInt(process.env.ANALYSIS_SCREENSHOT_BIO_HEIGHT, 900);
  }

  async capturePlatformScreenshot(
    platform: AnalysisSourcePlatform,
    platformUrl: string
  ): Promise<CapturedPlatformScreenshot> {
    const targetUrls = this.buildCandidateUrls(platformUrl, platform);
    if (targetUrls.length === 0) {
      throw new Error('invalid_platform_url_for_screenshot');
    }

    if (!this.brightDataWsEndpoint) {
      throw new Error('brightdata_ws_not_configured_for_screenshots');
    }

    let lastError: unknown = null;
    for (const targetUrl of targetUrls) {
      try {
        return await this.captureOnce(platform, targetUrl);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error('platform_screenshot_capture_failed');
  }

  private async captureOnce(
    platform: AnalysisSourcePlatform,
    targetUrl: string
  ): Promise<CapturedPlatformScreenshot> {
    const playwright = await import('playwright-core');
    const browser = await playwright.chromium.connectOverCDP(this.brightDataWsEndpoint, {
      timeout: this.timeoutMs,
    });

    let page: any = null;
    let context: any = null;
    const capturedAt = new Date();

    try {
      context = await browser.newContext({
        ignoreHTTPSErrors: true,
        viewport: {
          width: this.viewportWidth,
          height: this.viewportHeight,
        },
      });

      page = await context.newPage();
      await page.goto(targetUrl, {
        waitUntil: platform === AnalysisSourcePlatform.Website ? 'load' : 'domcontentloaded',
        timeout: this.timeoutMs,
      });
      await page.waitForTimeout(platform === AnalysisSourcePlatform.Website ? 1800 : 1200);
      await page.evaluate(() => window.scrollTo(0, 0));

      const clipHeight = Math.min(this.bioCaptureHeight, this.viewportHeight);
      const buffer = await page.screenshot({
        type: 'png',
        fullPage: false,
        clip: {
          x: 0,
          y: 0,
          width: this.viewportWidth,
          height: clipHeight,
        },
      });

      return {
        platform,
        platformUrl: targetUrl,
        contentType: 'image/png',
        fileExtension: 'png',
        data: Buffer.from(buffer),
        capturedAt,
      };
    } finally {
      if (page) {
        try {
          await page.close();
        } catch {
          // ignore cleanup failures
        }
      }

      if (context) {
        try {
          await context.close();
        } catch {
          // ignore cleanup failures
        }
      }

      try {
        await browser.close();
      } catch {
        // ignore cleanup failures
      }
    }
  }

  private buildCandidateUrls(
    rawValue: string,
    platform: AnalysisSourcePlatform
  ): string[] {
    const primary = this.normalizeUrl(rawValue);
    if (!primary) {
      return [];
    }

    const candidates: string[] = [primary];

    if (platform === AnalysisSourcePlatform.Website) {
      try {
        const parsed = new URL(primary);
        const host = parsed.hostname.toLowerCase();
        if (host.startsWith('www.')) {
          const alt = new URL(primary);
          alt.hostname = host.replace(/^www\./, '');
          candidates.push(alt.toString());
        } else {
          const alt = new URL(primary);
          alt.hostname = `www.${host}`;
          candidates.push(alt.toString());
        }
      } catch {
        // ignore alternate candidate failures
      }
    }

    return Array.from(new Set(candidates));
  }

  private normalizeUrl(value: string): string {
    const trimmed = String(value || '').trim();
    if (!trimmed) {
      return '';
    }

    if (!/^[a-z]+:\/\//i.test(trimmed)) {
      const withHttps = `https://${trimmed}`;
      try {
        const parsed = new URL(withHttps);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          return parsed.toString();
        }
      } catch {
        // continue to default parsing
      }
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return '';
      }
      return parsed.toString();
    } catch {
      return '';
    }
  }

  private resolvePositiveInt(rawValue: string | undefined, fallback: number): number {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }
    return Math.floor(parsed);
  }
}
