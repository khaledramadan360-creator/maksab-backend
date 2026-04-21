import { Invite } from '../../domain/entities';
import { InviteStatus } from '../../domain/enums';
import { InviteRepository, InviteListFilters, PaginationParams, PaginatedResult } from '../../domain/repositories';
import { InviteModel } from '../persistence/models/invite.model';
import { InviteMapper } from '../mappers/auth.mapper';
import { v4 as uuidv4 } from 'uuid';
import { Op, WhereOptions } from 'sequelize';

export class MySQLInviteRepository implements InviteRepository {
  async create(inviteData: Omit<Invite, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invite> {
    const id = uuidv4();
    const model = await InviteModel.create({
      id,
      email: inviteData.email,
      role: inviteData.role,
      status: inviteData.status,
      tokenHash: inviteData.tokenHash,
      expiresAt: inviteData.expiresAt,
      invitedByUserId: inviteData.invitedByUserId,
      acceptedUserId: inviteData.acceptedUserId,
      acceptedAt: inviteData.acceptedAt,
      revokedAt: inviteData.revokedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return InviteMapper.toDomain(model);
  }

  async findById(id: string): Promise<Invite | null> {
    const model = await InviteModel.findByPk(id);
    return model ? InviteMapper.toDomain(model) : null;
  }

  async findByEmail(email: string): Promise<Invite | null> {
    const model = await InviteModel.findOne({ where: { email }, order: [['createdAt', 'DESC']] });
    return model ? InviteMapper.toDomain(model) : null;
  }

  async findByTokenHash(tokenHash: string): Promise<Invite | null> {
    const model = await InviteModel.findOne({ where: { tokenHash } });
    return model ? InviteMapper.toDomain(model) : null;
  }

  async updateStatus(id: string, status: InviteStatus): Promise<Invite> {
    const model = await InviteModel.findByPk(id);
    if (!model) throw new Error('Invite not found');
    model.status = status;
    await model.save();
    return InviteMapper.toDomain(model);
  }

  async save(invite: Invite): Promise<Invite> {
    const model = await InviteModel.findByPk(invite.id);
    if (model) {
      await model.update({
        email: invite.email,
        role: invite.role,
        status: invite.status,
        tokenHash: invite.tokenHash,
        expiresAt: invite.expiresAt,
        invitedByUserId: invite.invitedByUserId,
        acceptedUserId: invite.acceptedUserId,
        acceptedAt: invite.acceptedAt,
        revokedAt: invite.revokedAt,
      });
      return InviteMapper.toDomain(model);
    }
    throw new Error('Cannot save non-existent invite, use create');
  }

  async list(filters: InviteListFilters, pagination: PaginationParams): Promise<PaginatedResult<Invite>> {
    const where: WhereOptions = {};
    if (filters.status) where['status'] = filters.status;
    if (filters.role)   where['role']   = filters.role;
    if (filters.email)  where['email']  = { [Op.like]: `%${filters.email}%` };

    const offset = (pagination.page - 1) * pagination.pageSize;
    const { count, rows } = await InviteModel.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: pagination.pageSize,
      offset,
    });

    return {
      items: rows.map(InviteMapper.toDomain),
      total: count,
      page: pagination.page,
      pageSize: pagination.pageSize,
    };
  }
}
