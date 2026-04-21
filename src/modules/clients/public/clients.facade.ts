import {
  ChangeClientOwnerRequestDto,
  ChangeClientStatusRequestDto,
  ClientDetailsDto,
  CreateClientFromSearchRequestDto,
  CreateClientRequestDto,
  CreateClientResultDto,
  DeleteClientRequestDto,
  GetClientByIdRequestDto,
  ListClientOwnerOptionsRequestDto,
  GetTeamClientsOverviewRequestDto,
  ClientOwnerOptionDto,
  ListClientsQueryDto,
  ListClientsResponseDto,
  TeamClientsOverviewDto,
  UpdateClientRequestDto,
} from './clients.types';

/**
 * Public gateway for the clients module.
 * This is the only contract other modules/controllers should consume.
 */
export interface ClientsFacade {
  createClient(input: CreateClientRequestDto): Promise<CreateClientResultDto>;
  createClientFromSearch(input: CreateClientFromSearchRequestDto): Promise<CreateClientResultDto>;
  updateClient(input: UpdateClientRequestDto): Promise<ClientDetailsDto>;
  deleteClient(input: DeleteClientRequestDto): Promise<void>;
  getClientById(input: GetClientByIdRequestDto): Promise<ClientDetailsDto | null>;
  listClients(input: ListClientsQueryDto): Promise<ListClientsResponseDto>;
  listClientOwnerOptions(input: ListClientOwnerOptionsRequestDto): Promise<ClientOwnerOptionDto[]>;
  changeClientStatus(input: ChangeClientStatusRequestDto): Promise<ClientDetailsDto>;
  changeClientOwner(input: ChangeClientOwnerRequestDto): Promise<ClientDetailsDto>;
  getTeamClientsOverview(input: GetTeamClientsOverviewRequestDto): Promise<TeamClientsOverviewDto[]>;
}
