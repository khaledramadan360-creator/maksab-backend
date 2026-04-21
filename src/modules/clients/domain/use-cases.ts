import {
  Client,
  ClientSummary,
  DuplicateCheckResult,
  SaveClientFromSearchInput,
  TeamClientOverviewItem,
} from './entities';
import { ClientPlatform, ClientSourceModule, ClientStatus, ClientType } from './enums';
import { ClientsListFilters, PaginationParams, PaginatedResult } from './repositories';

export interface CreateClientInput {
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
  ownerUserId: string;
}

export interface UpdateClientInput {
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
}

export interface DeleteClientInput {
  clientId: string;
}

export interface GetClientByIdInput {
  clientId: string;
}

export interface ListClientsInput {
  filters: ClientsListFilters;
  pagination: PaginationParams;
}

export interface ChangeClientStatusInput {
  clientId: string;
  status: ClientStatus;
}

export interface ChangeClientOwnerInput {
  clientId: string;
  newOwnerUserId: string;
}

export interface CheckClientDuplicateInput {
  mobile?: string | null;
  email?: string | null;
  sourceUrl?: string | null;
  links?: Partial<Record<ClientPlatform, string>>;
}

export interface IClientsUseCases {
  createClient(input: CreateClientInput): Promise<Client>;
  createClientFromSearch(input: SaveClientFromSearchInput): Promise<Client>;
  updateClient(input: UpdateClientInput): Promise<Client>;
  deleteClient(input: DeleteClientInput): Promise<void>;
  getClientById(input: GetClientByIdInput): Promise<Client | null>;
  listClients(input: ListClientsInput): Promise<PaginatedResult<ClientSummary>>;
  changeClientStatus(input: ChangeClientStatusInput): Promise<Client>;
  changeClientOwner(input: ChangeClientOwnerInput): Promise<Client>;
  checkClientDuplicate(input: CheckClientDuplicateInput): Promise<DuplicateCheckResult>;
  getTeamClientsOverview(): Promise<TeamClientOverviewItem[]>;
}
