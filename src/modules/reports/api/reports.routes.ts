import { Router } from 'express';
import { Role } from '../../auth/domain/enums';
import { ReportsController } from './reports.controller';
import {
  deleteReportSchema,
  generateClientReportSchema,
  getClientReportSchema,
  getReportByIdSchema,
  listReportsSchema,
} from './reports.schemas';
import { requireAnyRole, validateRequest } from './reports.middleware';

export const createReportsRoutes = (
  controller: ReportsController,
  authenticate: ReturnType<typeof import('./reports.middleware').createReportsAuthMiddleware>
): Router => {
  const router = Router();

  const canGenerateOrRead = requireAnyRole([Role.Admin, Role.Manager, Role.Employee]);
  const canDelete = requireAnyRole([Role.Admin, Role.Manager]);

  router.use(authenticate);

  router.post(
    '/clients/:clientId/report',
    canGenerateOrRead,
    validateRequest(generateClientReportSchema),
    controller.generateClientReport
  );
  router.get(
    '/clients/:clientId/report',
    canGenerateOrRead,
    validateRequest(getClientReportSchema),
    controller.getClientReport
  );
  router.get('/reports', canGenerateOrRead, validateRequest(listReportsSchema), controller.listReports);
  router.get(
    '/reports/:reportId',
    canGenerateOrRead,
    validateRequest(getReportByIdSchema),
    controller.getReportById
  );
  router.delete(
    '/reports/:reportId',
    canDelete,
    validateRequest(deleteReportSchema),
    controller.deleteReport
  );

  return router;
};
