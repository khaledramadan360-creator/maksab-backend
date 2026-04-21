import { Router } from 'express';
import { JwtService } from '../auth/application/services/jwt.interface';
import { MarketingSeasonsFacade } from './public/marketing-seasons.facade';
import { MarketingSeasonsFacadeImpl } from './public/marketing-seasons.facade.impl';
import { MarketingSeasonsController } from './api/marketing-seasons.controller';
import { createMarketingSeasonsRoutes } from './api/marketing-seasons.routes';
import { createMarketingSeasonsAuthMiddleware } from './api/marketing-seasons.middleware';
import { marketingSeasonsErrorMiddleware } from './api/marketing-seasons.error-mapper';
import { MySQLMarketingSeasonRepository } from './infrastructure/repositories/mysql-marketing-season.repository';
import { MySQLMarketingSeasonsUsersLookupRepository } from './infrastructure/repositories/mysql-marketing-seasons-users-lookup.repository';
import { MySQLMarketingSeasonsAuditLogRepository } from './infrastructure/repositories/mysql-marketing-seasons-audit-log.repository';
import { MarketingSeasonOwnershipService } from './application/services/marketing-season-ownership.service';
import { MarketingSeasonActivationService } from './application/services/marketing-season-activation.service';
import { MarketingSeasonMapperService } from './application/services/marketing-season-mapper.service';
import { CreateMarketingSeasonUseCase } from './application/use-cases/create-marketing-season.use-case';
import { UpdateMarketingSeasonUseCase } from './application/use-cases/update-marketing-season.use-case';
import { DeleteMarketingSeasonUseCase } from './application/use-cases/delete-marketing-season.use-case';
import { ListMarketingSeasonsUseCase } from './application/use-cases/list-marketing-seasons.use-case';
import { GetMarketingSeasonByIdUseCase } from './application/use-cases/get-marketing-season-by-id.use-case';
import { ActivateMarketingSeasonUseCase } from './application/use-cases/activate-marketing-season.use-case';
import { GetActiveMarketingSeasonUseCase } from './application/use-cases/get-active-marketing-season.use-case';

export function initMarketingSeasonsModule(jwtService: JwtService): {
  router: Router;
  errorMiddleware: any;
  facade: MarketingSeasonsFacade;
} {
  const seasonRepo = new MySQLMarketingSeasonRepository();
  const usersLookupRepo = new MySQLMarketingSeasonsUsersLookupRepository();
  const auditRepo = new MySQLMarketingSeasonsAuditLogRepository();

  const ownershipService = new MarketingSeasonOwnershipService();
  const activationService = new MarketingSeasonActivationService(seasonRepo);
  const mapper = new MarketingSeasonMapperService();

  const createMarketingSeasonUseCase = new CreateMarketingSeasonUseCase(
    seasonRepo,
    usersLookupRepo,
    auditRepo,
    ownershipService
  );
  const updateMarketingSeasonUseCase = new UpdateMarketingSeasonUseCase(
    seasonRepo,
    auditRepo,
    ownershipService
  );
  const deleteMarketingSeasonUseCase = new DeleteMarketingSeasonUseCase(
    seasonRepo,
    auditRepo,
    ownershipService
  );
  const listMarketingSeasonsUseCase = new ListMarketingSeasonsUseCase(
    seasonRepo,
    ownershipService
  );
  const getMarketingSeasonByIdUseCase = new GetMarketingSeasonByIdUseCase(
    seasonRepo,
    ownershipService
  );
  const activateMarketingSeasonUseCase = new ActivateMarketingSeasonUseCase(
    seasonRepo,
    auditRepo,
    ownershipService,
    activationService
  );
  const getActiveMarketingSeasonUseCase = new GetActiveMarketingSeasonUseCase(
    seasonRepo,
    ownershipService
  );

  const facade = new MarketingSeasonsFacadeImpl(
    mapper,
    createMarketingSeasonUseCase,
    updateMarketingSeasonUseCase,
    deleteMarketingSeasonUseCase,
    listMarketingSeasonsUseCase,
    getMarketingSeasonByIdUseCase,
    activateMarketingSeasonUseCase,
    getActiveMarketingSeasonUseCase
  );

  const controller = new MarketingSeasonsController(facade);
  const authenticate = createMarketingSeasonsAuthMiddleware(jwtService);
  const router = createMarketingSeasonsRoutes(controller, authenticate);

  return {
    router,
    errorMiddleware: marketingSeasonsErrorMiddleware,
    facade,
  };
}

export type { MarketingSeasonsFacade } from './public/marketing-seasons.facade';
export type {
  MarketingSeasonStatusDto,
  RequestActorContext,
  MarketingSeasonDto,
  MarketingSeasonListItemDto,
  ActiveMarketingSeasonDto,
  MarketingSeasonsListRequestDto,
  MarketingSeasonsListResponseDto,
  CreateMarketingSeasonRequestDto,
  UpdateMarketingSeasonRequestDto,
  DeleteMarketingSeasonRequestDto,
  GetMarketingSeasonByIdRequestDto,
  ActivateMarketingSeasonRequestDto,
  GetActiveMarketingSeasonRequestDto,
  ListMarketingSeasonsQueryDto,
} from './public/marketing-seasons.types';

