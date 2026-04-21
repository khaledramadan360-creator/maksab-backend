import { MarketingSeason } from '../../domain/entities';
import { AuditAction } from '../../domain/enums';
import {
  AuditLogRepository,
  MarketingSeasonRepository,
} from '../../domain/repositories';
import { ActivateMarketingSeasonCommand } from '../dto/marketing-seasons.commands';
import { NotFoundError } from '../errors';
import { MarketingSeasonActivationService } from '../services/marketing-season-activation.service';
import { MarketingSeasonOwnershipService } from '../services/marketing-season-ownership.service';

export class ActivateMarketingSeasonUseCase {
  constructor(
    private readonly seasonRepo: MarketingSeasonRepository,
    private readonly auditRepo: AuditLogRepository,
    private readonly ownershipService: MarketingSeasonOwnershipService,
    private readonly activationService: MarketingSeasonActivationService
  ) {}

  async execute(command: ActivateMarketingSeasonCommand): Promise<MarketingSeason> {
    this.ownershipService.assertActorIdentity(command.actorUserId, command.actorUserRole);
    this.ownershipService.assertCanActivate(command.actorUserRole);

    const targetSeason = await this.seasonRepo.findById(command.seasonId);
    if (!targetSeason) {
      throw new NotFoundError('Marketing season not found');
    }

    this.ownershipService.assertCanAccessSeason(
      command.actorUserRole,
      command.actorUserId,
      targetSeason.ownerUserId
    );

    const activationResult = await this.activationService.activateSeason(command.seasonId);

    if (activationResult.deactivatedSeason) {
      await this.auditRepo.createAuditLog({
        actorUserId: command.actorUserId,
        action: AuditAction.MarketingSeasonDeactivated,
        entityType: 'marketing_season',
        entityId: activationResult.deactivatedSeason.id,
        metadata: {
          replacedBySeasonId: activationResult.activatedSeason.id,
        },
      });
    }

    await this.auditRepo.createAuditLog({
      actorUserId: command.actorUserId,
      action: AuditAction.MarketingSeasonActivated,
      entityType: 'marketing_season',
      entityId: activationResult.activatedSeason.id,
      metadata: {
        previousActiveSeasonId: activationResult.deactivatedSeason?.id ?? null,
      },
    });

    return activationResult.activatedSeason;
  }
}

