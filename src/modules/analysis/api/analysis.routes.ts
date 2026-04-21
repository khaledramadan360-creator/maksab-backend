import { Router } from 'express';
import { Role } from '../../auth/domain/enums';
import { AnalysisController } from './analysis.controller';
import { requireAnyRole, validateRequest } from './analysis.middleware';
import {
  deleteClientAnalysisSchema,
  getClientAnalysisSchema,
  runClientAnalysisSchema,
  teamAnalysisOverviewSchema,
} from './analysis.schemas';

export const createAnalysisRoutes = (
  controller: AnalysisController,
  authenticate: ReturnType<typeof import('./analysis.middleware').createAnalysisAuthMiddleware>
): Router => {
  const router = Router();

  const canRunOrReadAnalysis = requireAnyRole([Role.Admin, Role.Manager, Role.Employee]);
  const canDeleteAnalysis = requireAnyRole([Role.Admin, Role.Manager]);
  const canViewTeamOverview = requireAnyRole([Role.Admin, Role.Manager]);

  router.use(authenticate);

  router.get(
    '/analysis/overview/team',
    canViewTeamOverview,
    validateRequest(teamAnalysisOverviewSchema),
    controller.getTeamOverview
  );

  router.post(
    '/:clientId/analysis',
    canRunOrReadAnalysis,
    validateRequest(runClientAnalysisSchema),
    controller.runClientAnalysis
  );
  router.get(
    '/:clientId/analysis',
    canRunOrReadAnalysis,
    validateRequest(getClientAnalysisSchema),
    controller.getClientAnalysis
  );
  router.delete(
    '/:clientId/analysis',
    canDeleteAnalysis,
    validateRequest(deleteClientAnalysisSchema),
    controller.deleteClientAnalysis
  );

  return router;
};
