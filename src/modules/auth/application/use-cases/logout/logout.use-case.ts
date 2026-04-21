import { SessionRepository } from '../../../domain/repositories';
import { RefreshTokenService } from '../../services/refresh-token.interface';

export interface LogoutInput {
  refreshToken: string;
}

export class LogoutUseCase {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly refreshTokenService: RefreshTokenService
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    const tokenHash = this.refreshTokenService.hashRawToken(input.refreshToken);
    const session = await this.sessionRepo.findActiveByTokenHash(tokenHash);
    
    if (session) {
      await this.sessionRepo.revokeById(session.id);
    }
  }
}
