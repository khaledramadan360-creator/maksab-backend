import { UserRepository, AuditLogRepository, AuditLogListFilters } from '../../../domain/repositories';
import { AuthorizationError } from '../../errors';
import { Role, AuditAction } from '../../../domain/enums';
import { AuditLog } from '../../../domain/entities';

export interface AuditLogDto {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  actorUserId: string | null;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface ListAuditLogsInput {
  actorUserId: string;
  page?: number;
  pageSize?: number;
  action?: string;
  entityType?: string;
  actorUserIdFilter?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ListAuditLogsOutput {
  items: AuditLogDto[];
  total: number;
  page: number;
  pageSize: number;
}

const ALLOWED_ROLES: Role[] = [Role.Admin, Role.Manager];

function toAuditLogDto(log: AuditLog): AuditLogDto {
  return {
    id:          log.id,
    action:      log.action,
    entityType:  log.entityType,
    entityId:    log.entityId,
    actorUserId: log.actorUserId,
    metadata:    log.metadata,
    createdAt:   log.createdAt,
  };
}

export class ListAuditLogsUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly auditRepo: AuditLogRepository
  ) {}

  async execute(input: ListAuditLogsInput): Promise<ListAuditLogsOutput> {
    const actor = await this.userRepo.findById(input.actorUserId);
    if (!actor || !ALLOWED_ROLES.includes(actor.role)) {
      throw new AuthorizationError('You do not have permission to view audit logs');
    }

    const page     = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));

    const filters: AuditLogListFilters = {};
    if (input.action)            filters.action      = input.action;
    if (input.entityType)        filters.entityType  = input.entityType;
    if (input.actorUserIdFilter) filters.actorUserId = input.actorUserIdFilter;
    if (input.dateFrom)          filters.dateFrom    = new Date(input.dateFrom);
    if (input.dateTo)            filters.dateTo      = new Date(input.dateTo);

    const result = await this.auditRepo.list(filters, { page, pageSize });

    return {
      items: result.items.map(toAuditLogDto),
      total: result.total,
      page:  result.page,
      pageSize: result.pageSize,
    };
  }
}
