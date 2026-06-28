import { BulkCreateClientsCommand, BulkCreateClientsResult, BulkCreateClientResultItem } from '../dto/clients.commands';
import { ClientDuplicateCheckService } from '../services/client-duplicate-check.service';
import { ClientLinkPolicyService } from '../services/client-link-policy.service';
import { ClientOwnershipService } from '../services/client-ownership.service';
import { ClientStatusPolicyService } from '../services/client-status-policy.service';
import { DuplicateConflictError, ValidationError } from '../errors';
import { AuditLogRepository, ClientsRepository, UsersLookupRepository } from '../../domain/repositories';
import { AuditAction } from '../../domain/enums';

export class BulkCreateClientsUseCase {
  constructor(
    private readonly clientsRepo: ClientsRepository,
    private readonly usersLookupRepo: UsersLookupRepository,
    private readonly auditRepo: AuditLogRepository,
    private readonly duplicateService: ClientDuplicateCheckService,
    private readonly ownershipService: ClientOwnershipService,
    private readonly statusPolicy: ClientStatusPolicyService,
    private readonly linkPolicy: ClientLinkPolicyService
  ) {}

  async execute(command: BulkCreateClientsCommand): Promise<BulkCreateClientsResult> {
    this.ownershipService.assertActorIdentity(command.actorUserId, command.actorUserRole);
    this.ownershipService.assertCanCreate(command.actorUserRole);

    const actorCanOwnClients = await this.usersLookupRepo.canOwnClients(command.actorUserId);
    if (!actorCanOwnClients) {
      throw new ValidationError('Actor is not eligible to own clients');
    }

    const results: BulkCreateClientResultItem[] = [];
    let createdCount = 0;
    let failedCount = 0;

    for (let i = 0; i < command.clients.length; i++) {
      const clientInput = command.clients[i];
      const inputSnapshot = {
        name: clientInput?.name,
        email: clientInput?.email,
        mobile: clientInput?.mobile,
      };

      try {
        this.assertRequiredFields(clientInput);

        const sourceUrl = (clientInput.sourceUrl || '').trim();
        this.linkPolicy.assertRequiredSourceLink(sourceUrl);

        const normalizedLinks = this.linkPolicy.normalizeLinks(clientInput.links);
        const links = this.linkPolicy.applySourceLinkToPlatform(
          normalizedLinks,
          clientInput.sourcePlatform,
          sourceUrl
        );
        this.linkPolicy.assertPrimaryLinkExists(clientInput.primaryPlatform, links);

        const duplicateProbe = await this.duplicateService.check({
          mobile: clientInput.mobile,
          email: clientInput.email,
          sourceUrl,
          primaryPlatform: clientInput.primaryPlatform,
          links,
        });

        const forceCreate = command.forceCreateIfDuplicate ?? clientInput.forceCreateIfDuplicate ?? false;

        if (duplicateProbe.result.isDuplicate) {
          await this.auditRepo.createAuditLog({
            actorUserId: command.actorUserId,
            action: AuditAction.ClientDuplicateDetected,
            entityType: 'client',
            entityId: duplicateProbe.result.matchedClientId || 'duplicate-check',
            metadata: {
              flow: 'bulkCreateClient',
              rowIndex: i,
              matches: duplicateProbe.matches,
              decision: forceCreate ? 'force-create' : 'blocked',
            },
          });

          if (!forceCreate) {
            throw new DuplicateConflictError(duplicateProbe.result);
          }
        }

        const client = await this.clientsRepo.create({
          name: clientInput.name.trim(),
          clientType: clientInput.clientType,
          mobile: clientInput.mobile?.trim() || null,
          whatsapp: clientInput.whatsapp?.trim() || null,
          email: clientInput.email?.trim().toLowerCase() || null,
          saudiCity: clientInput.saudiCity.trim(),
          notes: clientInput.notes?.trim() || null,
          primaryPlatform: clientInput.primaryPlatform,
          status: this.statusPolicy.getDefaultStatus(),
          sourceModule: clientInput.sourceModule,
          sourcePlatform: clientInput.sourcePlatform,
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
            flow: 'bulkCreateClient',
            rowIndex: i,
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
              flow: 'bulkCreateClient',
              rowIndex: i,
              links: client.links,
              reason: 'initial-links-on-create',
            },
          });
        }

        results.push({
          rowIndex: i,
          status: 'created',
          client,
          duplicateWarning: duplicateProbe.result.isDuplicate ? duplicateProbe.result : null,
          inputSnapshot,
        });
        createdCount++;
      } catch (error: any) {
        failedCount++;
        let errorCode = 'INTERNAL_ERROR';
        let errorMessage = error?.message || 'An unexpected error occurred';
        let errorField: string | null = null;

        if (error instanceof DuplicateConflictError) {
          errorCode = 'DUPLICATE_CLIENT';
          errorMessage = 'عميل مكرر: تم العثور على عميل بنفس رقم الموبايل أو البريد الإلكتروني أو روابط الحسابات';
          if (error.duplicate.matchedBy) {
            errorField = error.duplicate.matchedBy === 'website_domain' ? 'website' : error.duplicate.matchedBy;
          }
        } else if (error instanceof ValidationError) {
          errorCode = 'VALIDATION_FAILED';
          errorMessage = error.message;
        }

        results.push({
          rowIndex: i,
          status: 'failed',
          error: {
            code: errorCode,
            message: errorMessage,
            ...(errorField ? { field: errorField } : {}),
          },
          inputSnapshot,
        });
      }
    }

    return {
      summary: {
        total: command.clients.length,
        created: createdCount,
        failed: failedCount,
      },
      results,
    };
  }

  private assertRequiredFields(client: any): void {
    if (!client.name || client.name.trim() === '') {
      throw new ValidationError('Client name is required');
    }

    if (!client.saudiCity || client.saudiCity.trim() === '') {
      throw new ValidationError('Saudi city is required');
    }

    if (!client.primaryPlatform) {
      throw new ValidationError('Primary platform is required');
    }

    if (!client.sourcePlatform) {
      throw new ValidationError('Source platform is required');
    }
  }

  private hasAnyLinks(links: Record<string, string | null>): boolean {
    return Object.values(links).some(value => !!value && value.trim() !== '');
  }
}
