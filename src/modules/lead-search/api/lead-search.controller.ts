import { Request, Response, NextFunction } from 'express';
import { LeadSearchFacade } from '../public/lead-search.facade';
import { SupportedSaudiCity } from '../domain/enums';

export class LeadSearchController {
  constructor(private readonly facade: LeadSearchFacade) {}

  /**
   * POST /api/v1/lead-search
   * Initiates a lead search across selected platforms and returns structured results.
   */
  public search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { keyword, saudiCity, platforms, requestedResultsCount, language } = req.body;

      const output = await this.facade.searchLeads({
        keyword,
        country: 'SA',
        saudiCity: saudiCity ?? SupportedSaudiCity.RIYADH,
        platforms,
        requestedResultsCount,
        language,
        actorUserId: req.user?.userId,
        actorUserRole: req.user?.role,
      });

      res.status(200).json({ data: output });
    } catch (error) {
      next(error);
    }
  };
}
