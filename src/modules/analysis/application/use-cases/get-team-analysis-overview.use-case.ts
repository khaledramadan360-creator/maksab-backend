import { TeamAnalysisOverviewItem } from '../../domain/entities';
import { PaginatedResult } from '../../domain/repositories';
import { GetTeamAnalysisOverviewInput } from '../../domain/use-cases';
import { ClientAnalysisRepository } from '../../domain/repositories';
import { ClientAnalysisOwnershipService } from '../services/client-analysis-ownership.service';

export class GetTeamAnalysisOverviewUseCase {
  constructor(
    private readonly clientAnalysisRepo: ClientAnalysisRepository,
    private readonly ownershipService: ClientAnalysisOwnershipService
  ) {}

  async execute(input: GetTeamAnalysisOverviewInput): Promise<PaginatedResult<TeamAnalysisOverviewItem>> {
    this.ownershipService.assertActorIdentity(input.actorUserId, input.actorUserRole);
    this.ownershipService.assertCanViewTeamOverview(input.actorUserRole);

    const page = Math.max(1, input.pagination.page || 1);
    const pageSize = Math.max(1, Math.min(100, input.pagination.pageSize || 20));

    return this.clientAnalysisRepo.listTeamOverview(input.filters, { page, pageSize });
  }
}
