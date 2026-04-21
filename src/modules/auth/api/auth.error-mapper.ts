import { Request, Response, NextFunction } from 'express';
import { 
  ApplicationError, 
  AuthenticationError, 
  AuthorizationError, 
  ConflictError, 
  InviteExpiredError, 
  InviteNotUsableError, 
  NotFoundError, 
  ValidationError 
} from '../application/errors';

/**
 * Universal error map conforming strictly to the generic JSON response format.
 * Bridges Business Domain Exceptions down to explicit HTTP Codes.
 */
export const errorMappingMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ApplicationError) {
    let statusCode = 400; // Default Bad Request

    if (err instanceof ValidationError) statusCode = 422;
    else if (err instanceof AuthenticationError) statusCode = 401;
    else if (err instanceof AuthorizationError) statusCode = 403;
    else if (err instanceof NotFoundError) statusCode = 404;
    else if (err instanceof ConflictError) statusCode = 409;
    else if (err instanceof InviteExpiredError) statusCode = 410;
    else if (err instanceof InviteNotUsableError) statusCode = 409; // Or 410

    return res.status(statusCode).json({
      error: {
        code: err.name,
        message: err.message,
      }
    });
  }

  // Fallback for uncaught programming errors or Database/Server failures
  console.error('[UNHANDLED ERROR IN AUTH API]', err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred.',
    }
  });
};
