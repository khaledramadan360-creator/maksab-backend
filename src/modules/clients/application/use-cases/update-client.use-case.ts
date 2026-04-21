import { UpdateClientCommand } from '../dto/clients.commands';
import { AuditLogRepository, ClientsRepository } from '../../domain/repositories';
import { AuditAction } from '../../domain/enums';
import { ClientLinkPolicyService } from '../services/client-link-policy.service';
import { ClientOwnershipService } from '../services/client-ownership.service';
import { NotFoundError, ValidationError } from '../errors';
import { Client } from '../../domain/entities';

export class UpdateClientUseCase {
  constructor(
    private readonly clientsRepo: ClientsRepository,
    private readonly auditRepo: AuditLogRepository,
    private readonly ownershipService: ClientOwnershipService,
    private readonly linkPolicy: ClientLinkPolicyService
  ) {}

  async execute(command: UpdateClientCommand): Promise<Client> {
    this.ownershipService.assertActorIdentity(command.actorUserId, command.actorUserRole);
    this.ownershipService.assertCanReadRealData(command.actorUserRole);

    const current = await this.clientsRepo.findById(command.clientId);
    if (!current) {
      throw new NotFoundError('Client not found');
    }

    this.ownershipService.assertCanAccessClient(
      command.actorUserRole,
      command.actorUserId,
      current.ownerUserId
    );

    const mergedLinks = {
      ...current.links,
      ...(command.links ? this.linkPolicy.normalizeLinks(command.links) : {}),
    };
    const effectivePrimaryPlatform = command.primaryPlatform || current.primaryPlatform;
    this.linkPolicy.assertPrimaryLinkExists(effectivePrimaryPlatform, mergedLinks);

    if (command.sourceUrl !== undefined) {
      this.linkPolicy.assertRequiredSourceLink(command.sourceUrl);
    }

    const updated = await this.clientsRepo.update(command.clientId, {
      name: command.name?.trim(),
      clientType: command.clientType,
      mobile: command.mobile?.trim() || (command.mobile === null ? null : undefined),
      whatsapp: command.whatsapp?.trim() || (command.whatsapp === null ? null : undefined),
      email: command.email?.trim().toLowerCase() || (command.email === null ? null : undefined),
      saudiCity: command.saudiCity?.trim(),
      notes: command.notes?.trim() || (command.notes === null ? null : undefined),
      primaryPlatform: command.primaryPlatform,
      sourceUrl: command.sourceUrl?.trim(),
      links: command.links ? mergedLinks : undefined,
    });

    await this.auditRepo.createAuditLog({
      actorUserId: command.actorUserId,
      action: AuditAction.ClientUpdated,
      entityType: 'client',
      entityId: updated.id,
      metadata: {
        changedFields: this.extractChangedFields(command),
      },
    });

    if (command.links) {
      await this.auditRepo.createAuditLog({
        actorUserId: command.actorUserId,
        action: AuditAction.ClientLinkUpdated,
        entityType: 'client',
        entityId: updated.id,
        metadata: {
          links: updated.links,
          reason: 'update-client-links',
        },
      });
    }

    return updated;
  }

  private extractChangedFields(command: UpdateClientCommand): string[] {
    const entries = Object.entries(command).filter(([key, value]) => {
      if (['actorUserId', 'actorUserRole', 'clientId'].includes(key)) {
        return false;
      }

      return value !== undefined;
    });

    return entries.map(([key]) => key);
  }
}

