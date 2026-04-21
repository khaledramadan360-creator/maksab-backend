import { AuditAction } from '../../domain/enums';
import {
  AuditLogRepository,
  MarketingSeasonRepository,
} from '../../domain/repositories';
import { DeleteMarketingSeasonCommand } from '../dto/marketing-seasons.commands';
import { NotFoundError } from '../errors';
import { MarketingSeasonOwnershipService } from '../services/marketing-season-ownership.service';

export class DeleteMarketingSeasonUseCase {
  constructor(
    private readonly seasonRepo: MarketingSeasonRepository,
    private readonly auditRepo: AuditLogRepository,
    private readonly ownershipService: MarketingSeasonOwnershipService
  ) {}

  async execute(command: DeleteMarketingSeasonCommand): Promise<void> {
    this.ownershipService.assertActorIdentity(command.actorUserId, command.actorUserRole);
    this.ownershipService.assertCanMutate(command.actorUserRole);

    const season = await this.seasonRepo.findById(command.seasonId);
    if (!season) {
      throw new NotFoundError('Marketing season not found');
    }

    this.ownershipService.assertCanAccessSeason(
      command.actorUserRole,
      command.actorUserId,
      season.ownerUserId
    );

    await this.seasonRepo.delete(season.id);

    await this.auditRepo.createAuditLog({
      actorUserId: command.actorUserId,
      action: AuditAction.MarketingSeasonDeleted,
      entityType: 'marketing_season',
      entityId: season.id,
      metadata: {
        title: season.title,
        status: season.status,
        ownerUserId: season.ownerUserId,
      },
    });
  }
}

