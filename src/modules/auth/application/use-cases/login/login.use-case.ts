import { UserRepository, SessionRepository, AuditLogRepository } from '../../../domain/repositories';
import { PasswordHasher } from '../../services/password-hasher.interface';
import { JwtService } from '../../services/jwt.interface';
import { RefreshTokenService } from '../../services/refresh-token.interface';
import { TimeProvider } from '../../../../../core/providers/time.provider';
import { AuditAction, UserStatus } from '../../../domain/enums';
import { AuthApplicationMapper } from '../../mappers';
import { PublicUserDto } from '../../../public/auth.types';
import { AuthenticationError } from '../../errors';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  user: PublicUserDto;
  accessToken: string;
  refreshToken: string;
}

export class LoginUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly auditRepo: AuditLogRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly timeProvider: TimeProvider
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const email = input.email.trim().toLowerCase();
    const user = await this.userRepo.findByEmail(email);

    // Generic failure handler to strictly align with security rules
    const handleFailure = async (actorId: string | null) => {
      await this.auditRepo.create({
        actorUserId: actorId,
        action: AuditAction.AuthLoginFailed,
        entityType: 'user',
        entityId: actorId || 'unknown',
        metadata: { email }
      });
      throw new AuthenticationError('Invalid credentials');
    };

    if (!user) {
      return handleFailure(null);
    }

    if (user.status === UserStatus.Suspended) {
      return handleFailure(user.id);
    }

    const isMatch = await this.passwordHasher.verify(input.password, user.passwordHash);
    if (!isMatch) {
      return handleFailure(user.id);
    }

    // Success Authentication
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

    await this.auditRepo.create({
      actorUserId: user.id,
      action: AuditAction.AuthLoginSucceeded,
      entityType: 'user',
      entityId: user.id,
      metadata: { sessionIdCreatedAt: this.timeProvider.now() }
    });

    return {
      user: AuthApplicationMapper.toPublicUserDto(user),
      accessToken,
      refreshToken: refreshPair.rawToken,
    };
  }
}
