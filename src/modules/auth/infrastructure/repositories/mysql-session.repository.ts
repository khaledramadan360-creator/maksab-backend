import { Session } from '../../domain/entities';
import { SessionRepository } from '../../domain/repositories';
import { SessionModel } from '../persistence/models/session.model';
import { SessionMapper } from '../mappers/auth.mapper';
import { v4 as uuidv4 } from 'uuid';

export class MySQLSessionRepository implements SessionRepository {
  async create(sessionData: Omit<Session, 'id' | 'createdAt'>): Promise<Session> {
    const id = uuidv4();
    const model = await SessionModel.create({
      id,
      userId: sessionData.userId,
      refreshTokenHash: sessionData.refreshTokenHash,
      expiresAt: sessionData.expiresAt,
      lastUsedAt: sessionData.lastUsedAt,
      revokedAt: sessionData.revokedAt,
      createdAt: new Date(),
    });
    return SessionMapper.toDomain(model);
  }

  async revokeById(id: string): Promise<void> {
    await SessionModel.update({ revokedAt: new Date() }, { where: { id } });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await SessionModel.update(
      { revokedAt: new Date() },
      { where: { userId, revokedAt: null } }
    );
  }

  async findActiveByTokenHash(tokenHash: string): Promise<Session | null> {
    const model = await SessionModel.findOne({
      where: {
        refreshTokenHash: tokenHash,
        revokedAt: null,
      },
    });
    return model ? SessionMapper.toDomain(model) : null;
  }
}
