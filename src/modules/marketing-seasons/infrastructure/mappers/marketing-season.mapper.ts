import { MarketingSeason, MarketingSeasonSummary } from '../../domain/entities';
import { MarketingSeasonStatus } from '../../domain/enums';
import { MarketingSeasonModel } from '../persistence/models/marketing-season.model';

export class MarketingSeasonMapper {
  static toDomain(model: MarketingSeasonModel): MarketingSeason {
    return {
      id: model.id,
      title: model.title,
      description: model.description,
      status: model.status as MarketingSeasonStatus,
      ownerUserId: model.ownerUserId,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  static toSummary(model: MarketingSeasonModel): MarketingSeasonSummary {
    return {
      id: model.id,
      title: model.title,
      status: model.status as MarketingSeasonStatus,
      ownerUserId: model.ownerUserId,
      createdAt: model.createdAt,
    };
  }
}

