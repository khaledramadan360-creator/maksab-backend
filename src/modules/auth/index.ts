import { Router } from 'express';
import { JsonWebTokenService } from './infrastructure/services/jsonwebtoken.service';
import { BcryptPasswordHasher } from './infrastructure/services/bcrypt-password-hasher';
import { CryptoTokenGenerator } from './infrastructure/services/crypto-token-generator';
import { StandardRefreshTokenService } from './infrastructure/services/standard-refresh-token.service';
import { BrevoMailAdapter } from './infrastructure/services/brevo-mail-adapter';
import { MySQLUserRepository } from './infrastructure/repositories/mysql-user.repository';
import { MySQLInviteRepository } from './infrastructure/repositories/mysql-invite.repository';
import { MySQLSessionRepository } from './infrastructure/repositories/mysql-session.repository';
import { MySQLPasswordResetRepository } from './infrastructure/repositories/mysql-password-reset.repository';
import { MySQLAuditLogRepository } from './infrastructure/repositories/mysql-audit-log.repository';
import { SystemTimeProvider } from '../../core/providers/time.provider';
import { AuthController } from './api/auth.controller';
import { createAuthRoutes } from './api/auth.routes';
import { errorMappingMiddleware } from './api/auth.error-mapper';
import { AuthFacade } from './public/auth.facade.impl';
import { IAuthFacade } from './public/auth.facade';

// Use Cases — Write
import { LoginUseCase } from './application/use-cases/login/login.use-case';
import { AcceptInviteUseCase } from './application/use-cases/accept-invite/accept-invite.use-case';
import { ValidateInviteUseCase } from './application/use-cases/validate-invite/validate-invite.use-case';
import { SendInviteUseCase } from './application/use-cases/send-invite/send-invite.use-case';
import { RefreshSessionUseCase } from './application/use-cases/refresh-session/refresh-session.use-case';
import { LogoutUseCase } from './application/use-cases/logout/logout.use-case';
import { RequestPasswordResetUseCase } from './application/use-cases/request-password-reset/request-password-reset.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password/reset-password.use-case';
import { RevokeInviteUseCase } from './application/use-cases/revoke-invite/revoke-invite.use-case';
import { ResendInviteUseCase } from './application/use-cases/resend-invite/resend-invite.use-case';
import { ChangeUserRoleUseCase } from './application/use-cases/change-user-role/change-user-role.use-case';
import { SuspendUserUseCase } from './application/use-cases/suspend-user/suspend-user.use-case';
import { ReactivateUserUseCase } from './application/use-cases/reactivate-user/reactivate-user.use-case';

// Use Cases — Read
import { ListUsersUseCase } from './application/use-cases/list-users/list-users.use-case';
import { ListInvitesUseCase } from './application/use-cases/list-invites/list-invites.use-case';
import { ListAuditLogsUseCase } from './application/use-cases/list-audit-logs/list-audit-logs.use-case';

export function initAuthModule(): { router: Router; errorMiddleware: any; facade: IAuthFacade } {
  // 1. Providers
  const timeProvider = new SystemTimeProvider();

  // 2. Repositories
  const userRepo      = new MySQLUserRepository();
  const inviteRepo    = new MySQLInviteRepository();
  const sessionRepo   = new MySQLSessionRepository();
  const passResetRepo = new MySQLPasswordResetRepository();
  const auditRepo     = new MySQLAuditLogRepository();

  // 3. Technical Services
  const jwtSecret            = process.env.JWT_ACCESS_SECRET || 'dev_secret_access';
  const jwtAccessExpiresIn   = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  const jwtRefreshExpiresIn  = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const jwtService           = new JsonWebTokenService(jwtSecret, jwtAccessExpiresIn);
  const passwordHasher       = new BcryptPasswordHasher(10);
  const tokenGen             = new CryptoTokenGenerator();
  const refreshTokenService  = new StandardRefreshTokenService(
    timeProvider,
    resolveRefreshExpiryDays(jwtRefreshExpiresIn)
  );
  const mailAdapter          = new BrevoMailAdapter();

  // 4. Write Use Cases
  const login        = new LoginUseCase(userRepo, sessionRepo, auditRepo, passwordHasher, jwtService, refreshTokenService, timeProvider);
  const acceptInvite = new AcceptInviteUseCase(inviteRepo, userRepo, sessionRepo, auditRepo, passwordHasher, jwtService, refreshTokenService, timeProvider, tokenGen);
  const validateInvite = new ValidateInviteUseCase(inviteRepo, userRepo, timeProvider, tokenGen);
  const sendInvite   = new SendInviteUseCase(userRepo, inviteRepo, auditRepo, timeProvider, tokenGen, mailAdapter);
  const refresh      = new RefreshSessionUseCase(sessionRepo, userRepo, jwtService, refreshTokenService, timeProvider);
  const logout       = new LogoutUseCase(sessionRepo, refreshTokenService);
  const requestReset = new RequestPasswordResetUseCase(userRepo, passResetRepo, auditRepo, tokenGen, mailAdapter, timeProvider);
  const execReset    = new ResetPasswordUseCase(passResetRepo, userRepo, sessionRepo, auditRepo, passwordHasher, tokenGen, timeProvider);
  const revokeInvite = new RevokeInviteUseCase(userRepo, inviteRepo, auditRepo, timeProvider);
  const resendInvite = new ResendInviteUseCase(userRepo, inviteRepo, auditRepo, tokenGen, mailAdapter, timeProvider);
  const changeRole   = new ChangeUserRoleUseCase(userRepo, auditRepo);
  const suspendUser  = new SuspendUserUseCase(userRepo, sessionRepo, auditRepo);
  const reactivate   = new ReactivateUserUseCase(userRepo, auditRepo);

  // 5. Read Use Cases
  const listUsers     = new ListUsersUseCase(userRepo);
  const listInvites   = new ListInvitesUseCase(userRepo, inviteRepo);
  const listAuditLogs = new ListAuditLogsUseCase(userRepo, auditRepo);

  // 6. Controller
  const controller = new AuthController(
    login, acceptInvite, validateInvite, sendInvite, refresh, logout,
    requestReset, execReset, revokeInvite, resendInvite,
    changeRole, suspendUser, reactivate,
    listUsers, listInvites, listAuditLogs,
  );

  // 7. Routes + Errors
  const router = createAuthRoutes(controller, jwtService);
  const facade = new AuthFacade(userRepo, sessionRepo);

  return { router, errorMiddleware: errorMappingMiddleware, facade };
}

function resolveRefreshExpiryDays(rawValue: string): number {
  const normalizedValue = rawValue.trim().toLowerCase();

  const daysMatch = normalizedValue.match(/^(\d+)d$/);
  if (daysMatch) {
    return Math.max(1, Number(daysMatch[1]));
  }

  const hoursMatch = normalizedValue.match(/^(\d+)h$/);
  if (hoursMatch) {
    return Math.max(1, Math.ceil(Number(hoursMatch[1]) / 24));
  }

  const minutesMatch = normalizedValue.match(/^(\d+)m$/);
  if (minutesMatch) {
    return Math.max(1, Math.ceil(Number(minutesMatch[1]) / (24 * 60)));
  }

  const numericValue = Number(normalizedValue);
  if (Number.isFinite(numericValue) && numericValue > 0) {
    return Math.ceil(numericValue);
  }

  return 7;
}

// Public Facade re-exports
export { IAuthFacade } from './public/auth.facade';
export { PublicUserDto } from './public/auth.types';
