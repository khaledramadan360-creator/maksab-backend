import { UserRepository, InviteRepository, AuditLogRepository } from '../../../domain/repositories';
import { TimeProvider } from '../../../../../core/providers/time.provider';
import { TokenGenerator } from '../../services/token-generator.interface';
import { AuthMailAdapter } from '../../services/mail-adapter.interface';
import { Role, InviteStatus, AuditAction, UserStatus } from '../../../domain/enums';
import { PolicyMatrix } from '../../../domain/policy';
import { AuthorizationError, ConflictError, NotFoundError } from '../../errors';

export interface SendInviteInput {
  actorUserId: string;
  targetEmail: string;
  targetRole: Role;
}

export interface SendInviteOutput {
  inviteId: string;
  email: string;
  role: Role;
  status: InviteStatus;
  expiresAt: Date;
}

export class SendInviteUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly inviteRepo: InviteRepository,
    private readonly auditRepo: AuditLogRepository,
    private readonly timeProvider: TimeProvider,
    private readonly tokenGen: TokenGenerator,
    private readonly mailer: AuthMailAdapter
  ) {}

  async execute(input: SendInviteInput): Promise<SendInviteOutput> {
    const email = input.targetEmail.trim().toLowerCase();
    const maskedEmail = this.maskEmail(email);

    const actor = await this.userRepo.findById(input.actorUserId);
    if (!actor) throw new NotFoundError('Actor not found');
    if (actor.status !== UserStatus.Active) throw new AuthorizationError('Actor is not active');

    if (!PolicyMatrix[actor.role].canSendInvite()) {
      throw new AuthorizationError('You do not have permission to invite users');
    }

    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    const existingInvite = await this.inviteRepo.findByEmail(email);
    if (existingInvite && existingInvite.status === InviteStatus.Pending && existingInvite.expiresAt > this.timeProvider.now()) {
      throw new ConflictError('A pending invite already exists for this email');
    }

    const rawToken = this.tokenGen.generateRawToken();
    const tokenHash = this.tokenGen.hashToken(rawToken);
    const expiresAt = this.timeProvider.nowPlusDays(7);

    const invite = await this.inviteRepo.create({
      email,
      role: input.targetRole,
      status: InviteStatus.Pending,
      tokenHash,
      expiresAt,
      invitedByUserId: actor.id,
      acceptedUserId: null,
      acceptedAt: null,
      revokedAt: null,
    });

    await this.auditRepo.create({
      actorUserId: actor.id,
      action: AuditAction.InviteSent,
      entityType: 'invite',
      entityId: invite.id,
      metadata: { role: input.targetRole, email }
    });

    console.log('[AUTH][INVITE] Sending invite email', {
      actorUserId: actor.id,
      inviteId: invite.id,
      role: input.targetRole,
      email: maskedEmail,
    });
    await this.mailer.sendInviteEmail(email, rawToken, input.targetRole);
    console.log('[AUTH][INVITE] Invite email send completed', {
      inviteId: invite.id,
      email: maskedEmail,
    });

    return {
      inviteId: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt,
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
