import { UserRepository, InviteRepository, AuditLogRepository } from '../../../domain/repositories';
import { TimeProvider } from '../../../../../core/providers/time.provider';
import { UserStatus, InviteStatus, AuditAction } from '../../../domain/enums';
import { PolicyMatrix } from '../../../domain/policy';
import { AuthorizationError, ConflictError, NotFoundError } from '../../errors';

export interface RevokeInviteInput {
  actorUserId: string;
  inviteId: string;
}

export class RevokeInviteUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly inviteRepo: InviteRepository,
    private readonly auditRepo: AuditLogRepository,
    private readonly timeProvider: TimeProvider
  ) {}

  async execute(input: RevokeInviteInput): Promise<void> {
    const actor = await this.userRepo.findById(input.actorUserId);
    if (!actor) throw new NotFoundError('Actor not found');
    if (actor.status !== UserStatus.Active) throw new AuthorizationError('Actor is not active');

    const invite = await this.inviteRepo.findById(input.inviteId);
    if (!invite) throw new NotFoundError('Invite not found');

    if (invite.status !== InviteStatus.Pending) {
      throw new ConflictError(`Cannot revoke an invite that is already ${invite.status}`);
    }

    if (!PolicyMatrix[actor.role].canRevokeInvite(invite.role)) {
      throw new AuthorizationError('You do not have permission to revoke this invite');
    }

    invite.status = InviteStatus.Revoked;
    invite.revokedAt = this.timeProvider.now();
    await this.inviteRepo.save(invite);

    await this.auditRepo.create({
      actorUserId: actor.id,
      action: AuditAction.InviteRevoked,
      entityType: 'invite',
      entityId: invite.id,
      metadata: { targetEmail: invite.email }
    });
  }
}
