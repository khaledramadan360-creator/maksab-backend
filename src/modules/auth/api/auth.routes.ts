import { Router } from 'express';
import { AuthController } from './auth.controller';
import { createAuthenticationMiddleware, requireRole, validateRequest } from './auth.middleware';
import * as schemas from './auth.schemas';
import { Role } from '../domain/enums';
import { JwtService } from '../application/services/jwt.interface';

export const createAuthRoutes = (controller: AuthController, jwtService: JwtService): Router => {
  const router = Router();

  const authenticate         = createAuthenticationMiddleware(jwtService);
  const requireAdminOrManager = requireRole([Role.Admin, Role.Manager]);

  // ─── PUBLIC AUTH ────────────────────────────────────────────────────────
  router.post('/login',          validateRequest(schemas.loginSchema),          controller.login);
  router.post('/refresh',        validateRequest(schemas.refreshSchema),        controller.refresh);
  router.post('/forgot-password',validateRequest(schemas.forgotPasswordSchema), controller.forgotPassword);
  router.post('/reset-password', validateRequest(schemas.resetPasswordSchema),  controller.resetPassword);
  router.post('/logout',         authenticate, validateRequest(schemas.refreshSchema), controller.logout);

  // ─── INVITE ACCEPTANCE ─────────────────────────────────────────────────
  router.get('/invites/validate', validateRequest(schemas.validateTokenSchema), controller.validateInvite);
  router.post('/invites/accept',  validateRequest(schemas.acceptInviteSchema),  controller.acceptInvite);

  // ─── ADMIN INVITES ─────────────────────────────────────────────────────
  const inviteRouter = Router();
  inviteRouter.use(authenticate, requireAdminOrManager);

  inviteRouter.post('/',                      validateRequest(schemas.sendInviteSchema),   controller.sendInvite);
  inviteRouter.get('/',                       validateRequest(schemas.listInvitesSchema),  controller.listInvites);
  inviteRouter.post('/:inviteId/resend',      validateRequest(schemas.targetInviteSchema), controller.resendInvite);
  inviteRouter.post('/:inviteId/revoke',      validateRequest(schemas.targetInviteSchema), controller.revokeInvite);

  router.use('/invites', inviteRouter);

  // ─── USER MANAGEMENT ───────────────────────────────────────────────────
  const userRouter = Router();
  userRouter.use(authenticate, requireAdminOrManager);

  userRouter.get('/',                       validateRequest(schemas.listUsersSchema),  controller.listUsers);
  userRouter.patch('/:userId/role',         validateRequest(schemas.changeRoleSchema), controller.changeRole);
  userRouter.patch('/:userId/suspend',      validateRequest(schemas.targetUserSchema), controller.suspendUser);
  userRouter.patch('/:userId/reactivate',   validateRequest(schemas.targetUserSchema), controller.reactivateUser);

  router.use('/users', userRouter);

  // ─── AUDIT ─────────────────────────────────────────────────────────────
  router.get('/audit-logs', authenticate, requireAdminOrManager, validateRequest(schemas.listAuditLogsSchema), controller.listAuditLogs);

  return router;
};
