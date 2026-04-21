import { MarketingSeason } from '../../domain/entities';
import { MarketingSeasonRepository } from '../../domain/repositories';
import { GetMarketingSeasonByIdQuery } from '../dto/marketing-seasons.commands';
import { NotFoundError } from '../errors';
import { MarketingSeasonOwnershipService } from '../services/marketing-season-ownership.service';

export class GetMarketingSeasonByIdUseCase {
  constructor(
    private readonly seasonRepo: MarketingSeasonRepository,
    private readonly ownershipService: MarketingSeasonOwnershipService
  ) {}

  async execute(query: GetMarketingSeasonByIdQuery): Promise<MarketingSeason> {
    this.ownershipService.assertActorIdentity(query.actorUserId, query.actorUserRole);
    this.ownershipService.assertCanReadRealData(query.actorUserRole);

    const season = await this.seasonRepo.findById(query.seasonId);
    if (!season) {
      throw new NotFoundError('Marketing season not found');
    }

    this.ownershipService.assertCanAccessSeason(
      query.actorUserRole,
      query.actorUserId,
      season.ownerUserId
    );

    return season;
  }
}

