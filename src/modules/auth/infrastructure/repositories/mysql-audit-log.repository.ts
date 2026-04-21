import { AuditLog } from '../../domain/entities';
import { AuditLogRepository, AuditLogListFilters, PaginationParams, PaginatedResult } from '../../domain/repositories';
import { AuditLogModel } from '../persistence/models/audit-log.model';
import { AuditLogMapper } from '../mappers/auth.mapper';
import { v4 as uuidv4 } from 'uuid';
import { Op, WhereOptions } from 'sequelize';

export class MySQLAuditLogRepository implements AuditLogRepository {
  async create(logData: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const id = uuidv4();
    const model = await AuditLogModel.create({
      id,
      actorUserId: logData.actorUserId,
      action: logData.action,
      entityType: logData.entityType,
      entityId: logData.entityId,
      metadataJson: logData.metadata,
      createdAt: new Date(),
    });
    return AuditLogMapper.toDomain(model);
  }

  async listWithFilters(filters: Record<string, any>): Promise<AuditLog[]> {
    const whereClause: Record<string, any> = {};
    if (filters.action)      whereClause.action      = filters.action;
    if (filters.entityType)  whereClause.entityType  = filters.entityType;
    if (filters.actorUserId) whereClause.actorUserId = filters.actorUserId;

    const models = await AuditLogModel.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: filters.limit || 50,
    });

    return models.map(AuditLogMapper.toDomain);
  }

  async list(filters: AuditLogListFilters, pagination: PaginationParams): Promise<PaginatedResult<AuditLog>> {
    const where: WhereOptions = {};
    if (filters.action)      where['action']      = filters.action;
    if (filters.entityType)  where['entityType']  = filters.entityType;
    if (filters.actorUserId) where['actorUserId'] = filters.actorUserId;

    if (filters.dateFrom || filters.dateTo) {
      const dateRange: Record<symbol, Date> = {};
      if (filters.dateFrom) dateRange[Op.gte] = filters.dateFrom;
      if (filters.dateTo) {
        const endOfDay = new Date(filters.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        dateRange[Op.lte] = endOfDay;
      }
      (where as any)['createdAt'] = dateRange;
    }

    const offset = (pagination.page - 1) * pagination.pageSize;
    const { count, rows } = await AuditLogModel.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: pagination.pageSize,
      offset,
    });

    return {
      items: rows.map(AuditLogMapper.toDomain),
      total: count,
      page: pagination.page,
      pageSize: pagination.pageSize,
    };
  }
}
