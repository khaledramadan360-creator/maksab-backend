import { Router } from 'express';
import { LeadSearchController } from './lead-search.controller';
import { validateRequest } from '../api/lead-search.middleware';
import { leadSearchSchema } from './lead-search.schemas';

export const createLeadSearchRoutes = (
  controller: LeadSearchController,
  authenticate: ReturnType<typeof import('../api/lead-search.middleware').createLeadSearchAuthMiddleware>,
  authorizeExecute: ReturnType<typeof import('../api/lead-search.middleware').createLeadSearchExecuteAuthorizationMiddleware>,
): Router => {
  const router = Router();

  // ─── AUTHENTICATED SEARCH ──────────────────────────────────────────────────
  // All lead search operations require a valid session.
  router.post(
    '/',
    authenticate,
    authorizeExecute,
    validateRequest(leadSearchSchema),
    controller.search
  );

  return router;
};
