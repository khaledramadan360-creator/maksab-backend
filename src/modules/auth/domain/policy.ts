import { Role } from './enums';

/**
 * Access Control Policy Matrix
 */
export const PolicyMatrix = {
  [Role.Admin]: {
    canSendInvite: () => true,
    canResendInvite: () => true,
    canRevokeInvite: () => true,
    canChangeRole: () => true,
    canSuspendUser: () => true,
    canReactivateUser: () => true,
    canViewAuditLogs: () => true,
  },
  [Role.Manager]: {
    canSendInvite: () => true,
    canResendInvite: () => true,
    canRevokeInvite: (targetInviteRole: Role) => targetInviteRole !== Role.Admin,
    canChangeRole: (targetUserRole: Role, newRole: Role) => targetUserRole !== Role.Admin && newRole !== Role.Admin,
    canSuspendUser: (targetUserRole: Role) => targetUserRole !== Role.Admin,
    canReactivateUser: (targetUserRole: Role) => targetUserRole !== Role.Admin,
    canViewAuditLogs: () => true,
  },
  [Role.Employee]: {
    canSendInvite: () => false,
    canResendInvite: () => false,
    canRevokeInvite: () => false,
    canChangeRole: () => false,
    canSuspendUser: () => false,
    canReactivateUser: () => false,
    canViewAuditLogs: () => false,
  },
  [Role.Viewer]: {
    canSendInvite: () => false,
    canResendInvite: () => false,
    canRevokeInvite: () => false,
    canChangeRole: () => false,
    canSuspendUser: () => false,
    canReactivateUser: () => false,
    canViewAuditLogs: () => false,
  },
};
