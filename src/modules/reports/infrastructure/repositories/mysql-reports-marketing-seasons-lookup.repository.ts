import { ReportMarketingSeasonSnapshot } from '../../domain/entities';
import { ReportsMarketingSeasonsLookupRepository } from '../../domain/repositories';
import { MarketingSeasonStatus } from '../../../marketing-seasons/domain/enums';
import { MarketingSeasonModel } from '../../../marketing-seasons/infrastructure/persistence/models/marketing-season.model';

export class MySQLReportsMarketingSeasonsLookupRepository
  implements ReportsMarketingSeasonsLookupRepository
{
  async findActiveMarketingSeason(): Promise<ReportMarketingSeasonSnapshot | null> {
    const season = await MarketingSeasonModel.findOne({
      where: {
        status: MarketingSeasonStatus.Active,
      },
      order: [
        ['updatedAt', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });

    if (!season) {
      return null;
    }

    return {
      id: season.id,
      title: season.title,
      description: season.description,
    };
  }
}

