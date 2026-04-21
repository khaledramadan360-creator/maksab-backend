export enum Role {
  Admin = 'admin',
  Manager = 'manager',
  Employee = 'employee',
  Viewer = 'viewer',
}

export enum InviteStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Expired = 'expired',
  Revoked = 'revoked',
}

export enum UserStatus {
  Active = 'active',
  Suspended = 'suspended',
}

export enum AuditAction {
  InviteSent = 'invite.sent',
  InviteResent = 'invite.resent',
  InviteRevoked = 'invite.revoked',
  InviteAccepted = 'invite.accepted',
  AuthLoginSucceeded = 'auth.login.succeeded',
  AuthLoginFailed = 'auth.login.failed',
  AuthPasswordResetRequested = 'auth.password_reset.requested',
  AuthPasswordResetCompleted = 'auth.password_reset.completed',
  UserRoleChanged = 'user.role.changed',
  UserSuspended = 'user.suspended',
  UserReactivated = 'user.reactivated',
  SessionRevokedAll = 'session.revoked_all',
  LeadSearchExecuted = 'lead.search.executed',
  LeadSearchForbidden = 'lead.search.forbidden',
}
