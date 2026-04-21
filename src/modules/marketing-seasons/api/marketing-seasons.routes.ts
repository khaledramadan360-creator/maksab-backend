import { Router } from 'express';
import { Role } from '../../auth/domain/enums';
import { MarketingSeasonsController } from './marketing-seasons.controller';
import {
  activateMarketingSeasonSchema,
  createMarketingSeasonSchema,
  deleteMarketingSeasonSchema,
  getMarketingSeasonByIdSchema,
  listMarketingSeasonsSchema,
  updateMarketingSeasonSchema,
} from './marketing-seasons.schemas';
import { requireAnyRole, validateRequest } from './marketing-seasons.middleware';

export const createMarketingSeasonsRoutes = (
  controller: MarketingSeasonsController,
  authenticate: ReturnType<
    typeof import('./marketing-seasons.middleware').createMarketingSeasonsAuthMiddleware
  >
): Router => {
  const router = Router();

  const canReadOrMutate = requireAnyRole([Role.Admin, Role.Manager, Role.Employee]);

  router.use(authenticate);

  router.post('/', canReadOrMutate, validateRequest(createMarketingSeasonSchema), controller.createMarketingSeason);
  router.get('/', canReadOrMutate, validateRequest(listMarketingSeasonsSchema), controller.listMarketingSeasons);
  router.get('/active', canReadOrMutate, controller.getActiveMarketingSeason);
  router.post(
    '/:seasonId/activate',
    canReadOrMutate,
    validateRequest(activateMarketingSeasonSchema),
    controller.activateMarketingSeason
  );
  router.get(
    '/:seasonId',
    canReadOrMutate,
    validateRequest(getMarketingSeasonByIdSchema),
    controller.getMarketingSeasonById
  );
  router.patch(
    '/:seasonId',
    canReadOrMutate,
    validateRequest(updateMarketingSeasonSchema),
    controller.updateMarketingSeason
  );
  router.delete(
    '/:seasonId',
    canReadOrMutate,
    validateRequest(deleteMarketingSeasonSchema),
    controller.deleteMarketingSeason
  );

  return router;
};

