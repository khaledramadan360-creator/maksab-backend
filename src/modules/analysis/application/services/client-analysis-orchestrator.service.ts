import { AnalysisResultPayload, ScrapedPlatformInput } from '../../domain/entities';
import {
  AnalysisAiProviderContract,
  AnalyzeClientDataInput,
  ClientAnalysisScreenshotCreateRecord,
  ClientForAnalysisLookup,
  ClientScrapingProviderContract,
  PlatformScreenshotProviderContract,
  AnalysisScreenshotStorageProviderContract,
  WebsitePageSpeedProviderContract,
  WebsitePageSpeedResult,
} from '../../domain/repositories';
import { AnalysisScreenshotStatus, AnalysisSourcePlatform } from '../../domain/enums';
import { ScrapedDataNormalizationService } from './scraped-data-normalization.service';
import { ProviderError, ValidationError } from '../errors';

export interface OrchestratedAnalysisResult {
  platformLinks: Partial<Record<AnalysisSourcePlatform, string>>;
  scrapedPlatforms: ScrapedPlatformInput[];
  screenshots: ClientAnalysisScreenshotCreateRecord[];
  websitePageSpeed: WebsitePageSpeedResult | null;
  normalizedScrapedPlatforms: ScrapedPlatformInput[];
  analysisPayload: AnalysisResultPayload;
}

export class ClientAnalysisOrchestratorService {
  constructor(
    private readonly scrapingProvider: ClientScrapingProviderContract,
    private readonly screenshotProvider: PlatformScreenshotProviderContract,
    private readonly screenshotStorageProvider: AnalysisScreenshotStorageProviderContract,
    private readonly websitePageSpeedProvider: WebsitePageSpeedProviderContract,
    private readonly normalizationService: ScrapedDataNormalizationService,
    private readonly analysisAiProvider: AnalysisAiProviderContract
  ) {}

  extractValidPlatformLinks(
    links: {
      websiteUrl?: string | null;
      facebookUrl?: string | null;
      instagramUrl?: string | null;
      snapchatUrl?: string | null;
      linkedinUrl?: string | null;
      xUrl?: string | null;
      tiktokUrl?: string | null;
    }
  ): Partial<Record<AnalysisSourcePlatform, string>> {
    const map: Partial<Record<AnalysisSourcePlatform, string>> = {};
    const maybePush = (platform: AnalysisSourcePlatform, value?: string | null) => {
      if (!value) {
        return;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }
      map[platform] = trimmed;
    };

    maybePush(AnalysisSourcePlatform.Website, links.websiteUrl);
    maybePush(AnalysisSourcePlatform.Facebook, links.facebookUrl);
    maybePush(AnalysisSourcePlatform.Instagram, links.instagramUrl);
    maybePush(AnalysisSourcePlatform.Snapchat, links.snapchatUrl);
    maybePush(AnalysisSourcePlatform.Linkedin, links.linkedinUrl);
    maybePush(AnalysisSourcePlatform.X, links.xUrl);
    maybePush(AnalysisSourcePlatform.Tiktok, links.tiktokUrl);

    return map;
  }

  async execute(client: ClientForAnalysisLookup): Promise<OrchestratedAnalysisResult> {
    const platformLinks = this.extractValidPlatformLinks(client.links);
    if (Object.keys(platformLinks).length === 0) {
      throw new ValidationError('Cannot run analysis because client has no valid saved platform links');
    }

    let scrapedPlatforms: ScrapedPlatformInput[];
    try {
      scrapedPlatforms = await this.scrapingProvider.scrapeClientPlatforms({
        clientId: client.id,
        platformLinks,
      });
    } catch (error: any) {
      throw new ProviderError(`Scraping provider failed: ${error?.message || 'Unknown error'}`);
    }

    const screenshots = await this.captureAndUploadScreenshots(client.id, platformLinks);

    const websiteUrl = platformLinks[AnalysisSourcePlatform.Website] || null;
    let websitePageSpeed: WebsitePageSpeedResult | null = null;
    if (websiteUrl) {
      try {
        websitePageSpeed = await this.websitePageSpeedProvider.analyzeWebsite(websiteUrl);
      } catch {
        websitePageSpeed = null;
      }
    }

    const normalizedScrapedPlatforms = this.normalizationService.normalize(scrapedPlatforms, {
      websitePageSpeed,
    });
    if (normalizedScrapedPlatforms.length === 0) {
      throw new ValidationError('No usable scraped data was extracted from client saved links');
    }

    const aiInput: AnalyzeClientDataInput = {
      clientId: client.id,
      clientName: client.name,
      saudiCity: client.saudiCity,
      scrapedPlatforms: normalizedScrapedPlatforms,
    };

    let analysisPayload: AnalysisResultPayload;
    try {
      analysisPayload = await this.analysisAiProvider.analyzeClientData(aiInput);
    } catch (error: any) {
      throw new ProviderError(`AI analysis provider failed: ${error?.message || 'Unknown error'}`);
    }

    return {
      platformLinks,
      scrapedPlatforms,
      screenshots,
      websitePageSpeed,
      normalizedScrapedPlatforms,
      analysisPayload,
    };
  }

  private async captureAndUploadScreenshots(
    clientId: string,
    platformLinks: Partial<Record<AnalysisSourcePlatform, string>>
  ): Promise<ClientAnalysisScreenshotCreateRecord[]> {
    const runKey = new Date().toISOString().replace(/[:.]/g, '-');
    const entries = Object.entries(platformLinks).filter(
      ([, value]) => typeof value === 'string' && value.trim() !== ''
    ) as Array<[AnalysisSourcePlatform, string]>;

    if (entries.length === 0) {
      return [];
    }

    const results = await Promise.all(
      entries.map(async ([platform, platformUrl]): Promise<ClientAnalysisScreenshotCreateRecord | null> => {
        const normalizedUrl = platformUrl.trim();
        if (!normalizedUrl) {
          return null;
        }

        try {
          const captured = await this.screenshotProvider.capturePlatformScreenshot(platform, normalizedUrl);
          const storagePath = this.buildScreenshotStoragePath(
            clientId,
            runKey,
            platform,
            captured.fileExtension
          );
          const uploaded = await this.screenshotStorageProvider.uploadScreenshot({
            path: storagePath,
            contentType: captured.contentType,
            data: captured.data,
          });

          return {
            platform,
            platformUrl: normalizedUrl,
            supabasePath: uploaded.path,
            publicUrl: uploaded.publicUrl,
            captureStatus: AnalysisScreenshotStatus.Captured,
            capturedAt: captured.capturedAt,
          };
        } catch {
          return {
            platform,
            platformUrl: normalizedUrl,
            supabasePath: null,
            publicUrl: null,
            captureStatus: AnalysisScreenshotStatus.Failed,
            capturedAt: null,
          };
        }
      })
    );

    return results.filter((item): item is ClientAnalysisScreenshotCreateRecord => item !== null);
  }

  private buildScreenshotStoragePath(
    clientId: string,
    runKey: string,
    platform: AnalysisSourcePlatform,
    extension: string
  ): string {
    const safeExt = (extension || 'png').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'png';
    return `${clientId}/${runKey}/${platform}.${safeExt}`;
  }
}
