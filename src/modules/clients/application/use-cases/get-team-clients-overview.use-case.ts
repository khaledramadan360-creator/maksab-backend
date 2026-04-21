import { TeamOverviewResult } from '../dto/clients.commands';
import { ClientsRepository } from '../../domain/repositories';
import { ClientOwnershipService } from '../services/client-ownership.service';

export interface GetTeamClientsOverviewQuery {
  actorUserId: string;
  actorUserRole: string;
}

export class GetTeamClientsOverviewUseCase {
  constructor(
    private readonly clientsRepo: ClientsRepository,
    private readonly ownershipService: ClientOwnershipService
  ) {}

  async execute(query: GetTeamClientsOverviewQuery): Promise<TeamOverviewResult> {
    this.ownershipService.assertActorIdentity(query.actorUserId, query.actorUserRole);
    this.ownershipService.assertCanReadRealData(query.actorUserRole);
    this.ownershipService.assertCanChangeOwner(query.actorUserRole); // manager/admin only

    return this.clientsRepo.getTeamOverview();
  }
}

