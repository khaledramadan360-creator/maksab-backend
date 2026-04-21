import { CreateClientCommand, CreateClientResult } from '../dto/clients.commands';
import { ClientDuplicateCheckService } from '../services/client-duplicate-check.service';
import { ClientLinkPolicyService } from '../services/client-link-policy.service';
import { ClientOwnershipService } from '../services/client-ownership.service';
import { ClientStatusPolicyService } from '../services/client-status-policy.service';
import { DuplicateConflictError, ValidationError } from '../errors';
import { AuditLogRepository, ClientsRepository, UsersLookupRepository } from '../../domain/repositories';
import { AuditAction } from '../../domain/enums';

export class CreateClientUseCase {
  constructor(
    private readonly clientsRepo: ClientsRepository,
    private readonly usersLookupRepo: UsersLookupRepository,
    private readonly auditRepo: AuditLogRepository,
    private readonly duplicateService: ClientDuplicateCheckService,
    private readonly ownershipService: ClientOwnershipService,
    private readonly statusPolicy: ClientStatusPolicyService,
    private readonly linkPolicy: ClientLinkPolicyService
  ) {}

  async execute(command: CreateClientCommand): Promise<CreateClientResult> {
    this.ownershipService.assertActorIdentity(command.actorUserId, command.actorUserRole);
    this.ownershipService.assertCanCreate(command.actorUserRole);
    this.assertRequiredFields(command);

    const actorCanOwnClients = await this.usersLookupRepo.canOwnClients(command.actorUserId);
    if (!actorCanOwnClients) {
      throw new ValidationError('Actor is not eligible to own clients');
    }

    const sourceUrl = command.sourceUrl.trim();
    this.linkPolicy.assertRequiredSourceLink(sourceUrl);

    const normalizedLinks = this.linkPolicy.normalizeLinks(command.links);
    const links = this.linkPolicy.applySourceLinkToPlatform(
      normalizedLinks,
      command.sourcePlatform,
      sourceUrl
    );
    this.linkPolicy.assertPrimaryLinkExists(command.primaryPlatform, links);

    const duplicateProbe = await this.duplicateService.check({
      mobile: command.mobile,
      email: command.email,
      sourceUrl,
      primaryPlatform: command.primaryPlatform,
      links,
    });

    if (duplicateProbe.result.isDuplicate) {
      await this.auditRepo.createAuditLog({
        actorUserId: command.actorUserId,
        action: AuditAction.ClientDuplicateDetected,
        entityType: 'client',
        entityId: duplicateProbe.result.matchedClientId || 'duplicate-check',
        metadata: {
          flow: 'createClient',
          matches: duplicateProbe.matches,
          decision: command.forceCreateIfDuplicate ? 'force-create' : 'blocked',
        },
      });

      if (!command.forceCreateIfDuplicate) {
        throw new DuplicateConflictError(duplicateProbe.result);
      }
    }

    const client = await this.clientsRepo.create({
      name: command.name.trim(),
      clientType: command.clientType,
      mobile: command.mobile?.trim() || null,
      whatsapp: command.whatsapp?.trim() || null,
      email: command.email?.trim().toLowerCase() || null,
      saudiCity: command.saudiCity.trim(),
      notes: command.notes?.trim() || null,
      primaryPlatform: command.primaryPlatform,
      status: this.statusPolicy.getDefaultStatus(),
      sourceModule: command.sourceModule,
      sourcePlatform: command.sourcePlatform,
      sourceUrl,
      links,
      ownerUserId: command.actorUserId,
    });

    await this.auditRepo.createAuditLog({
      actorUserId: command.actorUserId,
      action: AuditAction.ClientCreated,
      entityType: 'client',
      entityId: client.id,
      metadata: {
        status: client.status,
        sourceModule: client.sourceModule,
        sourcePlatform: client.sourcePlatform,
        ownerUserId: client.ownerUserId,
      },
    });

    if (this.hasAnyLinks(client.links)) {
      await this.auditRepo.createAuditLog({
        actorUserId: command.actorUserId,
        action: AuditAction.ClientLinkUpdated,
        entityType: 'client',
        entityId: client.id,
        metadata: {
          links: client.links,
          reason: 'initial-links-on-create',
        },
      });
    }

    return {
      client,
      duplicateWarning: duplicateProbe.result.isDuplicate ? duplicateProbe.result : undefined,
    };
  }

  private assertRequiredFields(command: CreateClientCommand): void {
    if (!command.name || command.name.trim() === '') {
      throw new ValidationError('Client name is required');
    }

    if (!command.saudiCity || command.saudiCity.trim() === '') {
      throw new ValidationError('Saudi city is required');
    }

    if (!command.primaryPlatform) {
      throw new ValidationError('Primary platform is required');
    }

    if (!command.sourcePlatform) {
      throw new ValidationError('Source platform is required');
    }
  }

  private hasAnyLinks(links: Record<string, string | null>): boolean {
    return Object.values(links).some(value => !!value && value.trim() !== '');
  }
}

