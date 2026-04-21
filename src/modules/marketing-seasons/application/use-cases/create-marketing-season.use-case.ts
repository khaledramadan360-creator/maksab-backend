import { AuditAction, MarketingSeasonStatus } from '../../domain/enums';
import {
  AuditLogRepository,
  MarketingSeasonRepository,
  UsersLookupRepository,
} from '../../domain/repositories';
import { MarketingSeason } from '../../domain/entities';
import { CreateMarketingSeasonCommand } from '../dto/marketing-seasons.commands';
import { NotFoundError, ValidationError } from '../errors';
import { MarketingSeasonOwnershipService } from '../services/marketing-season-ownership.service';

export class CreateMarketingSeasonUseCase {
  constructor(
    private readonly seasonRepo: MarketingSeasonRepository,
    private readonly usersLookupRepo: UsersLookupRepository,
    private readonly auditRepo: AuditLogRepository,
    private readonly ownershipService: MarketingSeasonOwnershipService
  ) {}

  async execute(command: CreateMarketingSeasonCommand): Promise<MarketingSeason> {
    this.ownershipService.assertActorIdentity(command.actorUserId, command.actorUserRole);
    this.ownershipService.assertCanCreate(command.actorUserRole);

    const actorExists = await this.usersLookupRepo.existsById(command.actorUserId);
    if (!actorExists) {
      throw new NotFoundError('Actor user not found');
    }

    const title = this.normalizeRequiredTitle(command.title);
    const description = this.normalizeOptionalDescription(command.description);

    const season = await this.seasonRepo.create({
      title,
      description,
      status: MarketingSeasonStatus.Inactive,
      ownerUserId: command.actorUserId,
    });

    await this.auditRepo.createAuditLog({
      actorUserId: command.actorUserId,
      action: AuditAction.MarketingSeasonCreated,
      entityType: 'marketing_season',
      entityId: season.id,
      metadata: {
        title: season.title,
        status: season.status,
        ownerUserId: season.ownerUserId,
      },
    });

    return season;
  }

  private normalizeRequiredTitle(value: string): string {
    const normalized = String(value || '').trim();
    if (!normalized) {
      throw new ValidationError('Season title is required');
    }

    return normalized;
  }

  private normalizeOptionalDescription(value?: string | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = String(value).trim();
    return normalized === '' ? null : normalized;
  }
}

