import { DeleteClientCommand } from '../dto/clients.commands';
import { AuditLogRepository, ClientsRepository } from '../../domain/repositories';
import { AuditAction } from '../../domain/enums';
import { ClientOwnershipService } from '../services/client-ownership.service';
import { NotFoundError } from '../errors';

export class DeleteClientUseCase {
  constructor(
    private readonly clientsRepo: ClientsRepository,
    private readonly auditRepo: AuditLogRepository,
    private readonly ownershipService: ClientOwnershipService
  ) {}

  async execute(command: DeleteClientCommand): Promise<void> {
    this.ownershipService.assertActorIdentity(command.actorUserId, command.actorUserRole);
    this.ownershipService.assertCanReadRealData(command.actorUserRole);

    const client = await this.clientsRepo.findById(command.clientId);
    if (!client) {
      throw new NotFoundError('Client not found');
    }

    this.ownershipService.assertCanAccessClient(
      command.actorUserRole,
      command.actorUserId,
      client.ownerUserId
    );

    await this.auditRepo.createAuditLog({
      actorUserId: command.actorUserId,
      action: AuditAction.ClientDeleted,
      entityType: 'client',
      entityId: client.id,
      metadata: {
        name: client.name,
        ownerUserId: client.ownerUserId,
      },
    });

    await this.clientsRepo.delete(client.id);
  }
}

