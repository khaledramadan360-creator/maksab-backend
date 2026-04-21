import { existsSync } from 'node:fs';
import { ReportPdfGeneratorContract, ReportPdfFilePayload, RenderPdfInput } from '../../domain/repositories';

export class ReportPdfProvider implements ReportPdfGeneratorContract {
  private readonly timeoutMs: number;
  private readonly wsEndpoint: string;
  private readonly viewportWidth: number;
  private readonly viewportHeight: number;
  private readonly pageFormat: 'A4' | 'Letter';
  private readonly localChromePath: string;
  private readonly assetWaitTimeoutMs: number;
  private readonly settleDelayMs: number;

  constructor() {
    this.timeoutMs = this.resolveNonNegativeInt(process.env.REPORTS_PDF_TIMEOUT_MS, 0);
    this.wsEndpoint = (
      process.env.REPORTS_PDF_WS_ENDPOINT ||
      process.env.REPORTS_BRIGHT_DATA_WS_ENDPOINT ||
      process.env.BRIGHT_DATA_WS_ENDPOINT ||
      process.env.BRIGHTDATA_WS_ENDPOINT ||
      ''
    ).trim();
    this.viewportWidth = this.resolvePositiveInt(process.env.REPORTS_PDF_VIEWPORT_WIDTH, 1240);
    this.viewportHeight = this.resolvePositiveInt(process.env.REPORTS_PDF_VIEWPORT_HEIGHT, 1754);
    this.assetWaitTimeoutMs = this.resolvePositiveInt(
      process.env.REPORTS_PDF_ASSET_WAIT_TIMEOUT_MS,
      5000
    );
    this.settleDelayMs = this.resolveNonNegativeInt(process.env.REPORTS_PDF_SETTLE_DELAY_MS, 350);
    this.localChromePath = this.resolveLocalChromePath();

    const normalizedFormat = String(process.env.REPORTS_PDF_PAGE_FORMAT || '')
      .trim()
      .toUpperCase();
    this.pageFormat = normalizedFormat === 'LETTER' ? 'Letter' : 'A4';
  }

  async generatePdf(input: RenderPdfInput): Promise<ReportPdfFilePayload> {
    const html = String(input.html || '').trim();
    if (!html) {
      throw new Error('report_pdf_html_empty');
    }

    const htmlWithStyles = this.ensureCssInjected(html, String(input.css || ''));
    const pdfBuffer = await this.renderWithFallback(htmlWithStyles);

    return {
      contentType: 'application/pdf',
      data: pdfBuffer,
    };
  }

  private async renderWithFallback(html: string): Promise<Buffer> {
    let localError: unknown = null;

    try {
      return await this.renderWithLocalChromium(html);
    } catch (error) {
      localError = error;
    }

    if (!this.wsEndpoint) {
      throw new Error(
        `report_pdf_local_browser_failed: ${this.getErrorMessage(localError)}`
      );
    }

    try {
      return await this.renderWithRemoteChromium(html);
    } catch (remoteError) {
      throw new Error(
        `report_pdf_remote_and_local_failed local="${this.getErrorMessage(
          localError
        )}" remote="${this.getErrorMessage(remoteError)}"`
      );
    }
  }

  private ensureCssInjected(html: string, css: string): string {
    const styleText = css.trim();
    if (!styleText) {
      return html;
    }

    if (/<style[\s>]/i.test(html)) {
      return html;
    }

    const styleTag = `<style>${styleText}</style>`;
    if (/<\/head>/i.test(html)) {
      return html.replace(/<\/head>/i, `${styleTag}</head>`);
    }

    return `${styleTag}\n${html}`;
  }

  private async renderWithRemoteChromium(html: string): Promise<Buffer> {
    const playwright = await import('playwright-core');
    const browser = await playwright.chromium.connectOverCDP(this.wsEndpoint, {
      timeout: this.timeoutMs,
    });

    try {
      return await this.renderUsingBrowser(browser, html);
    } finally {
      try {
        await browser.close();
      } catch {
        // ignore browser close failures
      }
    }
  }

  private async renderWithLocalChromium(html: string): Promise<Buffer> {
    const playwright = await import('playwright-core');
    const launchOptions: Record<string, unknown> = {
      headless: true,
      timeout: this.timeoutMs,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };

    if (this.localChromePath) {
      launchOptions.executablePath = this.localChromePath;
    }

    const browser = await playwright.chromium.launch(launchOptions as any);
    try {
      return await this.renderUsingBrowser(browser, html);
    } finally {
      try {
        await browser.close();
      } catch {
        // ignore browser close failures
      }
    }
  }

  private async renderUsingBrowser(browser: any, html: string): Promise<Buffer> {
    let context: any = null;
    let page: any = null;

    try {
      context = await browser.newContext({
        ignoreHTTPSErrors: true,
        viewport: {
          width: this.viewportWidth,
          height: this.viewportHeight,
        },
      });

      page = await context.newPage();
      const setContentOptions =
        this.timeoutMs > 0
          ? {
              waitUntil: 'domcontentloaded' as const,
              timeout: this.timeoutMs,
            }
          : {
              waitUntil: 'domcontentloaded' as const,
            };

      await page.setContent(html, setContentOptions);
      await this.waitForPageImages(page);
      await page.evaluate(async (assetWaitTimeoutMs: number) => {
        const fonts = (document as any).fonts;
        if (fonts?.ready) {
          try {
            await Promise.race([
              fonts.ready,
              new Promise(resolve => window.setTimeout(resolve, assetWaitTimeoutMs)),
            ]);
          } catch {
            // ignore font loading errors and continue rendering
          }
        }
      }, this.assetWaitTimeoutMs);
      await page.emulateMedia({
        media: 'screen',
      });
      if (this.settleDelayMs > 0) {
        await page.waitForTimeout(this.settleDelayMs);
      }

      const pdf = await page.pdf({
        format: this.pageFormat,
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });

      return Buffer.from(pdf);
    } finally {
      if (page) {
        try {
          await page.close();
        } catch {
          // ignore page close failures
        }
      }

      if (context) {
        try {
          await context.close();
        } catch {
          // ignore context close failures
        }
      }
    }
  }

  private resolveLocalChromePath(): string {
    const envPath = String(process.env.REPORTS_PDF_LOCAL_CHROME_PATH || '').trim();
    const candidates = [
      envPath,
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ];

    for (const candidate of candidates) {
      if (!candidate) {
        continue;
      }

      if (existsSync(candidate)) {
        return candidate;
      }
    }

    return '';
  }

  private resolvePositiveInt(rawValue: string | undefined, fallback: number): number {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }

    return Math.floor(parsed);
  }

  private resolveNonNegativeInt(rawValue: string | undefined, fallback: number): number {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return fallback;
    }

    return Math.floor(parsed);
  }

  private async waitForPageImages(page: any): Promise<void> {
    await page.evaluate(
      async (assetWaitTimeoutMs: number) => {
        const images = Array.from(document.images || []);
        if (images.length === 0) {
          return;
        }

        const waitForImage = (img: HTMLImageElement): Promise<void> =>
          new Promise(resolve => {
            if (img.complete) {
              resolve();
              return;
            }

            const finish = () => resolve();
            const timeoutId = window.setTimeout(finish, assetWaitTimeoutMs);
            const done = () => {
              window.clearTimeout(timeoutId);
              finish();
            };
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
          });

        await Promise.all(images.map(waitForImage));
      },
      this.assetWaitTimeoutMs
    );
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    if (typeof error === 'string' && error.trim()) {
      return error;
    }
    return 'unknown_error';
  }
}
