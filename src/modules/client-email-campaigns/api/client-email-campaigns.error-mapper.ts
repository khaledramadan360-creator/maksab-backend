import { NextFunction, Request, Response } from 'express';
import {
  BrevoMarketingDisabledError,
  BrevoMarketingRateLimitedError,
  BrevoMarketingRejectedError,
  BrevoMarketingTimeoutError,
  BrevoMarketingUnavailableError,
  ClientEmailCampaignAccessDeniedError,
  ClientEmailCampaignError,
  ClientEmailCampaignNotFoundError,
  ClientEmailCampaignValidationError,
  ClientsNotFoundError,
  InvalidOverrideTargetError,
  NoSendableRecipientsError,
  OverrideNotAllowedError,
  OverrideReasonRequiredError,
} from '../domain/errors';

export const clientEmailCampaignsErrorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ClientEmailCampaignError) {
    let status = 400;

    if (err instanceof ClientEmailCampaignValidationError) status = 400;
    else if (err instanceof ClientEmailCampaignAccessDeniedError || err instanceof OverrideNotAllowedError) status = 403;
    else if (err instanceof ClientsNotFoundError || err instanceof ClientEmailCampaignNotFoundError) status = 404;
    else if (err instanceof NoSendableRecipientsError) status = 409;
    else if (err instanceof BrevoMarketingRateLimitedError) status = 429;
    else if (err instanceof BrevoMarketingRejectedError) status = 502;
    else if (err instanceof BrevoMarketingUnavailableError || err instanceof BrevoMarketingDisabledError) status = 503;
    else if (err instanceof BrevoMarketingTimeoutError) status = 504;
    else if (err instanceof InvalidOverrideTargetError || err instanceof OverrideReasonRequiredError) status = 400;

    return res.status(status).json({
      success: false,
      error: {
        code: err.name,
        message: err.message,
      },
    });
  }

  const dbCode = err?.original?.code || err?.parent?.code;
  if (err?.name === 'SequelizeDatabaseError' && dbCode === 'ER_NO_SUCH_TABLE') {
    return res.status(500).json({
      success: false,
      error: {
        code: 'CLIENT_EMAIL_CAMPAIGNS_STORAGE_NOT_INITIALIZED',
        message: 'Client email campaigns storage is not initialized. Required tables are missing; run database migrations.',
      },
    });
  }

  console.error('[UNHANDLED ERROR IN CLIENT EMAIL CAMPAIGNS API]', err);
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred.',
    },
  });
};
