import { NextFunction, Request, Response } from 'express';
import {
  ApplicationError,
  AuthorizationError,
  ConflictError,
  DuplicateConflictError,
  NotFoundError,
  ValidationError,
} from '../application/errors';

export const clientsErrorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ApplicationError) {
    let status = 400;
    if (err instanceof ValidationError) status = 422;
    if (err instanceof AuthorizationError) status = 403;
    if (err instanceof NotFoundError) status = 404;
    if (err instanceof ConflictError) status = 409;

    if (err instanceof DuplicateConflictError) {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_CLIENT',
          message: err.message,
          duplicate: err.duplicate,
        },
      });
    }

    return res.status(status).json({
      error: {
        code: err.name,
        message: err.message,
      },
    });
  }

  return next(err);
};
