import { runInTransaction } from '../../../../core/database/transaction.helper';
import { MarketingSeasonStatus } from '../../domain/enums';
import { MarketingSeasonRepository } from '../../domain/repositories';
import { ActivateMarketingSeasonResult } from '../dto/marketing-seasons.commands';
import { NotFoundError } from '../errors';

export class MarketingSeasonActivationService {
  constructor(private readonly seasonRepo: MarketingSeasonRepository) {}

  async activateSeason(seasonId: string): Promise<ActivateMarketingSeasonResult> {
    return runInTransaction(async transaction => {
      const options = { transaction };
      const targetSeason = await this.seasonRepo.findById(seasonId, options);
      if (!targetSeason) {
        throw new NotFoundError('Marketing season not found');
      }

      const currentActive = await this.seasonRepo.findActive(options);
      let deactivatedSeason = null as ActivateMarketingSeasonResult['deactivatedSeason'];

      if (currentActive && currentActive.id !== targetSeason.id) {
        deactivatedSeason = currentActive;
        await this.seasonRepo.deactivateAll(options);
      }

      const activatedSeason =
        targetSeason.status === MarketingSeasonStatus.Active && !deactivatedSeason
          ? targetSeason
          : await this.seasonRepo.activateById(targetSeason.id, options);

      return {
        activatedSeason,
        deactivatedSeason,
      };
    });
  }
}

