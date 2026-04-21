import { Role, InviteStatus, UserStatus, AuditAction } from './enums';

export interface Invite {
  id: string;
  email: string;
  role: Role;
  status: InviteStatus;
  tokenHash: string;
  expiresAt: Date;
  invitedByUserId: string;
  acceptedUserId: string | null;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date;
  createdAt: Date;
}

export interface PasswordReset {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  actorUserId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata: Record<string, any>;
  createdAt: Date;
}
