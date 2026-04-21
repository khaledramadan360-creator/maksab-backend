import { Op } from 'sequelize';
import { UsersLookupRepository, UserLookupResult } from '../../domain/repositories';
import { UserModel } from '../../../auth/infrastructure/persistence/models/user.model';
import { Role, UserStatus } from '../../../auth/domain/enums';
import { ClientOwnerOption } from '../../domain/entities';

const CLIENT_OWNER_ROLES = new Set<string>([Role.Admin, Role.Manager, Role.Employee]);

export class MySQLUsersLookupRepository implements UsersLookupRepository {
  async existsById(userId: string): Promise<boolean> {
    const count = await UserModel.count({ where: { id: userId } });
    return count > 0;
  }

  async canOwnClients(userId: string): Promise<boolean> {
    const user = await UserModel.findByPk(userId, {
      attributes: ['id', 'role', 'status'],
      raw: true,
    });

    if (!user) {
      return false;
    }

    const role = String((user as any).role);
    const status = String((user as any).status);
    return CLIENT_OWNER_ROLES.has(role) && status === UserStatus.Active;
  }

  async findByIds(userIds: string[]): Promise<UserLookupResult[]> {
    if (userIds.length === 0) {
      return [];
    }

    const rows = await UserModel.findAll({
      where: { id: { [Op.in]: userIds } },
      attributes: ['id', 'fullName'],
      raw: true,
    });

    return rows.map(row => ({
      id: String((row as any).id),
      fullName: String((row as any).fullName),
    }));
  }

  async listAssignableOwners(search?: string, limit = 100): Promise<ClientOwnerOption[]> {
    const normalizedLimit = Math.min(200, Math.max(1, Number(limit || 100)));
    const where: any = {
      status: UserStatus.Active,
      role: { [Op.in]: Array.from(CLIENT_OWNER_ROLES) },
    };

    if (search && search.trim() !== '') {
      const keyword = search.trim();
      where[Op.or] = [
        { fullName: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const rows = await UserModel.findAll({
      where,
      attributes: ['id', 'fullName', 'role'],
      order: [['fullName', 'ASC']],
      limit: normalizedLimit,
      raw: true,
    });

    return rows.map(row => ({
      id: String((row as any).id),
      fullName: String((row as any).fullName),
      role: String((row as any).role),
    }));
  }
}
