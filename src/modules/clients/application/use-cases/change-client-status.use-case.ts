import { ChangeClientStatusCommand } from '../dto/clients.commands';
import { AuditLogRepository, ClientsRepository } from '../../domain/repositories';
import { AuditAction } from '../../domain/enums';
import { Client } from '../../domain/entities';
import { ClientOwnershipService } from '../services/client-ownership.service';
import { ClientStatusPolicyService } from '../services/client-status-policy.service';
import { NotFoundError } from '../errors';

export class ChangeClientStatusUseCase {
  constructor(
    private readonly clientsRepo: ClientsRepository,
    private readonly auditRepo: AuditLogRepository,
    private readonly ownershipService: ClientOwnershipService,
    private readonly statusPolicy: ClientStatusPolicyService
  ) {}

  async execute(command: ChangeClientStatusCommand): Promise<Client> {
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

    this.statusPolicy.assertCanChangeStatus(client.status, command.status);

    const updated = await this.clientsRepo.changeStatus(client.id, command.status);

    await this.auditRepo.createAuditLog({
      actorUserId: command.actorUserId,
      action: AuditAction.ClientStatusChanged,
      entityType: 'client',
      entityId: client.id,
      metadata: {
        from: client.status,
        to: command.status,
      },
    });

    return updated;
  }
}

