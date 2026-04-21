import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { JwtService } from '../../auth/application/services/jwt.interface';
import { AuditLogRepository } from '../../auth/domain/repositories';
import { AuditAction } from '../../auth/domain/enums';
import { LeadSearchPolicy } from '../domain/policy';

/**
 * Generic Zod-based request validator.
 * Follows the same pattern used in auth module.
 */
export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error: any) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Request data is invalid',
          details: error.errors ?? [],
        }
      });
    }
  };
};

/**
 * Lead-search authentication middleware.
 * Shares the auth module's JwtService to verify tokens.
 */
export const createLeadSearchAuthMiddleware = (jwtService: JwtService) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Missing authentication token' }
      });
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = jwtService.verifyAccessToken(token);
      req.user = payload;
      return next();
    } catch {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Invalid or expired access token' }
      });
    }
  };
};

/**
 * Lead-search authorization middleware.
 * Allows execute access only for admin / manager / employee roles.
 * Also records forbidden attempts in audit log.
 */
export const createLeadSearchExecuteAuthorizationMiddleware = (auditRepo: AuditLogRepository) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
      });
    }

    if (LeadSearchPolicy.canExecute(req.user.role)) {
      return next();
    }

    try {
      await auditRepo.create({
        actorUserId: req.user.userId,
        action: AuditAction.LeadSearchForbidden,
        entityType: 'lead_search',
        entityId: `lead-search:${req.user.userId}:${Date.now()}:forbidden`,
        metadata: {
          role: req.user.role,
          keyword: req.body?.keyword ?? null,
          saudiCity: req.body?.saudiCity ?? null,
          platforms: Array.isArray(req.body?.platforms) ? req.body.platforms : [],
          requestedResultsCount: req.body?.requestedResultsCount ?? null,
          permission: LeadSearchPolicy.LEAD_SEARCH_EXECUTE_PERMISSION,
          reason: 'forbidden',
          attemptedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('[LeadSearch Audit] Failed to store lead.search.forbidden log:', error?.message || error);
    }

    return res.status(403).json({
      error: {
        code: 'AuthorizationError',
        message: 'You are not allowed to use lead search.',
      }
    });
  };
};
