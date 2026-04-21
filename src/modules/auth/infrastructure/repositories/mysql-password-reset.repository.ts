import { PasswordReset } from '../../domain/entities';
import { PasswordResetRepository } from '../../domain/repositories';
import { PasswordResetModel } from '../persistence/models/password-reset.model';
import { PasswordResetMapper } from '../mappers/auth.mapper';
import { v4 as uuidv4 } from 'uuid';

export class MySQLPasswordResetRepository implements PasswordResetRepository {
  async create(resetData: Omit<PasswordReset, 'id' | 'createdAt'>): Promise<PasswordReset> {
    const id = uuidv4();
    const model = await PasswordResetModel.create({
      id,
      userId: resetData.userId,
      tokenHash: resetData.tokenHash,
      expiresAt: resetData.expiresAt,
      usedAt: resetData.usedAt,
      createdAt: new Date(),
    });
    return PasswordResetMapper.toDomain(model);
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordReset | null> {
    const model = await PasswordResetModel.findOne({ where: { tokenHash } });
    return model ? PasswordResetMapper.toDomain(model) : null;
  }

  async markAsUsed(id: string): Promise<void> {
    await PasswordResetModel.update({ usedAt: new Date() }, { where: { id } });
  }
}
