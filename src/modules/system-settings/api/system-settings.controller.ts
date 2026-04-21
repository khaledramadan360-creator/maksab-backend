import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { SystemSettingsFacade } from '../public/system-settings.facade';

export class SystemSettingsController {
  constructor(private readonly facade: SystemSettingsFacade) {}

  getSystemSettings = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.facade.getSystemSettings({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
    });

    res.status(200).json({ data: result });
  });

  updateSystemSettings = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.facade.updateSystemSettings({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      analysisGeminiSystemPrompt: req.body.analysisGeminiSystemPrompt,
    });

    res.status(200).json({ data: result });
  });
}
