import { Router } from 'express';
import { Role } from '../../auth/domain/enums';
import { ClientsController } from './clients.controller';
import {
  changeClientOwnerSchema,
  changeClientStatusSchema,
  clientIdParamSchema,
  createClientFromSearchSchema,
  listClientOwnerOptionsSchema,
  createClientSchema,
  listClientsSchema,
  updateClientSchema,
} from './clients.schemas';
import { requireAnyRole, validateRequest } from './clients.middleware';

export const createClientsRoutes = (
  controller: ClientsController,
  authenticate: ReturnType<typeof import('./clients.middleware').createClientsAuthMiddleware>
): Router => {
  const router = Router();

  const canCreate = requireAnyRole([Role.Admin, Role.Manager, Role.Employee]);
  const canReadAndMutateOwnOrAll = requireAnyRole([Role.Admin, Role.Manager, Role.Employee]);
  const canManageOwnersAndOverview = requireAnyRole([Role.Admin, Role.Manager]);

  router.use(authenticate);

  router.post('/', canCreate, validateRequest(createClientSchema), controller.createClient);
  router.post('/from-search', canCreate, validateRequest(createClientFromSearchSchema), controller.createClientFromSearch);

  router.get('/', canReadAndMutateOwnOrAll, validateRequest(listClientsSchema), controller.listClients);
  router.get(
    '/owners/options',
    canManageOwnersAndOverview,
    validateRequest(listClientOwnerOptionsSchema),
    controller.listClientOwnerOptions
  );

  router.get('/overview/team', canManageOwnersAndOverview, controller.getTeamOverview);

  router.get('/:clientId', canReadAndMutateOwnOrAll, validateRequest(clientIdParamSchema), controller.getClientById);
  router.patch('/:clientId', canReadAndMutateOwnOrAll, validateRequest(updateClientSchema), controller.updateClient);
  router.patch(
    '/:clientId/status',
    canReadAndMutateOwnOrAll,
    validateRequest(changeClientStatusSchema),
    controller.changeClientStatus
  );
  router.patch(
    '/:clientId/owner',
    canManageOwnersAndOverview,
    validateRequest(changeClientOwnerSchema),
    controller.changeClientOwner
  );
  router.delete('/:clientId', canReadAndMutateOwnOrAll, validateRequest(clientIdParamSchema), controller.deleteClient);

  return router;
};
