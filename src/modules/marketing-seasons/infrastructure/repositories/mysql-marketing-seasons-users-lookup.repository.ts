import { UsersLookupRepository, UserLookupResult } from '../../domain/repositories';
import { UserModel } from '../../../auth/infrastructure/persistence/models/user.model';

export class MySQLMarketingSeasonsUsersLookupRepository implements UsersLookupRepository {
  async existsById(userId: string): Promise<boolean> {
    const count = await UserModel.count({
      where: { id: userId },
    });

    return count > 0;
  }

  async findById(userId: string): Promise<UserLookupResult | null> {
    const row = await UserModel.findByPk(userId, {
      attributes: ['id', 'role'],
      raw: true,
    });

    if (!row) {
      return null;
    }

    return {
      id: String((row as any).id),
      role: String((row as any).role),
    };
  }
}

