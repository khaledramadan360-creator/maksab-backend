import { MarketingSeason } from '../../domain/entities';
import { AuditAction } from '../../domain/enums';
import {
  AuditLogRepository,
  MarketingSeasonRepository,
} from '../../domain/repositories';
import { UpdateMarketingSeasonCommand } from '../dto/marketing-seasons.commands';
import { NotFoundError, ValidationError } from '../errors';
import { MarketingSeasonOwnershipService } from '../services/marketing-season-ownership.service';

export class UpdateMarketingSeasonUseCase {
  constructor(
    private readonly seasonRepo: MarketingSeasonRepository,
    private readonly auditRepo: AuditLogRepository,
    private readonly ownershipService: MarketingSeasonOwnershipService
  ) {}

  async execute(command: UpdateMarketingSeasonCommand): Promise<MarketingSeason> {
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

    const patch = {
      title: command.title !== undefined ? this.normalizeRequiredTitle(command.title) : undefined,
      description:
        command.description !== undefined
          ? this.normalizeOptionalDescription(command.description)
          : undefined,
    };

    if (patch.title === undefined && patch.description === undefined) {
      throw new ValidationError('No update fields provided');
    }

    const updated = await this.seasonRepo.update(command.seasonId, patch);

    await this.auditRepo.createAuditLog({
      actorUserId: command.actorUserId,
      action: AuditAction.MarketingSeasonUpdated,
      entityType: 'marketing_season',
      entityId: updated.id,
      metadata: {
        changedFields: this.extractChangedFields(command),
      },
    });

    return updated;
  }

  private extractChangedFields(command: UpdateMarketingSeasonCommand): string[] {
    return Object.entries(command)
      .filter(([key, value]) => {
        if (['actorUserId', 'actorUserRole', 'seasonId'].includes(key)) {
          return false;
        }

        return value !== undefined;
      })
      .map(([key]) => key);
  }

  private normalizeRequiredTitle(value: string): string {
    const normalized = String(value || '').trim();
    if (!normalized) {
      throw new ValidationError('Season title cannot be empty');
    }

    return normalized;
  }

  private normalizeOptionalDescription(value: string | null): string | null {
    if (value === null) {
      return null;
    }

    const normalized = String(value || '').trim();
    return normalized === '' ? null : normalized;
  }
}

