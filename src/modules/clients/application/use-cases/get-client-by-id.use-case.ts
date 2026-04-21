import { GetClientByIdQuery } from '../dto/clients.commands';
import { ClientsRepository } from '../../domain/repositories';
import { Client } from '../../domain/entities';
import { ClientOwnershipService } from '../services/client-ownership.service';
import { NotFoundError } from '../errors';

export class GetClientByIdUseCase {
  constructor(
    private readonly clientsRepo: ClientsRepository,
    private readonly ownershipService: ClientOwnershipService
  ) {}

  async execute(query: GetClientByIdQuery): Promise<Client> {
    this.ownershipService.assertActorIdentity(query.actorUserId, query.actorUserRole);
    this.ownershipService.assertCanReadRealData(query.actorUserRole);

    const client = await this.clientsRepo.findById(query.clientId);
    if (!client) {
      throw new NotFoundError('Client not found');
    }

    this.ownershipService.assertCanAccessClient(
      query.actorUserRole,
      query.actorUserId,
      client.ownerUserId
    );

    return client;
  }
}

