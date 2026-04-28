import { NextFunction, Request, Response } from 'express';
import {
  ApplicationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ProviderError,
  ValidationError,
} from '../application/errors';

export const analysisErrorMiddleware = (
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
    if (err instanceof ProviderError) status = 502;

    return res.status(status).json({
      error: {
        code: err.name,
        message: err.message,
      },
    });
  }

  // Handle Sequelize DB bootstrap/migration issues with explicit message.
  const dbCode = err?.original?.code || err?.parent?.code;
  if (err?.name === 'SequelizeDatabaseError' && dbCode === 'ER_NO_SUCH_TABLE') {
    return res.status(500).json({
      error: {
        code: 'ANALYSIS_STORAGE_NOT_INITIALIZED',
        message:
          'Analysis storage is not initialized. Required tables are missing; run database migrations.',
      },
    });
  }

  return next(err);
};
