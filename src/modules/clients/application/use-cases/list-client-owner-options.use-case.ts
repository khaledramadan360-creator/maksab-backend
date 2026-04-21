import { ListClientOwnerOptionsQuery, ListClientOwnerOptionsResult } from '../dto/clients.commands';
import { UsersLookupRepository } from '../../domain/repositories';
import { ClientOwnershipService } from '../services/client-ownership.service';

export class ListClientOwnerOptionsUseCase {
  constructor(
    private readonly usersLookupRepo: UsersLookupRepository,
    private readonly ownershipService: ClientOwnershipService
  ) {}

  async execute(query: ListClientOwnerOptionsQuery): Promise<ListClientOwnerOptionsResult> {
    this.ownershipService.assertActorIdentity(query.actorUserId, query.actorUserRole);
    this.ownershipService.assertCanChangeOwner(query.actorUserRole);

    return this.usersLookupRepo.listAssignableOwners(query.keyword, query.limit);
  }
}

