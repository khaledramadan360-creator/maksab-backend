import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { MarketingSeasonsFacade } from '../public/marketing-seasons.facade';

export class MarketingSeasonsController {
  constructor(private readonly facade: MarketingSeasonsFacade) {}

  createMarketingSeason = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.facade.createMarketingSeason({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      title: req.body.title,
      description: req.body.description,
    });

    res.status(201).json({ data: result });
  });

  listMarketingSeasons = asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as any;
    const createdAtFrom = q.createdAtFrom ?? q.dateFrom ?? q.fromDate ?? q.startDate ?? q.from;
    const createdAtTo = q.createdAtTo ?? q.dateTo ?? q.toDate ?? q.endDate ?? q.to;

    const result = await this.facade.listMarketingSeasons({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      keyword: q.keyword,
      status: q.status,
      ownerUserId: q.ownerUserId,
      createdAtFrom,
      createdAtTo,
      page: Number(q.page ?? 1),
      pageSize: Number(q.pageSize ?? 20),
    });

    res.status(200).json({ data: result });
  });

  getMarketingSeasonById = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.facade.getMarketingSeasonById({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      seasonId: req.params.seasonId,
    });

    if (!result) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Marketing season not found',
        },
      });
      return;
    }

    res.status(200).json({ data: result });
  });

  updateMarketingSeason = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.facade.updateMarketingSeason({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      seasonId: req.params.seasonId,
      title: req.body.title,
      description: req.body.description,
    });

    res.status(200).json({ data: result });
  });

  deleteMarketingSeason = asyncHandler(async (req: Request, res: Response) => {
    await this.facade.deleteMarketingSeason({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      seasonId: req.params.seasonId,
    });

    res.status(204).send();
  });

  activateMarketingSeason = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.facade.activateMarketingSeason({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      seasonId: req.params.seasonId,
    });

    res.status(200).json({ data: result });
  });

  getActiveMarketingSeason = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.facade.getActiveMarketingSeason({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
    });

    if (!result) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'No active marketing season found',
        },
      });
      return;
    }

    res.status(200).json({ data: result });
  });
}

