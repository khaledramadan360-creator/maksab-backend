import { ChangeClientOwnerCommand } from '../dto/clients.commands';
import { AuditLogRepository, ClientsRepository, UsersLookupRepository } from '../../domain/repositories';
import { AuditAction } from '../../domain/enums';
import { Client } from '../../domain/entities';
import { ClientOwnershipService } from '../services/client-ownership.service';
import { NotFoundError, ValidationError } from '../errors';

export class ChangeClientOwnerUseCase {
  constructor(
    private readonly clientsRepo: ClientsRepository,
    private readonly usersLookupRepo: UsersLookupRepository,
    private readonly auditRepo: AuditLogRepository,
    private readonly ownershipService: ClientOwnershipService
  ) {}

  async execute(command: ChangeClientOwnerCommand): Promise<Client> {
    this.ownershipService.assertActorIdentity(command.actorUserId, command.actorUserRole);
    this.ownershipService.assertCanReadRealData(command.actorUserRole);
    this.ownershipService.assertCanChangeOwner(command.actorUserRole);

    const client = await this.clientsRepo.findById(command.clientId);
    if (!client) {
      throw new NotFoundError('Client not found');
    }

    if (!command.newOwnerUserId || command.newOwnerUserId.trim() === '') {
      throw new ValidationError('New owner user id is required');
    }

    const exists = await this.usersLookupRepo.existsById(command.newOwnerUserId);
    if (!exists) {
      throw new ValidationError('New owner user does not exist');
    }

    const canOwn = await this.usersLookupRepo.canOwnClients(command.newOwnerUserId);
    if (!canOwn) {
      throw new ValidationError('New owner user cannot own clients');
    }

    const oldOwnerUserId = client.ownerUserId;
    const updated = await this.clientsRepo.changeOwner(client.id, command.newOwnerUserId);

    await this.auditRepo.createAuditLog({
      actorUserId: command.actorUserId,
      action: AuditAction.ClientOwnerChanged,
      entityType: 'client',
      entityId: client.id,
      metadata: {
        from: oldOwnerUserId,
        to: command.newOwnerUserId,
      },
    });

    return updated;
  }
}

