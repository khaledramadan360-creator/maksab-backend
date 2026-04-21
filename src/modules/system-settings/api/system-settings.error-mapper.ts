import { NextFunction, Request, Response } from 'express';
import {
  ApplicationError,
  AuthorizationError,
  ValidationError,
} from '../application/errors';

export const systemSettingsErrorMiddleware = (
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

    return res.status(status).json({
      error: {
        code: err.name,
        message: err.message,
      },
    });
  }

  const dbCode = err?.original?.code || err?.parent?.code;
  if (err?.name === 'SequelizeDatabaseError' && dbCode === 'ER_NO_SUCH_TABLE') {
    return res.status(500).json({
      error: {
        code: 'SYSTEM_SETTINGS_STORAGE_NOT_INITIALIZED',
        message:
          'System settings storage is not initialized. Required tables are missing; run database migrations.',
      },
    });
  }

  console.error('[UNHANDLED ERROR IN SYSTEM SETTINGS API]', err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred.',
    },
  });
};
