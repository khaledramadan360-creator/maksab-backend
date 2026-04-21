import { InviteRepository, UserRepository, SessionRepository, AuditLogRepository } from '../../../domain/repositories';
import { PasswordHasher } from '../../services/password-hasher.interface';
import { JwtService } from '../../services/jwt.interface';
import { RefreshTokenService } from '../../services/refresh-token.interface';
import { TimeProvider } from '../../../../../core/providers/time.provider';
import { TokenGenerator } from '../../services/token-generator.interface';
import { InviteStatus, AuditAction, UserStatus } from '../../../domain/enums';
import { Rules } from '../../../domain/rules';
import { AuthApplicationMapper } from '../../mappers';
import { PublicUserDto } from '../../../public/auth.types';
import { ConflictError, InviteExpiredError, InviteNotUsableError, NotFoundError, ValidationError } from '../../errors';

export interface AcceptInviteInput {
  token: string;
  fullName: string;
  password: string;
}

export interface AcceptInviteOutput {
  user: PublicUserDto;
  accessToken: string;
  refreshToken: string;
}

export class AcceptInviteUseCase {
  constructor(
    private readonly inviteRepo: InviteRepository,
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly auditRepo: AuditLogRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly timeProvider: TimeProvider,
    private readonly tokenGen: TokenGenerator
  ) {}

  async execute(input: AcceptInviteInput): Promise<AcceptInviteOutput> {
    const tokenHash = this.tokenGen.hashToken(input.token);
    
    // 1. Fetch Invite
    const invite = await this.inviteRepo.findByTokenHash(tokenHash);
    if (!invite) throw new NotFoundError('Invite not found');
    
    if (invite.status !== InviteStatus.Pending) {
      throw new InviteNotUsableError(`Invite is ${invite.status}`);
    }
    
    if (invite.expiresAt < this.timeProvider.now()) {
      throw new InviteExpiredError();
    }

    // 2. Prevent user collision
    const existingUser = await this.userRepo.findByEmail(invite.email);
    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    // 3. Validate Inputs against Domain Rules
    if (!Rules.Validation.FullName.required || input.fullName.length < Rules.Validation.FullName.minLength) {
      throw new ValidationError('Invalid full name format');
    }
    if (!Rules.Validation.Password.regex.test(input.password) || input.password.length < Rules.Validation.Password.minLength) {
      throw new ValidationError('Password is too weak');
    }

    // 4. Hash Password
    const passwordHash = await this.passwordHasher.hash(input.password);

    // 5. Create User
    const user = await this.userRepo.create({
      email: invite.email,
      fullName: input.fullName,
      passwordHash,
      role: invite.role,
      status: UserStatus.Active,
    });

    // 6. Mark Invite as Accepted
    invite.status = InviteStatus.Accepted;
    invite.acceptedUserId = user.id;
    invite.acceptedAt = this.timeProvider.now();
    await this.inviteRepo.save(invite);

    // 7. Generate Tokens & Session
    const jwtPayload = { userId: user.id, role: user.role };
    const accessToken = this.jwtService.signAccessToken(jwtPayload);
    
    const refreshPair = this.refreshTokenService.generatePair();
    await this.sessionRepo.create({
      userId: user.id,
      refreshTokenHash: refreshPair.hashedToken,
      expiresAt: refreshPair.expiresAt,
      lastUsedAt: this.timeProvider.now(),
      revokedAt: null,
    });

    // 8. Audit Log
    await this.auditRepo.create({
      actorUserId: user.id,
      action: AuditAction.InviteAccepted,
      entityType: 'user',
      entityId: user.id,
      metadata: { inviteId: invite.id }
    });

    return {
      user: AuthApplicationMapper.toPublicUserDto(user),
      accessToken,
      refreshToken: refreshPair.rawToken,
    };
  }
}
