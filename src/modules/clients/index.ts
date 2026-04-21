import { Router } from 'express';
import { JwtService } from '../auth/application/services/jwt.interface';
import { ClientsFacade } from './public/clients.facade';
import { ClientsFacadeImpl } from './public/clients.facade.impl';
import { ClientsController } from './api/clients.controller';
import { createClientsRoutes } from './api/clients.routes';
import { createClientsAuthMiddleware } from './api/clients.middleware';
import { clientsErrorMiddleware } from './api/clients.error-mapper';
import { MySQLClientsRepository } from './infrastructure/repositories/mysql-clients.repository';
import { MySQLUsersLookupRepository } from './infrastructure/repositories/mysql-users-lookup.repository';
import { MySQLClientsAuditLogRepository } from './infrastructure/repositories/mysql-clients-audit-log.repository';
import { ClientDuplicateCheckService } from './application/services/client-duplicate-check.service';
import { ClientOwnershipService } from './application/services/client-ownership.service';
import { ClientStatusPolicyService } from './application/services/client-status-policy.service';
import { ClientLinkPolicyService } from './application/services/client-link-policy.service';
import { ClientMapperService } from './application/services/client-mapper.service';
import { SearchResultToClientInputMapper } from './application/mappers/search-result-to-client-input.mapper';
import { CreateClientUseCase } from './application/use-cases/create-client.use-case';
import { CreateClientFromSearchUseCase } from './application/use-cases/create-client-from-search.use-case';
import { UpdateClientUseCase } from './application/use-cases/update-client.use-case';
import { DeleteClientUseCase } from './application/use-cases/delete-client.use-case';
import { GetClientByIdUseCase } from './application/use-cases/get-client-by-id.use-case';
import { ListClientsUseCase } from './application/use-cases/list-clients.use-case';
import { ChangeClientStatusUseCase } from './application/use-cases/change-client-status.use-case';
import { ChangeClientOwnerUseCase } from './application/use-cases/change-client-owner.use-case';
import { GetTeamClientsOverviewUseCase } from './application/use-cases/get-team-clients-overview.use-case';
import { ListClientOwnerOptionsUseCase } from './application/use-cases/list-client-owner-options.use-case';

export function initClientsModule(jwtService: JwtService): {
  router: Router;
  errorMiddleware: any;
  facade: ClientsFacade;
} {
  const clientsRepo = new MySQLClientsRepository();
  const usersLookupRepo = new MySQLUsersLookupRepository();
  const auditRepo = new MySQLClientsAuditLogRepository();

  const duplicateService = new ClientDuplicateCheckService(clientsRepo);
  const ownershipService = new ClientOwnershipService();
  const statusPolicy = new ClientStatusPolicyService();
  const linkPolicy = new ClientLinkPolicyService();
  const mapper = new ClientMapperService();
  const searchResultMapper = new SearchResultToClientInputMapper();

  const createClient = new CreateClientUseCase(
    clientsRepo,
    usersLookupRepo,
    auditRepo,
    duplicateService,
    ownershipService,
    statusPolicy,
    linkPolicy
  );
  const createClientFromSearch = new CreateClientFromSearchUseCase(createClient, searchResultMapper);
  const updateClient = new UpdateClientUseCase(clientsRepo, auditRepo, ownershipService, linkPolicy);
  const deleteClient = new DeleteClientUseCase(clientsRepo, auditRepo, ownershipService);
  const getClientById = new GetClientByIdUseCase(clientsRepo, ownershipService);
  const listClients = new ListClientsUseCase(clientsRepo, ownershipService);
  const listClientOwnerOptions = new ListClientOwnerOptionsUseCase(usersLookupRepo, ownershipService);
  const changeClientStatus = new ChangeClientStatusUseCase(clientsRepo, auditRepo, ownershipService, statusPolicy);
  const changeClientOwner = new ChangeClientOwnerUseCase(clientsRepo, usersLookupRepo, auditRepo, ownershipService);
  const getTeamOverview = new GetTeamClientsOverviewUseCase(clientsRepo, ownershipService);

  const facade = new ClientsFacadeImpl(
    mapper,
    createClient,
    createClientFromSearch,
    updateClient,
    deleteClient,
    getClientById,
    listClients,
    listClientOwnerOptions,
    changeClientStatus,
    changeClientOwner,
    getTeamOverview
  );

  const controller = new ClientsController(facade);
  const authenticate = createClientsAuthMiddleware(jwtService);
  const router = createClientsRoutes(controller, authenticate);

  return {
    router,
    errorMiddleware: clientsErrorMiddleware,
    facade,
  };
}

export type { ClientsFacade } from './public/clients.facade';
export type {
  PublicClientDto,
  ClientListItemDto,
  ClientDetailsDto,
  TeamClientsOverviewDto,
  CreateClientRequestDto,
  CreateClientFromSearchRequestDto,
  UpdateClientRequestDto,
  ListClientsRequestDto,
  ListClientsQueryDto,
  ListClientsResponseDto,
  ChangeClientStatusRequestDto,
  ChangeClientOwnerRequestDto,
  DeleteClientRequestDto,
  GetClientByIdRequestDto,
  ListClientOwnerOptionsRequestDto,
  GetTeamClientsOverviewRequestDto,
  ClientOwnerOptionDto,
  CreateClientResultDto,
} from './public/clients.types';
