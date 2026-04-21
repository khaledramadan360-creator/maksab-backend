import { ActiveMarketingSeasonPayload } from '../../domain/entities';
import { MarketingSeasonRepository } from '../../domain/repositories';
import { GetActiveMarketingSeasonQuery } from '../dto/marketing-seasons.commands';
import { MarketingSeasonOwnershipService } from '../services/marketing-season-ownership.service';

export class GetActiveMarketingSeasonUseCase {
  constructor(
    private readonly seasonRepo: MarketingSeasonRepository,
    private readonly ownershipService: MarketingSeasonOwnershipService
  ) {}

  async execute(query: GetActiveMarketingSeasonQuery): Promise<ActiveMarketingSeasonPayload | null> {
    this.ownershipService.assertActorIdentity(query.actorUserId, query.actorUserRole);
    this.ownershipService.assertCanReadRealData(query.actorUserRole);

    const active = await this.seasonRepo.findActive();
    if (!active) {
      return null;
    }

    return {
      id: active.id,
      title: active.title,
      description: active.description,
    };
  }
}

