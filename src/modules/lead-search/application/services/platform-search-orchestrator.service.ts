import { SearchOrchestrator, PlatformSearchService } from '../../domain/repositories';
import { SearchRequest, PlatformSearchResult } from '../../domain/entities';
import { SearchPlatform } from '../../domain/enums';

export class PlatformSearchOrchestrator implements SearchOrchestrator {
  private readonly registry: Map<SearchPlatform, PlatformSearchService>;
  private readonly genericInsufficientWarning = 'Insufficient valid results after exhausting search attempts.';
  private readonly providerFailureWarning =
    'Search provider failed while collecting results. Verify Bright Data settings and try again.';

  constructor() {
    this.registry = new Map<SearchPlatform, PlatformSearchService>();
  }

  /**
   * Registers a platform service into the orchestrator registry.
   */
  public registerService(platform: SearchPlatform, service: PlatformSearchService): void {
    this.registry.set(platform, service);
  }

  /**
   * Coordinates search execution across all user-selected platforms sequentially.
   * Isolates failures so one crashing platform doesn't abort the entire search process.
   */
  public async execute(request: SearchRequest): Promise<PlatformSearchResult[]> {
    // Ensure we don't accidentally run the same platform twice if caller duplicates it
    const uniquePlatforms = Array.from(new Set(request.platforms));
    return Promise.all(uniquePlatforms.map(platform => this.executeSinglePlatform(platform, request)));
  }

  private normalizePlatformResult(result: PlatformSearchResult): PlatformSearchResult {
    const sanitizedWarning = this.sanitizeUserWarning(result.warning);

    if (result.returnedCount >= result.requestedCount) {
      return {
        ...result,
        warning: sanitizedWarning,
      };
    }

    if (sanitizedWarning && sanitizedWarning.trim() !== '') {
      return {
        ...result,
        warning: sanitizedWarning,
      };
    }

    return {
      ...result,
      warning: this.genericInsufficientWarning,
    };
  }

  private async executeSinglePlatform(
    platform: SearchPlatform,
    request: SearchRequest
  ): Promise<PlatformSearchResult> {
    const service = this.registry.get(platform);

    if (!service) {
      return {
        platform,
        requestedCount: request.requestedResultsCount,
        returnedCount: 0,
        warning: `Platform is not currently supported or registered: ${platform}.`,
        results: []
      };
    }

    try {
      const platformResult = await service.search(request);

      return this.normalizePlatformResult(platformResult);
    } catch (error: any) {
      console.error(`[Orchestrator Fatal] Platform '${platform}' broke down:`, error.message);

      return {
        platform,
        requestedCount: request.requestedResultsCount,
        returnedCount: 0,
        warning: this.providerFailureWarning,
        results: []
      };
    }
  }

  private sanitizeUserWarning(warning?: string): string | undefined {
    if (!warning || warning.trim() === '') {
      return warning;
    }

    const normalizedWarning = warning.toLowerCase();
    const hasTechnicalTimeoutOrProviderMessage =
      normalizedWarning.includes('fatal platform service error') ||
      normalizedWarning.includes('timed out after') ||
      normalizedWarning.includes('request timeout') ||
      normalizedWarning.includes('provider error on query');

    if (hasTechnicalTimeoutOrProviderMessage) {
      return this.providerFailureWarning;
    }

    return warning;
  }
}
