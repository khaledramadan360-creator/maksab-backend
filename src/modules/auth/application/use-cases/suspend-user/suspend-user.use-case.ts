import { UserRepository, SessionRepository, AuditLogRepository } from '../../../domain/repositories';
import { UserStatus, AuditAction } from '../../../domain/enums';
import { PolicyMatrix } from '../../../domain/policy';
import { AuthApplicationMapper } from '../../mappers';
import { PublicUserDto } from '../../../public/auth.types';
import { AuthorizationError, NotFoundError } from '../../errors';

export interface SuspendUserInput {
  actorUserId: string;
  targetUserId: string;
}

export class SuspendUserUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly auditRepo: AuditLogRepository
  ) {}

  async execute(input: SuspendUserInput): Promise<PublicUserDto> {
    const actor = await this.userRepo.findById(input.actorUserId);
    if (!actor) throw new NotFoundError('Actor not found');
    if (actor.status !== UserStatus.Active) throw new AuthorizationError('Actor is not active');

    const target = await this.userRepo.findById(input.targetUserId);
    if (!target) throw new NotFoundError('Target user not found');

    if (target.status === UserStatus.Suspended) {
      return AuthApplicationMapper.toPublicUserDto(target); // Seamless return
    }

    if (!PolicyMatrix[actor.role].canSuspendUser(target.role)) {
      throw new AuthorizationError('You do not have permission to suspend this user');
    }

    target.status = UserStatus.Suspended;
    await this.userRepo.save(target);

    // Explicitly drain all active sessions
    await this.sessionRepo.revokeAllForUser(target.id);

    await this.auditRepo.create({
      actorUserId: actor.id,
      action: AuditAction.UserSuspended,
      entityType: 'user',
      entityId: target.id,
      metadata: { reason: 'manual_suspension' }
    });

    await this.auditRepo.create({
      actorUserId: actor.id,
      action: AuditAction.SessionRevokedAll,
      entityType: 'user',
      entityId: target.id,
      metadata: { context: 'account_suspended' }
    });

    return AuthApplicationMapper.toPublicUserDto(target);
  }
}
