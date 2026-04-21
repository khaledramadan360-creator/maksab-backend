import {
  MarketingSeason,
  MarketingSeasonSummary,
} from './entities';
import {
  AuditAction,
  MarketingSeasonStatus,
} from './enums';

export interface RepositoryActionOptions {
  transaction?: unknown;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MarketingSeasonsListFilters {
  keyword?: string;
  status?: MarketingSeasonStatus;
  ownerUserId?: string;
  createdAtFrom?: Date;
  createdAtTo?: Date;
}

export interface MarketingSeasonCreateRecord {
  title: string;
  description: string | null;
  status: MarketingSeasonStatus;
  ownerUserId: string;
}

export interface MarketingSeasonUpdatePatch {
  title?: string;
  description?: string | null;
}

export interface MarketingSeasonRepository {
  create(record: MarketingSeasonCreateRecord, options?: RepositoryActionOptions): Promise<MarketingSeason>;
  update(
    seasonId: string,
    patch: MarketingSeasonUpdatePatch,
    options?: RepositoryActionOptions
  ): Promise<MarketingSeason>;
  delete(seasonId: string, options?: RepositoryActionOptions): Promise<void>;
  findById(seasonId: string, options?: RepositoryActionOptions): Promise<MarketingSeason | null>;
  list(
    filters: MarketingSeasonsListFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<MarketingSeasonSummary>>;
  findActive(options?: RepositoryActionOptions): Promise<MarketingSeason | null>;
  deactivateAll(options?: RepositoryActionOptions): Promise<void>;
  activateById(seasonId: string, options?: RepositoryActionOptions): Promise<MarketingSeason>;
}

export interface UserLookupResult {
  id: string;
  role: string;
}

export interface UsersLookupRepository {
  existsById(userId: string): Promise<boolean>;
  findById(userId: string): Promise<UserLookupResult | null>;
}

export interface MarketingSeasonAuditLogEntry {
  actorUserId: string | null;
  action: AuditAction;
  entityType: 'marketing_season';
  entityId: string;
  metadata: Record<string, unknown>;
}

export interface AuditLogRepository {
  createAuditLog(entry: MarketingSeasonAuditLogEntry): Promise<void>;
}
