import { ClientPlatform, ClientSourceModule, ClientStatus, ClientType } from '../../domain/enums';
import {
  Client,
  ClientOwnerOption,
  ClientSummary,
  DuplicateCheckResult,
  TeamClientOverviewItem,
} from '../../domain/entities';
import { ClientsListFilters, PaginatedResult } from '../../domain/repositories';

export interface ActorContext {
  actorUserId: string;
  actorUserRole: string;
}

export interface CreateClientCommand extends ActorContext {
  name: string;
  clientType: ClientType;
  mobile?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  saudiCity: string;
  notes?: string | null;
  primaryPlatform: ClientPlatform;
  sourceModule: ClientSourceModule;
  sourcePlatform: ClientPlatform;
  sourceUrl: string;
  links?: Partial<Record<string, string | null | undefined>>;
  forceCreateIfDuplicate?: boolean;
}

export interface CreateClientFromSearchCommand extends ActorContext {
  name: string;
  clientType: ClientType;
  mobile?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  saudiCity: string;
  notes?: string | null;
  sourcePlatform: ClientPlatform;
  sourceUrl: string;
  links?: Partial<Record<string, string | null | undefined>>;
  forceCreateIfDuplicate?: boolean;
}

export interface UpdateClientCommand extends ActorContext {
  clientId: string;
  name?: string;
  clientType?: ClientType;
  mobile?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  saudiCity?: string;
  notes?: string | null;
  primaryPlatform?: ClientPlatform;
  sourceUrl?: string;
  links?: Partial<Record<string, string | null | undefined>>;
}

export interface GetClientByIdQuery extends ActorContext {
  clientId: string;
}

export interface ListClientsQuery extends ActorContext {
  filters: ClientsListFilters;
  page?: number;
  pageSize?: number;
}

export interface ListClientOwnerOptionsQuery extends ActorContext {
  keyword?: string;
  limit?: number;
}

export interface ChangeClientStatusCommand extends ActorContext {
  clientId: string;
  status: ClientStatus;
}

export interface ChangeClientOwnerCommand extends ActorContext {
  clientId: string;
  newOwnerUserId: string;
}

export interface DeleteClientCommand extends ActorContext {
  clientId: string;
}

export interface CreateClientResult {
  client: Client;
  duplicateWarning?: DuplicateCheckResult;
}

export interface ListClientsResult extends PaginatedResult<ClientSummary> {}

export interface TeamOverviewResult extends Array<TeamClientOverviewItem> {}

export interface ListClientOwnerOptionsResult extends Array<ClientOwnerOption> {}

export interface BulkCreateClientsCommand extends ActorContext {
  clients: CreateClientCommand[];
  forceCreateIfDuplicate?: boolean;
}

export interface BulkCreateClientResultItem {
  rowIndex: number;
  status: 'created' | 'failed';
  client?: Client;
  duplicateWarning?: DuplicateCheckResult | null;
  error?: {
    code: string;
    message: string;
    field?: string | null;
  };
  inputSnapshot: {
    name?: string;
    email?: string | null;
    mobile?: string | null;
  };
}

export interface BulkCreateClientsResult {
  summary: {
    total: number;
    created: number;
    failed: number;
  };
  results: BulkCreateClientResultItem[];
}

