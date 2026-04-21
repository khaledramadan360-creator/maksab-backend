import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

import { LoginUseCase } from '../application/use-cases/login/login.use-case';
import { AcceptInviteUseCase } from '../application/use-cases/accept-invite/accept-invite.use-case';
import { ValidateInviteUseCase } from '../application/use-cases/validate-invite/validate-invite.use-case';
import { SendInviteUseCase } from '../application/use-cases/send-invite/send-invite.use-case';
import { RefreshSessionUseCase } from '../application/use-cases/refresh-session/refresh-session.use-case';
import { LogoutUseCase } from '../application/use-cases/logout/logout.use-case';
import { RequestPasswordResetUseCase } from '../application/use-cases/request-password-reset/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../application/use-cases/reset-password/reset-password.use-case';
import { RevokeInviteUseCase } from '../application/use-cases/revoke-invite/revoke-invite.use-case';
import { ResendInviteUseCase } from '../application/use-cases/resend-invite/resend-invite.use-case';
import { ChangeUserRoleUseCase } from '../application/use-cases/change-user-role/change-user-role.use-case';
import { SuspendUserUseCase } from '../application/use-cases/suspend-user/suspend-user.use-case';
import { ReactivateUserUseCase } from '../application/use-cases/reactivate-user/reactivate-user.use-case';
import { ListUsersUseCase } from '../application/use-cases/list-users/list-users.use-case';
import { ListInvitesUseCase } from '../application/use-cases/list-invites/list-invites.use-case';
import { ListAuditLogsUseCase } from '../application/use-cases/list-audit-logs/list-audit-logs.use-case';

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly acceptInviteUseCase: AcceptInviteUseCase,
    private readonly validateInviteUseCase: ValidateInviteUseCase,
    private readonly sendInviteUseCase: SendInviteUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly revokeInviteUseCase: RevokeInviteUseCase,
    private readonly resendInviteUseCase: ResendInviteUseCase,
    private readonly changeUserRoleUseCase: ChangeUserRoleUseCase,
    private readonly suspendUserUseCase: SuspendUserUseCase,
    private readonly reactivateUserUseCase: ReactivateUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly listInvitesUseCase: ListInvitesUseCase,
    private readonly listAuditLogsUseCase: ListAuditLogsUseCase,
  ) {}

  // ─── PUBLIC AUTH ────────────────────────────────────────────────────────
  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.loginUseCase.execute(req.body);
    res.json({ data: result });
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.refreshSessionUseCase.execute(req.body);
    res.json({ data: result });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    await this.logoutUseCase.execute(req.body);
    res.status(204).send();
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    await this.requestPasswordResetUseCase.execute(req.body);
    res.json({ data: { message: 'If the email exists, a reset link was sent.' } });
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    await this.resetPasswordUseCase.execute(req.body);
    res.json({ data: { message: 'Password reset successful.' } });
  });

  // ─── INVITE ACCEPTANCE ─────────────────────────────────────────────────
  validateInvite = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.validateInviteUseCase.execute({
      token: String(req.query.token ?? ''),
    });
    res.json({ data: result });
  });

  acceptInvite = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.acceptInviteUseCase.execute(req.body);
    res.status(201).json({ data: result });
  });

  // ─── ADMIN INVITES ─────────────────────────────────────────────────────
  sendInvite = asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.userId;
    const result = await this.sendInviteUseCase.execute({
      ...req.body,
      actorUserId,
      targetRole: req.body.role,
      targetEmail: req.body.email,
    });
    res.status(201).json({ data: result });
  });

  resendInvite = asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.userId;
    const { inviteId } = req.params;
    const result = await this.resendInviteUseCase.execute({ actorUserId, inviteId });
    res.json({ data: result });
  });

  revokeInvite = asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.userId;
    const { inviteId } = req.params;
    await this.revokeInviteUseCase.execute({ actorUserId, inviteId });
    res.json({ data: { message: 'Invite successfully revoked' } });
  });

  listInvites = asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.userId;
    const q = req.query as any;
    const result = await this.listInvitesUseCase.execute({
      actorUserId,
      page:     Number(q.page),
      pageSize: Number(q.pageSize),
      status:   q.status,
      role:     q.role,
      email:    q.email,
    });
    res.json({ data: result });
  });

  // ─── USER MANAGEMENT ───────────────────────────────────────────────────
  changeRole = asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.userId;
    const { userId } = req.params;
    const { newRole } = req.body;
    const result = await this.changeUserRoleUseCase.execute({ actorUserId, targetUserId: userId, newRole });
    res.json({ data: result });
  });

  suspendUser = asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.userId;
    const { userId } = req.params;
    const result = await this.suspendUserUseCase.execute({ actorUserId, targetUserId: userId });
    res.json({ data: result });
  });

  reactivateUser = asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.userId;
    const { userId } = req.params;
    const result = await this.reactivateUserUseCase.execute({ actorUserId, targetUserId: userId });
    res.json({ data: result });
  });

  listUsers = asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.userId;
    const q = req.query as any;
    const result = await this.listUsersUseCase.execute({
      actorUserId,
      page:     Number(q.page),
      pageSize: Number(q.pageSize),
      role:     q.role,
      status:   q.status,
      email:    q.email,
    });
    res.json({ data: result });
  });

  // ─── AUDIT ─────────────────────────────────────────────────────────────
  listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.userId;
    const q = req.query as any;
    const result = await this.listAuditLogsUseCase.execute({
      actorUserId,
      page:              Number(q.page),
      pageSize:          Number(q.pageSize),
      action:            q.action,
      entityType:        q.entityType,
      actorUserIdFilter: q.actorUserIdFilter,
      dateFrom:          q.dateFrom,
      dateTo:            q.dateTo,
    });
    res.json({ data: result });
  });
}
