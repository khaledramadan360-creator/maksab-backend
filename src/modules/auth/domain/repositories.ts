import { Invite, User, Session, PasswordReset, AuditLog } from './entities';
import { InviteStatus, Role, UserStatus } from './enums';

// ─── Pagination ─────────────────────────────────────────────────────────────
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

// ─── List Filters ────────────────────────────────────────────────────────────
export interface UserListFilters {
  role?: Role;
  status?: UserStatus;
  email?: string;
}

export interface InviteListFilters {
  status?: InviteStatus;
  role?: Role;
  email?: string;
}

export interface AuditLogListFilters {
  action?: string;
  entityType?: string;
  actorUserId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// ─── Repository Contracts ────────────────────────────────────────────────────
export interface InviteRepository {
  create(invite: Omit<Invite, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invite>;
  findById(id: string): Promise<Invite | null>;
  findByEmail(email: string): Promise<Invite | null>;
  findByTokenHash(tokenHash: string): Promise<Invite | null>;
  updateStatus(id: string, status: InviteStatus): Promise<Invite>;
  save(invite: Invite): Promise<Invite>;
  list(filters: InviteListFilters, pagination: PaginationParams): Promise<PaginatedResult<Invite>>;
}

export interface UserRepository {
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  updateRole(id: string, role: Role): Promise<User>;
  updateStatus(id: string, status: UserStatus): Promise<User>;
  save(user: User): Promise<User>;
  list(filters: UserListFilters, pagination: PaginationParams): Promise<PaginatedResult<User>>;
}

export interface SessionRepository {
  create(session: Omit<Session, 'id' | 'createdAt'>): Promise<Session>;
  revokeById(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  findActiveByTokenHash(tokenHash: string): Promise<Session | null>;
}

export interface PasswordResetRepository {
  create(reset: Omit<PasswordReset, 'id' | 'createdAt'>): Promise<PasswordReset>;
  findByTokenHash(tokenHash: string): Promise<PasswordReset | null>;
  markAsUsed(id: string): Promise<void>;
}

export interface AuditLogRepository {
  create(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog>;
  listWithFilters(filters: Record<string, any>): Promise<AuditLog[]>;
  list(filters: AuditLogListFilters, pagination: PaginationParams): Promise<PaginatedResult<AuditLog>>;
}
