import { SessionRepository, UserRepository } from '../../../domain/repositories';
import { JwtService } from '../../services/jwt.interface';
import { RefreshTokenService } from '../../services/refresh-token.interface';
import { TimeProvider } from '../../../../../core/providers/time.provider';
import { UserStatus } from '../../../domain/enums';
import { AuthenticationError } from '../../errors';

export interface RefreshSessionInput {
  refreshToken: string;
}

export interface RefreshSessionOutput {
  accessToken: string;
  refreshToken: string;
}

export class RefreshSessionUseCase {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly userRepo: UserRepository,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly timeProvider: TimeProvider
  ) {}

  async execute(input: RefreshSessionInput): Promise<RefreshSessionOutput> {
    const tokenHash = this.refreshTokenService.hashRawToken(input.refreshToken);
    
    const session = await this.sessionRepo.findActiveByTokenHash(tokenHash);
    
    if (!session || session.expiresAt < this.timeProvider.now()) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    const user = await this.userRepo.findById(session.userId);
    
    if (!user || user.status !== UserStatus.Active) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    // Token Rotation: Revoke the old session
    await this.sessionRepo.revokeById(session.id);

    // Create the new session
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

    return {
      accessToken,
      refreshToken: refreshPair.rawToken,
    };
  }
}
