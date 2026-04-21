import { AuditAction } from '../../domain/enums';
import {
  AnalysisScreenshotStorageProviderContract,
  AuditLogRepository,
  ClientAnalysisRepository,
  ClientAnalysisScreenshotRepository,
  ClientsLookupRepository,
} from '../../domain/repositories';
import { DeleteClientAnalysisInput } from '../../domain/use-cases';
import { NotFoundError } from '../errors';
import { ClientAnalysisOwnershipService } from '../services/client-analysis-ownership.service';

export class DeleteClientAnalysisUseCase {
  constructor(
    private readonly clientsLookupRepo: ClientsLookupRepository,
    private readonly clientAnalysisRepo: ClientAnalysisRepository,
    private readonly screenshotRepo: ClientAnalysisScreenshotRepository,
    private readonly screenshotStorageProvider: AnalysisScreenshotStorageProviderContract,
    private readonly ownershipService: ClientAnalysisOwnershipService,
    private readonly auditRepo: AuditLogRepository
  ) {}

  async execute(input: DeleteClientAnalysisInput): Promise<void> {
    this.ownershipService.assertActorIdentity(input.actorUserId, input.actorUserRole);
    this.ownershipService.assertCanDeleteAnalysis(input.actorUserRole);

    const client = await this.clientsLookupRepo.findClientForAnalysis(input.clientId);
    if (!client) {
      throw new NotFoundError('Client not found');
    }

    const current = await this.clientAnalysisRepo.findByClientId(input.clientId);
    if (!current) {
      return;
    }

    const screenshots = await this.safeLoadScreenshots(current.id);
    const screenshotPaths = screenshots
      .map(item => item.supabasePath)
      .filter((item): item is string => !!item && item.trim() !== '');

    await this.clientAnalysisRepo.deleteByClientId(input.clientId);
    await this.safeDeleteStorageFiles(screenshotPaths);

    await this.safeAudit({
      actorUserId: input.actorUserId,
      action: AuditAction.ClientAnalysisDeleted,
      entityType: 'client_analysis',
      entityId: input.clientId,
      metadata: {
        clientId: input.clientId,
        actorRole: input.actorUserRole,
        deletedAt: new Date().toISOString(),
      },
    });

    if (screenshots.length > 0) {
      await this.safeAudit({
        actorUserId: input.actorUserId,
        action: AuditAction.ClientAnalysisScreenshotDeleted,
        entityType: 'client_analysis',
        entityId: input.clientId,
        metadata: {
          clientId: input.clientId,
          actorRole: input.actorUserRole,
          deletedAt: new Date().toISOString(),
          count: screenshots.length,
          platforms: screenshots.map(item => item.platform),
        },
      });
    }
  }

  private async safeAudit(entry: Parameters<AuditLogRepository['createAuditLog']>[0]): Promise<void> {
    try {
      await this.auditRepo.createAuditLog(entry);
    } catch {
      // Do not block the main delete flow when audit persistence fails.
    }
  }

  private async safeLoadScreenshots(clientAnalysisId: string) {
    try {
      return await this.screenshotRepo.findByClientAnalysisId(clientAnalysisId);
    } catch {
      return [];
    }
  }

  private async safeDeleteStorageFiles(paths: string[]): Promise<void> {
    if (paths.length === 0) {
      return;
    }

    try {
      await this.screenshotStorageProvider.deleteAnalysisScreenshots(paths);
    } catch {
      // Keep analysis delete flow non-blocking on remote storage issues.
    }
  }
}
