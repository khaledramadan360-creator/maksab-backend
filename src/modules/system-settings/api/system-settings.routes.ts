import { Router } from 'express';
import { Role } from '../../auth/domain/enums';
import { SystemSettingsController } from './system-settings.controller';
import {
  createSystemSettingsAuthMiddleware,
  requireAnyRole,
  validateRequest,
} from './system-settings.middleware';
import { updateSystemSettingsSchema } from './system-settings.schemas';

export const createSystemSettingsRoutes = (
  controller: SystemSettingsController,
  authenticate: ReturnType<typeof createSystemSettingsAuthMiddleware>
): Router => {
  const router = Router();

  const canReadOrUpdate = requireAnyRole([Role.Admin, Role.Manager]);

  router.use(authenticate);

  router.get('/', canReadOrUpdate, controller.getSystemSettings);
  router.patch(
    '/',
    canReadOrUpdate,
    validateRequest(updateSystemSettingsSchema),
    controller.updateSystemSettings
  );

  return router;
};
