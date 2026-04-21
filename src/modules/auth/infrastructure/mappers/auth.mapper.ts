import { User, Invite, Session, PasswordReset, AuditLog } from '../../domain/entities';
import { Role, InviteStatus, UserStatus, AuditAction } from '../../domain/enums';
import { UserModel } from '../persistence/models/user.model';
import { InviteModel } from '../persistence/models/invite.model';
import { SessionModel } from '../persistence/models/session.model';
import { PasswordResetModel } from '../persistence/models/password-reset.model';
import { AuditLogModel } from '../persistence/models/audit-log.model';

/**
 * Mappers convert Sequelize model instances into clean Domain entities.
 * No Sequelize internals (methods, state, metadata) leak into the domain layer.
 */

export class UserMapper {
  static toDomain(model: UserModel): User {
    return {
      id: model.id,
      email: model.email,
      fullName: model.fullName,
      passwordHash: model.passwordHash,
      role: model.role as Role,
      status: model.status as UserStatus,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}

export class InviteMapper {
  static toDomain(model: InviteModel): Invite {
    return {
      id: model.id,
      email: model.email,
      role: model.role as Role,
      status: model.status as InviteStatus,
      tokenHash: model.tokenHash,
      expiresAt: model.expiresAt,
      invitedByUserId: model.invitedByUserId,
      acceptedUserId: model.acceptedUserId,
      acceptedAt: model.acceptedAt,
      revokedAt: model.revokedAt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}

export class SessionMapper {
  static toDomain(model: SessionModel): Session {
    return {
      id: model.id,
      userId: model.userId,
      refreshTokenHash: model.refreshTokenHash,
      expiresAt: model.expiresAt,
      revokedAt: model.revokedAt,
      lastUsedAt: model.lastUsedAt,
      createdAt: model.createdAt,
    };
  }
}

export class PasswordResetMapper {
  static toDomain(model: PasswordResetModel): PasswordReset {
    return {
      id: model.id,
      userId: model.userId,
      tokenHash: model.tokenHash,
      expiresAt: model.expiresAt,
      usedAt: model.usedAt,
      createdAt: model.createdAt,
    };
  }
}

export class AuditLogMapper {
  static toDomain(model: AuditLogModel): AuditLog {
    return {
      id: model.id,
      actorUserId: model.actorUserId,
      action: model.action as AuditAction,
      entityType: model.entityType,
      entityId: model.entityId,
      metadata: model.metadataJson ?? {},
      createdAt: model.createdAt,
    };
  }
}
