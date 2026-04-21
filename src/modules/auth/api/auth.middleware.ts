import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { JwtService } from '../application/services/jwt.interface';

declare module 'express-serve-static-core' {
  interface Request {
    user?: { userId: string; role: string };
  }
}

/**
 * Higher-order middleware for generic Zod request validation
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
      return res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Request format is invalid',
        }
      });
    }
  };
};

/**
 * Verifies JWT tokens and attaches identity to the underlying request
 */
export const createAuthenticationMiddleware = (jwtService: JwtService) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing authentication token' } });
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = jwtService.verifyAccessToken(token);
      req.user = payload;
      return next();
    } catch (err) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired access token' } });
    }
  };
};

/**
 * Broad-stroke endpoint security gate.
 * Fine-grained target rules live in Use Cases (Policy).
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient role permissions' } });
    }
    return next();
  };
};
