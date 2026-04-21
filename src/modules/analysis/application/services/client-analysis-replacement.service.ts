import { ClientAnalysisDetails, ClientAnalysisScreenshot } from '../../domain/entities';
import {
  ClientAnalysisCreateRecord,
  ClientAnalysisRepository,
  ClientAnalysisScreenshotCreateRecord,
  ClientAnalysisScreenshotRepository,
  AnalysisScreenshotStorageProviderContract,
  ClientPlatformAnalysisCreateRecord,
  ClientPlatformAnalysisRepository,
} from '../../domain/repositories';

export interface ReplaceAnalysisInput {
  clientId: string;
  analysis: ClientAnalysisCreateRecord;
  platformAnalyses: ClientPlatformAnalysisCreateRecord[];
  screenshots: ClientAnalysisScreenshotCreateRecord[];
}

export interface ReplaceAnalysisResult {
  details: ClientAnalysisDetails;
  replaced: boolean;
}

export class ClientAnalysisReplacementService {
  constructor(
    private readonly clientAnalysisRepo: ClientAnalysisRepository,
    private readonly clientPlatformAnalysisRepo: ClientPlatformAnalysisRepository,
    private readonly screenshotRepo: ClientAnalysisScreenshotRepository,
    private readonly screenshotStorageProvider: AnalysisScreenshotStorageProviderContract
  ) {}

  async replaceForClient(input: ReplaceAnalysisInput): Promise<ReplaceAnalysisResult> {
    const previous = await this.clientAnalysisRepo.findByClientId(input.clientId);
    const previousScreenshots = previous
      ? await this.safeLoadScreenshots(previous.id)
      : [];

    const analysis = await this.clientAnalysisRepo.replaceForClient(input.clientId, {
      analysis: input.analysis,
      platformAnalyses: input.platformAnalyses,
    });

    if (previous) {
      await this.safeDeleteScreenshotMetadata(previous.id);
    }

    if (input.screenshots.length > 0) {
      await this.safeSaveScreenshots(analysis.id, input.screenshots);
    }

    const stalePaths = previousScreenshots
      .map(item => item.supabasePath)
      .filter((item): item is string => !!item && item.trim() !== '');
    if (stalePaths.length > 0) {
      await this.safeDeleteStorageFiles(stalePaths);
    }

    const platformAnalyses = await this.clientPlatformAnalysisRepo.findByClientAnalysisId(analysis.id);
    const screenshots = await this.safeLoadScreenshots(analysis.id);

    return {
      details: {
        analysis,
        platformAnalyses,
        screenshots,
      },
      replaced: !!previous,
    };
  }

  private async safeLoadScreenshots(clientAnalysisId: string): Promise<ClientAnalysisScreenshot[]> {
    try {
      return await this.screenshotRepo.findByClientAnalysisId(clientAnalysisId);
    } catch {
      return [];
    }
  }

  private async safeDeleteScreenshotMetadata(clientAnalysisId: string): Promise<void> {
    try {
      await this.screenshotRepo.deleteByClientAnalysisId(clientAnalysisId);
    } catch {
      // screenshot metadata is non-blocking for analysis replacement.
    }
  }

  private async safeSaveScreenshots(
    clientAnalysisId: string,
    screenshots: ClientAnalysisScreenshotCreateRecord[]
  ): Promise<void> {
    try {
      await this.screenshotRepo.saveForAnalysis(clientAnalysisId, screenshots);
    } catch {
      // screenshot metadata is non-blocking for analysis replacement.
    }
  }

  private async safeDeleteStorageFiles(paths: string[]): Promise<void> {
    try {
      await this.screenshotStorageProvider.deleteAnalysisScreenshots(paths);
    } catch {
      // remote storage cleanup is best-effort only.
    }
  }
}
