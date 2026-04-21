import { SearchRequest, LeadSearchOutput } from '../../../domain/entities';
import { SupportedSaudiCity } from '../../../domain/enums';
import { LeadSearchPolicy } from '../../../domain/policy';
import { PlatformSearchOrchestrator } from '../../services/platform-search-orchestrator.service';
import { SearchOutputMapper } from '../../mappers/search-output.mapper';
import { AuditLogRepository } from '../../../../auth/domain/repositories';
import { AuditAction } from '../../../../auth/domain/enums';

export class SearchLeadsUseCase {
  constructor(
    private readonly orchestrator: PlatformSearchOrchestrator,
    private readonly outputMapper: SearchOutputMapper,
    private readonly auditRepo: AuditLogRepository
  ) {}

  public async execute(rawRequest: SearchRequest): Promise<LeadSearchOutput> {
    const request: SearchRequest = {
      ...rawRequest,
      country: rawRequest.country || 'SA',
      saudiCity: rawRequest.saudiCity || SupportedSaudiCity.RIYADH,
    };

    if (!request.platforms || request.platforms.length === 0) {
      throw new Error('At least one platform must be selected.');
    }

    const platformResults = await this.orchestrator.execute(request);
    const output = this.outputMapper.map(request, platformResults);
    await this.recordAudit(request, output);
    return output;
  }

  private async recordAudit(request: SearchRequest, output: LeadSearchOutput): Promise<void> {
    const returnedCountsByPlatform = Object.fromEntries(
      Object.entries(output.platformResults).map(([platform, result]) => [platform, result.returnedCount])
    );
    const totalReturnedCount = Object.values(output.platformResults).reduce(
      (total, result) => total + result.returnedCount,
      0
    );
    const hadWarnings = Object.values(output.platformResults).some(result => !!result.warning && result.warning.trim() !== '');
    const executedAt = new Date().toISOString();

    try {
      await this.auditRepo.create({
        actorUserId: request.actorUserId || null,
        action: AuditAction.LeadSearchExecuted,
        entityType: 'lead_search',
        entityId: `lead-search:${request.actorUserId || 'anonymous'}:${Date.now()}`,
        metadata: {
          role: request.actorUserRole ?? null,
          permission: LeadSearchPolicy.LEAD_SEARCH_EXECUTE_PERMISSION,
          keyword: request.keyword,
          saudiCity: request.saudiCity,
          platforms: request.platforms,
          requestedResultsCount: request.requestedResultsCount,
          returnedCountsByPlatform,
          totalReturnedCount,
          hadWarnings,
          executedAt,
        },
      });
    } catch (error: any) {
      console.error('[LeadSearch Audit] Failed to store lead.search.executed log:', error?.message || error);
    }
  }
}
