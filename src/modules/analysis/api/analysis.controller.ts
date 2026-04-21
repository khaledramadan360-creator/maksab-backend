import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { AnalysisFacade } from '../public/analysis.facade';
import { ClientAnalysisDto } from '../public/analysis.types';
import { resolveAnalysisScreenshotsFilesBaseUrl } from '../infrastructure/providers/local-screenshot-storage.provider';

export class AnalysisController {
  constructor(private readonly facade: AnalysisFacade) {}

  runClientAnalysis = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.facade.runClientAnalysis({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      clientId: req.params.clientId,
    });
    res.status(200).json({ data: this.resolveLocalScreenshotUrls(req, result) });
  });

  getClientAnalysis = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.facade.getClientAnalysis({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      clientId: req.params.clientId,
    });

    if (!result) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Client analysis not found',
        },
      });
      return;
    }

    res.status(200).json({ data: this.resolveLocalScreenshotUrls(req, result) });
  });

  deleteClientAnalysis = asyncHandler(async (req: Request, res: Response) => {
    await this.facade.deleteClientAnalysis({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      clientId: req.params.clientId,
    });
    res.status(204).send();
  });

  getTeamOverview = asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as any;
    const result = await this.facade.getTeamAnalysisOverview({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      keyword: q.keyword,
      ownerUserId: q.ownerUserId,
      hasAnalysis: q.hasAnalysis,
      page: q.page,
      pageSize: q.pageSize,
    });

    res.status(200).json({ data: result });
  });

  private resolveLocalScreenshotUrls(req: Request, data: ClientAnalysisDto): ClientAnalysisDto {
    const screenshotsBaseUrl = this.resolveScreenshotsBaseUrl(req);

    return {
      ...data,
      screenshots: data.screenshots.map(item => {
        const normalizedPath = String(item.supabasePath || '').trim();
        const normalizedPublicUrl = String(item.publicUrl || '').trim();

        if (item.captureStatus === 'captured' && normalizedPath) {
          return {
            ...item,
            publicUrl: this.buildScreenshotUrl(screenshotsBaseUrl, normalizedPath),
          };
        }

        return {
          ...item,
          publicUrl: this.normalizePublicUrl(req, normalizedPublicUrl),
        };
      }),
    };
  }

  private resolveScreenshotsBaseUrl(req: Request): string {
    const configuredBaseUrl = resolveAnalysisScreenshotsFilesBaseUrl();
    if (/^https?:\/\//i.test(configuredBaseUrl)) {
      return configuredBaseUrl.replace(/\/+$/g, '');
    }

    const basePath = configuredBaseUrl.startsWith('/') ? configuredBaseUrl : `/${configuredBaseUrl}`;
    return `${this.resolveRequestOrigin(req)}${basePath}`.replace(/\/+$/g, '');
  }

  private resolveRequestOrigin(req: Request): string {
    const forwardedProto = String(req.headers['x-forwarded-proto'] || '')
      .split(',')[0]
      .trim();
    const protocol = forwardedProto || req.protocol || 'http';

    const forwardedHost = String(req.headers['x-forwarded-host'] || '')
      .split(',')[0]
      .trim();
    const host = forwardedHost || req.get('host') || 'localhost:3000';

    return `${protocol}://${host}`;
  }

  private buildScreenshotUrl(baseUrl: string, screenshotPath: string): string {
    const encodedPath = screenshotPath
      .replace(/\\/g, '/')
      .split('/')
      .filter(Boolean)
      .map(segment => encodeURIComponent(segment))
      .join('/');

    return `${baseUrl}/${encodedPath}`;
  }

  private normalizePublicUrl(req: Request, urlValue: string): string | null {
    if (!urlValue) {
      return null;
    }

    if (urlValue.startsWith('data:image/')) {
      return urlValue;
    }

    if (/^https?:\/\//i.test(urlValue)) {
      return urlValue;
    }

    const normalizedPath = urlValue.startsWith('/') ? urlValue : `/${urlValue}`;
    return `${this.resolveRequestOrigin(req)}${normalizedPath}`;
  }
}
