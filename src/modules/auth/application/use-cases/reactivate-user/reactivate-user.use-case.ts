import { UserRepository, AuditLogRepository } from '../../../domain/repositories';
import { UserStatus, AuditAction } from '../../../domain/enums';
import { PolicyMatrix } from '../../../domain/policy';
import { AuthApplicationMapper } from '../../mappers';
import { PublicUserDto } from '../../../public/auth.types';
import { AuthorizationError, NotFoundError, ConflictError } from '../../errors';

export interface ReactivateUserInput {
  actorUserId: string;
  targetUserId: string;
}

export class ReactivateUserUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly auditRepo: AuditLogRepository
  ) {}

  async execute(input: ReactivateUserInput): Promise<PublicUserDto> {
    const actor = await this.userRepo.findById(input.actorUserId);
    if (!actor) throw new NotFoundError('Actor not found');
    if (actor.status !== UserStatus.Active) throw new AuthorizationError('Actor is not active');

    const target = await this.userRepo.findById(input.targetUserId);
    if (!target) throw new NotFoundError('Target user not found');

    if (target.status === UserStatus.Active) {
       // Return normally per idempotency or throw error. The plan suggested no-op.
       return AuthApplicationMapper.toPublicUserDto(target);
    }

    if (!PolicyMatrix[actor.role].canReactivateUser(target.role)) {
      throw new AuthorizationError('You do not have permission to reactivate this user');
    }

    target.status = UserStatus.Active;
    await this.userRepo.save(target);

    await this.auditRepo.create({
      actorUserId: actor.id,
      action: AuditAction.UserReactivated,
      entityType: 'user',
      entityId: target.id,
      metadata: { reason: 'manual_reactivation' }
    });

    return AuthApplicationMapper.toPublicUserDto(target);
  }
}
