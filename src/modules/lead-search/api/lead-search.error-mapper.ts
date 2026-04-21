import { Request, Response, NextFunction } from 'express';

/**
 * Error middleware for the lead-search module.
 * Maps module-level errors to appropriate HTTP responses.
 */
export const leadSearchErrorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(err);
  }

  // Validation errors (from use-case level)
  if (err.message === 'At least one platform must be selected.') {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: err.message }
    });
  }

  if (err.name === 'AuthorizationError') {
    return res.status(403).json({
      error: { code: 'AuthorizationError', message: err.message || 'Forbidden' }
    });
  }

  // Provider-level failures
  if (
    err.message?.startsWith('BrightDataSerpProvider Error:') ||
    err.message?.startsWith('BrightDataDatasetProvider Error:')
  ) {
    return res.status(502).json({
      error: {
        code: 'SEARCH_PROVIDER_FAILURE',
        message: 'Search provider returned an error. Please try again later.',
      }
    });
  }

  // Fallback for unexpected errors
  console.error('[UNHANDLED ERROR IN LEAD-SEARCH API]', err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred during search.',
    }
  });
};
