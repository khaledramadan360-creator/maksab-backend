import { UserRepository, AuditLogRepository } from '../../../domain/repositories';
import { UserStatus, AuditAction, Role } from '../../../domain/enums';
import { PolicyMatrix } from '../../../domain/policy';
import { AuthApplicationMapper } from '../../mappers';
import { PublicUserDto } from '../../../public/auth.types';
import { AuthorizationError, NotFoundError } from '../../errors';

export interface ChangeUserRoleInput {
  actorUserId: string;
  targetUserId: string;
  newRole: Role;
}

export class ChangeUserRoleUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly auditRepo: AuditLogRepository
  ) {}

  async execute(input: ChangeUserRoleInput): Promise<PublicUserDto> {
    const actor = await this.userRepo.findById(input.actorUserId);
    if (!actor) throw new NotFoundError('Actor not found');
    if (actor.status !== UserStatus.Active) throw new AuthorizationError('Actor is not active');

    const target = await this.userRepo.findById(input.targetUserId);
    if (!target) throw new NotFoundError('Target user not found');

    if (target.role === input.newRole) {
      return AuthApplicationMapper.toPublicUserDto(target); // No-op safe return
    }

    if (!PolicyMatrix[actor.role].canChangeRole(target.role, input.newRole)) {
      throw new AuthorizationError('You do not have permission to change this user\'s role to the specified role');
    }

    const oldRole = target.role;
    target.role = input.newRole;
    await this.userRepo.save(target);

    await this.auditRepo.create({
      actorUserId: actor.id,
      action: AuditAction.UserRoleChanged,
      entityType: 'user',
      entityId: target.id,
      metadata: { oldRole, newRole: input.newRole }
    });

    return AuthApplicationMapper.toPublicUserDto(target);
  }
}
