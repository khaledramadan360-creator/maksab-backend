import { UserRepository, InviteRepository, AuditLogRepository } from '../../../domain/repositories';
import { TokenGenerator } from '../../services/token-generator.interface';
import { AuthMailAdapter } from '../../services/mail-adapter.interface';
import { TimeProvider } from '../../../../../core/providers/time.provider';
import { UserStatus, InviteStatus, AuditAction, Role } from '../../../domain/enums';
import { PolicyMatrix } from '../../../domain/policy';
import { AuthorizationError, ConflictError, NotFoundError } from '../../errors';

export interface ResendInviteInput {
  actorUserId: string;
  inviteId: string;
}

export interface ResendInviteOutput {
  inviteId: string;
  email: string;
  role: Role;
  status: InviteStatus;
  expiresAt: Date;
}

export class ResendInviteUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly inviteRepo: InviteRepository,
    private readonly auditRepo: AuditLogRepository,
    private readonly tokenGen: TokenGenerator,
    private readonly mailer: AuthMailAdapter,
    private readonly timeProvider: TimeProvider
  ) {}

  async execute(input: ResendInviteInput): Promise<ResendInviteOutput> {
    const actor = await this.userRepo.findById(input.actorUserId);
    if (!actor) throw new NotFoundError('Actor not found');
    if (actor.status !== UserStatus.Active) throw new AuthorizationError('Actor is not active');

    const oldInvite = await this.inviteRepo.findById(input.inviteId);
    if (!oldInvite) throw new NotFoundError('Invite not found');

    if (!PolicyMatrix[actor.role].canResendInvite()) {
      throw new AuthorizationError('You do not have permission to resend invites');
    }

    if (oldInvite.status === InviteStatus.Accepted) {
      throw new ConflictError('Cannot resend an invite that has already been accepted');
    }

    // Step 1: Revoke the old invite if it's still pending
    if (oldInvite.status === InviteStatus.Pending) {
      oldInvite.status = InviteStatus.Revoked;
      oldInvite.revokedAt = this.timeProvider.now();
      await this.inviteRepo.save(oldInvite);
    }

    // Step 2: Generate entirely new invite
    const rawToken = this.tokenGen.generateRawToken();
    const tokenHash = this.tokenGen.hashToken(rawToken);
    const expiresAt = this.timeProvider.nowPlusDays(7);

    const newInvite = await this.inviteRepo.create({
      email: oldInvite.email,
      role: oldInvite.role,
      status: InviteStatus.Pending,
      tokenHash,
      expiresAt,
      invitedByUserId: actor.id,
      acceptedUserId: null,
      acceptedAt: null,
      revokedAt: null,
    });

    // Step 3: Audit logic
    await this.auditRepo.create({
      actorUserId: actor.id,
      action: AuditAction.InviteResent,
      entityType: 'invite',
      entityId: newInvite.id,
      metadata: { oldInviteId: oldInvite.id, email: newInvite.email }
    });

    // Step 4: Mail
    const maskedEmail = this.maskEmail(newInvite.email);
    console.log('[AUTH][INVITE] Resending invite email', {
      actorUserId: actor.id,
      oldInviteId: oldInvite.id,
      inviteId: newInvite.id,
      role: newInvite.role,
      email: maskedEmail,
    });
    await this.mailer.sendInviteEmail(newInvite.email, rawToken, newInvite.role);
    console.log('[AUTH][INVITE] Resend invite email completed', {
      inviteId: newInvite.id,
      email: maskedEmail,
    });

    return {
      inviteId: newInvite.id,
      email: newInvite.email,
      role: newInvite.role,
      status: newInvite.status,
      expiresAt: newInvite.expiresAt,
    };
  }

  private maskEmail(email: string): string {
    const atIndex = email.indexOf('@');
    if (atIndex <= 1) {
      return '***';
    }

    return email[0] + '***' + email.slice(atIndex - 1);
  }
}
