import { ListClientsQuery, ListClientsResult } from '../dto/clients.commands';
import { ClientsRepository } from '../../domain/repositories';
import { ClientOwnershipService } from '../services/client-ownership.service';

export class ListClientsUseCase {
  constructor(
    private readonly clientsRepo: ClientsRepository,
    private readonly ownershipService: ClientOwnershipService
  ) {}

  async execute(query: ListClientsQuery): Promise<ListClientsResult> {
    this.ownershipService.assertActorIdentity(query.actorUserId, query.actorUserRole);
    this.ownershipService.assertCanReadRealData(query.actorUserRole);

    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));

    const ownerUserId = this.ownershipService.resolveOwnerFilter(
      query.actorUserRole,
      query.actorUserId,
      query.filters.ownerUserId
    );

    return this.clientsRepo.list(
      {
        ...query.filters,
        ownerUserId,
      },
      { page, pageSize }
    );
  }
}

