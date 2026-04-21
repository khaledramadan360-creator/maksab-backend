import {
  ListMarketingSeasonsQuery,
  ListMarketingSeasonsResult,
} from '../dto/marketing-seasons.commands';
import { MarketingSeasonRepository } from '../../domain/repositories';
import { MarketingSeasonOwnershipService } from '../services/marketing-season-ownership.service';

export class ListMarketingSeasonsUseCase {
  constructor(
    private readonly seasonRepo: MarketingSeasonRepository,
    private readonly ownershipService: MarketingSeasonOwnershipService
  ) {}

  async execute(query: ListMarketingSeasonsQuery): Promise<ListMarketingSeasonsResult> {
    this.ownershipService.assertActorIdentity(query.actorUserId, query.actorUserRole);
    this.ownershipService.assertCanReadRealData(query.actorUserRole);

    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, query.pageSize ?? 20));
    const ownerUserId = this.ownershipService.resolveOwnerFilter(
      query.actorUserRole,
      query.actorUserId,
      query.filters.ownerUserId
    );

    return this.seasonRepo.list(
      {
        ...query.filters,
        ownerUserId,
      },
      {
        page,
        pageSize,
      }
    );
  }
}

