import { IAuthFacade } from './auth.facade';
import { UserRepository, SessionRepository } from '../domain/repositories';
import { AuthApplicationMapper } from '../application/mappers';
import { UserStatus } from '../domain/enums';
import { PublicUserDto } from './auth.types';

export class AuthFacade implements IAuthFacade {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository
  ) {}

  async getUserById(userId: string): Promise<PublicUserDto | null> {
    const user = await this.userRepo.findById(userId);
    return user ? AuthApplicationMapper.toPublicUserDto(user) : null;
  }

  async getUserByEmail(email: string): Promise<PublicUserDto | null> {
    const user = await this.userRepo.findByEmail(email);
    return user ? AuthApplicationMapper.toPublicUserDto(user) : null;
  }

  async ensureUserIsActive(userId: string): Promise<boolean> {
    const user = await this.userRepo.findById(userId);
    return user?.status === UserStatus.Active;
  }

  async revokeAllSessionsForUser(userId: string): Promise<void> {
    await this.sessionRepo.revokeAllForUser(userId);
  }
}
