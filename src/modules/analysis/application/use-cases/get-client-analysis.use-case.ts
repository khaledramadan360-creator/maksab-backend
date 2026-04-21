import { ClientAnalysisDetails } from '../../domain/entities';
import {
  ClientAnalysisRepository,
  ClientAnalysisScreenshotRepository,
  ClientPlatformAnalysisRepository,
  ClientsLookupRepository,
} from '../../domain/repositories';
import { GetClientAnalysisInput } from '../../domain/use-cases';
import { NotFoundError } from '../errors';
import { ClientAnalysisOwnershipService } from '../services/client-analysis-ownership.service';

export class GetClientAnalysisUseCase {
  constructor(
    private readonly clientsLookupRepo: ClientsLookupRepository,
    private readonly clientAnalysisRepo: ClientAnalysisRepository,
    private readonly clientPlatformAnalysisRepo: ClientPlatformAnalysisRepository,
    private readonly screenshotRepo: ClientAnalysisScreenshotRepository,
    private readonly ownershipService: ClientAnalysisOwnershipService
  ) {}

  async execute(input: GetClientAnalysisInput): Promise<ClientAnalysisDetails | null> {
    this.ownershipService.assertActorIdentity(input.actorUserId, input.actorUserRole);
    this.ownershipService.assertCanReadAnalysis(input.actorUserRole);

    const client = await this.clientsLookupRepo.findClientForAnalysis(input.clientId);
    if (!client) {
      throw new NotFoundError('Client not found');
    }

    this.ownershipService.assertCanAccessClient(
      input.actorUserRole,
      input.actorUserId,
      client.ownerUserId
    );

    const analysis = await this.clientAnalysisRepo.findByClientId(input.clientId);
    if (!analysis) {
      return null;
    }

    const platformAnalyses = await this.clientPlatformAnalysisRepo.findByClientAnalysisId(analysis.id);
    const screenshots = await this.safeLoadScreenshots(analysis.id);

    return {
      analysis,
      platformAnalyses,
      screenshots,
    };
  }

  private async safeLoadScreenshots(clientAnalysisId: string) {
    try {
      return await this.screenshotRepo.findByClientAnalysisId(clientAnalysisId);
    } catch {
      return [];
    }
  }
}
