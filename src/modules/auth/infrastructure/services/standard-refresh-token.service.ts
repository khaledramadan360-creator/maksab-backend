import * as crypto from 'crypto';
import { RefreshTokenPayload, RefreshTokenService } from '../../application/services/refresh-token.interface';
import { TimeProvider } from '../../../../core/providers/time.provider';

export class StandardRefreshTokenService implements RefreshTokenService {
  private readonly timeProvider: TimeProvider;
  private readonly expiryDays: number;

  constructor(timeProvider: TimeProvider, expiryDays: number = 7) {
    this.timeProvider = timeProvider;
    this.expiryDays = expiryDays;
  }

  generatePair(): RefreshTokenPayload {
    // 64 random bytes for high entropy in session refresh tokens
    const rawToken = crypto.randomBytes(64).toString('base64url');
    const hashedToken = this.hashRawToken(rawToken);
    const expiresAt = this.timeProvider.nowPlusDays(this.expiryDays);

    return { rawToken, hashedToken, expiresAt };
  }

  hashRawToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }
}
