import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { JwtService } from '../../auth/application/services/jwt.interface';

export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as {
        body?: Request['body'];
        query?: Request['query'];
        params?: Request['params'];
      };

      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query as Request['query'];
      if (parsed.params !== undefined) req.params = parsed.params;
      return next();
    } catch (error: any) {
      const zodIssues = error?.issues ?? error?.errors ?? [];
      const details = Array.isArray(zodIssues)
        ? zodIssues.map((issue: any) => ({
            path: Array.isArray(issue?.path) ? issue.path.join('.') : '',
            message: issue?.message ?? 'Invalid value',
            code: issue?.code ?? 'invalid',
          }))
        : [];

      return res.status(422).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Request data is invalid',
          details,
        },
      });
    }
  };
};

export const createClientEmailCampaignsAuthMiddleware = (jwtService: JwtService) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing authentication token',
        },
      });
    }

    const token = authHeader.split(' ')[1];
    try {
      req.user = jwtService.verifyAccessToken(token);
      return next();
    } catch {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired access token',
        },
      });
    }
  };
};
