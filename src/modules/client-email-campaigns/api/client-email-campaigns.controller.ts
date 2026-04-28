import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { PreviewClientEmailCampaignUseCase } from '../application/use-cases/preview-client-email-campaign.use-case';
import { SendClientEmailCampaignUseCase } from '../application/use-cases/send-client-email-campaign.use-case';
import { ListClientEmailCampaignsUseCase } from '../application/use-cases/list-client-email-campaigns.use-case';
import { GetClientEmailCampaignDetailsUseCase } from '../application/use-cases/get-client-email-campaign-details.use-case';

export class ClientEmailCampaignsController {
  constructor(
    private readonly previewUseCase: PreviewClientEmailCampaignUseCase,
    private readonly sendUseCase: SendClientEmailCampaignUseCase,
    private readonly listUseCase: ListClientEmailCampaignsUseCase,
    private readonly detailsUseCase: GetClientEmailCampaignDetailsUseCase
  ) {}

  preview = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.previewUseCase.execute({
      ...req.body,
      requestedByUser: {
        userId: req.user!.userId,
        role: req.user!.role,
      },
    });

    res.json({ success: true, data: result });
  });

  send = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.sendUseCase.execute({
      ...req.body,
      requestedByUser: {
        userId: req.user!.userId,
        role: req.user!.role,
      },
    });

    res.json({
      success: true,
      message: 'Client email campaign sent.',
      data: result,
    });
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.listUseCase.execute(req.query as any, {
      userId: req.user!.userId,
      role: req.user!.role,
    });

    res.json({ success: true, data: result });
  });

  details = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.detailsUseCase.execute({
      campaignId: req.params.campaignId,
      page: Number(req.query.page ?? 1),
      pageSize: Number(req.query.pageSize ?? 100),
      actor: {
        userId: req.user!.userId,
        role: req.user!.role,
      },
    });

    res.json({ success: true, data: result });
  });
}
