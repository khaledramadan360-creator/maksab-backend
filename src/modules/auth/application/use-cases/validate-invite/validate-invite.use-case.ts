import { InviteRepository, UserRepository } from '../../../domain/repositories';
import { InviteStatus } from '../../../domain/enums';
import { TimeProvider } from '../../../../../core/providers/time.provider';
import { TokenGenerator } from '../../services/token-generator.interface';
import {
  ConflictError,
  InviteExpiredError,
  InviteNotUsableError,
  NotFoundError,
} from '../../errors';

export interface ValidateInviteInput {
  token: string;
}

export interface ValidateInviteOutput {
  valid: true;
  email: string;
  role: string;
  expiresAt: Date;
}

function maskEmail(email: string): string {
  const [localPart, domainPart] = email.split('@');
  if (!localPart || !domainPart) return email;

  if (localPart.length <= 2) {
    return `${localPart[0] ?? '*'}*@${domainPart}`;
  }

  const visible = localPart.slice(0, 2);
  const masked = '*'.repeat(localPart.length - 2);
  return `${visible}${masked}@${domainPart}`;
}

export class ValidateInviteUseCase {
  constructor(
    private readonly inviteRepo: InviteRepository,
    private readonly userRepo: UserRepository,
    private readonly timeProvider: TimeProvider,
    private readonly tokenGen: TokenGenerator,
  ) {}

  async execute(input: ValidateInviteInput): Promise<ValidateInviteOutput> {
    const tokenHash = this.tokenGen.hashToken(input.token);
    const invite = await this.inviteRepo.findByTokenHash(tokenHash);

    if (!invite) throw new NotFoundError('Invite not found');

    if (invite.status !== InviteStatus.Pending) {
      throw new InviteNotUsableError(`Invite is ${invite.status}`);
    }

    if (invite.expiresAt < this.timeProvider.now()) {
      throw new InviteExpiredError();
    }

    const existingUser = await this.userRepo.findByEmail(invite.email);
    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    return {
      valid: true,
      email: maskEmail(invite.email),
      role: invite.role,
      expiresAt: invite.expiresAt,
    };
  }
}
