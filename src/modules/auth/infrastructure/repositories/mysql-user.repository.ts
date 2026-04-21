import { User } from '../../domain/entities';
import { Role, UserStatus } from '../../domain/enums';
import { UserRepository, UserListFilters, PaginationParams, PaginatedResult } from '../../domain/repositories';
import { UserModel } from '../persistence/models/user.model';
import { UserMapper } from '../mappers/auth.mapper';
import { v4 as uuidv4 } from 'uuid';
import { Op, WhereOptions } from 'sequelize';

export class MySQLUserRepository implements UserRepository {
  async create(userOptions: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = uuidv4();
    const model = await UserModel.create({
      id,
      email: userOptions.email,
      fullName: userOptions.fullName,
      passwordHash: userOptions.passwordHash,
      role: userOptions.role,
      status: userOptions.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return UserMapper.toDomain(model);
  }

  async findById(id: string): Promise<User | null> {
    const model = await UserModel.findByPk(id);
    return model ? UserMapper.toDomain(model) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const model = await UserModel.findOne({ where: { email } });
    return model ? UserMapper.toDomain(model) : null;
  }

  async updateRole(id: string, role: Role): Promise<User> {
    const model = await UserModel.findByPk(id);
    if (!model) throw new Error('User not found');
    model.role = role;
    await model.save();
    return UserMapper.toDomain(model);
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    const model = await UserModel.findByPk(id);
    if (!model) throw new Error('User not found');
    model.status = status;
    await model.save();
    return UserMapper.toDomain(model);
  }

  async save(user: User): Promise<User> {
    let model = await UserModel.findByPk(user.id);
    if (model) {
      await model.update({
        email: user.email,
        fullName: user.fullName,
        passwordHash: user.passwordHash,
        role: user.role,
        status: user.status,
        updatedAt: new Date(),
      });
    } else {
      model = await UserModel.create({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        passwordHash: user.passwordHash,
        role: user.role,
        status: user.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    return UserMapper.toDomain(model);
  }

  async list(filters: UserListFilters, pagination: PaginationParams): Promise<PaginatedResult<User>> {
    const where: WhereOptions = {};
    if (filters.role)   where['role']   = filters.role;
    if (filters.status) where['status'] = filters.status;
    if (filters.email)  where['email']  = { [Op.like]: `%${filters.email}%` };

    const offset = (pagination.page - 1) * pagination.pageSize;
    const { count, rows } = await UserModel.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: pagination.pageSize,
      offset,
    });

    return {
      items: rows.map(UserMapper.toDomain),
      total: count,
      page: pagination.page,
      pageSize: pagination.pageSize,
    };
  }
}
