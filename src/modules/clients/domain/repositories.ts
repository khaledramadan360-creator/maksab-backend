import {
  Client,
  ClientLinks,
  ClientOwnerOption,
  ClientSummary,
  DuplicateMatchedBy,
  TeamClientOverviewItem,
} from './entities';
import {
  AuditAction,
  ClientPlatform,
  ClientSourceModule,
  ClientStatus,
  ClientType,
} from './enums';

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

export interface ClientsListFilters {
  keyword?: string;
  status?: ClientStatus;
  clientType?: ClientType;
  ownerUserId?: string;
  primaryPlatform?: ClientPlatform;
  saudiCity?: string;
  includeArchived?: boolean;
  createdAtFrom?: Date;
  createdAtTo?: Date;
}

export interface DuplicateCheckInput {
  mobile?: string | null;
  email?: string | null;
  socialProfileUrls?: Partial<Record<ClientPlatform, string>>;
  websiteDomain?: string | null;
  excludeClientId?: string;
}

export interface ClientCreateRecord {
  name: string;
  clientType: ClientType;
  mobile: string | null;
  whatsapp: string | null;
  email: string | null;
  saudiCity: string;
  notes: string | null;
  primaryPlatform: ClientPlatform;
  status: ClientStatus;
  sourceModule: ClientSourceModule;
  sourcePlatform: ClientPlatform;
  sourceUrl: string;
  links: Omit<ClientLinks, 'clientId'>;
  ownerUserId: string;
}

export interface ClientUpdatePatch {
  name?: string;
  clientType?: ClientType;
  mobile?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  saudiCity?: string;
  notes?: string | null;
  primaryPlatform?: ClientPlatform;
  sourceUrl?: string;
  links?: Partial<Omit<ClientLinks, 'clientId'>>;
}

export interface DuplicateMatch {
  matchedBy: DuplicateMatchedBy;
  clientId: string;
  matchedFields: string[];
}

export interface ClientsRepository {
  create(record: ClientCreateRecord): Promise<Client>;
  update(clientId: string, patch: ClientUpdatePatch): Promise<Client>;
  delete(clientId: string): Promise<void>;
  findById(clientId: string): Promise<Client | null>;
  list(filters: ClientsListFilters, pagination: PaginationParams): Promise<PaginatedResult<ClientSummary>>;
  changeStatus(clientId: string, newStatus: ClientStatus): Promise<Client>;
  changeOwner(clientId: string, newOwnerUserId: string): Promise<Client>;
  existsDuplicate(input: DuplicateCheckInput): Promise<boolean>;
  findDuplicateMatches(input: DuplicateCheckInput): Promise<DuplicateMatch[]>;
  getTeamOverview(): Promise<TeamClientOverviewItem[]>;
}

export type ClientLinksPayload = Omit<ClientLinks, 'clientId'>;
export type ClientLinksPatch = Partial<ClientLinksPayload>;

export interface ClientLinksRepository {
  saveLinks(clientId: string, links: ClientLinksPayload): Promise<ClientLinks>;
  updateLinks(clientId: string, patch: ClientLinksPatch): Promise<ClientLinks>;
  getLinksByClientId(clientId: string): Promise<ClientLinks | null>;
}

export interface ClientAuditLogEntry {
  actorUserId: string | null;
  action: AuditAction;
  entityType: 'client';
  entityId: string;
  metadata: Record<string, any>;
}

export interface AuditLogRepository {
  createAuditLog(entry: ClientAuditLogEntry): Promise<void>;
}

export interface UserLookupResult {
  id: string;
  fullName: string;
}

export interface UsersLookupRepository {
  existsById(userId: string): Promise<boolean>;
  canOwnClients(userId: string): Promise<boolean>;
  findByIds(userIds: string[]): Promise<UserLookupResult[]>;
  listAssignableOwners(search?: string, limit?: number): Promise<ClientOwnerOption[]>;
}
