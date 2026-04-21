import { Router } from 'express';
import { JwtService } from '../auth/application/services/jwt.interface';
import { SystemSettingsPromptReader } from '../system-settings';
import { AnalysisFacade } from './public/analysis.facade';
import { AnalysisFacadeImpl } from './public/analysis.facade.impl';
import { AnalysisController } from './api/analysis.controller';
import { createAnalysisRoutes } from './api/analysis.routes';
import { createAnalysisAuthMiddleware } from './api/analysis.middleware';
import { analysisErrorMiddleware } from './api/analysis.error-mapper';
import { MySQLClientAnalysisRepository } from './infrastructure/repositories/mysql-client-analysis.repository';
import { MySQLClientPlatformAnalysisRepository } from './infrastructure/repositories/mysql-client-platform-analysis.repository';
import { MySQLClientAnalysisScreenshotRepository } from './infrastructure/repositories/mysql-client-analysis-screenshot.repository';
import { MySQLAnalysisClientsLookupRepository } from './infrastructure/repositories/mysql-analysis-clients-lookup.repository';
import { MySQLAnalysisAuditLogRepository } from './infrastructure/repositories/mysql-analysis-audit-log.repository';
import { ClientScrapingProvider } from './infrastructure/providers/client-scraping.provider';
import { PlatformScreenshotProvider } from './infrastructure/providers/platform-screenshot.provider';
import { LocalScreenshotStorageProvider } from './infrastructure/providers/local-screenshot-storage.provider';
import { WebsitePageSpeedProvider } from './infrastructure/providers/website-pagespeed.provider';
import {
  AnalysisAiProvider,
  AnalysisAiSystemPromptSource,
} from './infrastructure/providers/analysis-ai.provider';
import { ScrapedDataNormalizationService } from './application/services/scraped-data-normalization.service';
import { ClientAnalysisOrchestratorService } from './application/services/client-analysis-orchestrator.service';
import { ClientAnalysisOwnershipService } from './application/services/client-analysis-ownership.service';
import { ClientAnalysisReplacementService } from './application/services/client-analysis-replacement.service';
import { AnalysisMapperService } from './application/services/analysis-mapper.service';
import { RunClientAnalysisUseCase } from './application/use-cases/run-client-analysis.use-case';
import { GetClientAnalysisUseCase } from './application/use-cases/get-client-analysis.use-case';
import { DeleteClientAnalysisUseCase } from './application/use-cases/delete-client-analysis.use-case';
import { GetTeamAnalysisOverviewUseCase } from './application/use-cases/get-team-analysis-overview.use-case';

export function initAnalysisModule(
  jwtService: JwtService,
  dependencies?: {
    systemPromptSource?: SystemSettingsPromptReader | AnalysisAiSystemPromptSource | null;
  }
): {
  router: Router;
  errorMiddleware: any;
  facade: AnalysisFacade;
} {
  const clientAnalysisRepo = new MySQLClientAnalysisRepository();
  const clientPlatformAnalysisRepo = new MySQLClientPlatformAnalysisRepository();
  const screenshotRepo = new MySQLClientAnalysisScreenshotRepository();
  const clientsLookupRepo = new MySQLAnalysisClientsLookupRepository();
  const auditRepo = new MySQLAnalysisAuditLogRepository();

  const scrapingProvider = new ClientScrapingProvider();
  const screenshotProvider = new PlatformScreenshotProvider();
  const screenshotStorageProvider = new LocalScreenshotStorageProvider();
  const websitePageSpeedProvider = new WebsitePageSpeedProvider();
  const analysisAiProvider = new AnalysisAiProvider(dependencies?.systemPromptSource ?? null);

  const normalizationService = new ScrapedDataNormalizationService();
  const orchestratorService = new ClientAnalysisOrchestratorService(
    scrapingProvider,
    screenshotProvider,
    screenshotStorageProvider,
    websitePageSpeedProvider,
    normalizationService,
    analysisAiProvider
  );
  const ownershipService = new ClientAnalysisOwnershipService();
  const replacementService = new ClientAnalysisReplacementService(
    clientAnalysisRepo,
    clientPlatformAnalysisRepo,
    screenshotRepo,
    screenshotStorageProvider
  );
  const mapper = new AnalysisMapperService();

  const runClientAnalysisUseCase = new RunClientAnalysisUseCase(
    clientsLookupRepo,
    ownershipService,
    orchestratorService,
    replacementService,
    auditRepo
  );
  const getClientAnalysisUseCase = new GetClientAnalysisUseCase(
    clientsLookupRepo,
    clientAnalysisRepo,
    clientPlatformAnalysisRepo,
    screenshotRepo,
    ownershipService
  );
  const deleteClientAnalysisUseCase = new DeleteClientAnalysisUseCase(
    clientsLookupRepo,
    clientAnalysisRepo,
    screenshotRepo,
    screenshotStorageProvider,
    ownershipService,
    auditRepo
  );
  const getTeamAnalysisOverviewUseCase = new GetTeamAnalysisOverviewUseCase(
    clientAnalysisRepo,
    ownershipService
  );

  const facade = new AnalysisFacadeImpl(
    mapper,
    runClientAnalysisUseCase,
    getClientAnalysisUseCase,
    deleteClientAnalysisUseCase,
    getTeamAnalysisOverviewUseCase
  );

  const controller = new AnalysisController(facade);
  const authenticate = createAnalysisAuthMiddleware(jwtService);
  const router = createAnalysisRoutes(controller, authenticate);

  return {
    router,
    errorMiddleware: analysisErrorMiddleware,
    facade,
  };
}

export type { AnalysisFacade } from './public/analysis.facade';
export type {
  AnalysisStatusDto,
  AnalysisScreenshotStatusDto,
  AnalysisPlatformDto,
  RequestActorContext,
  ClientPlatformAnalysisDto,
  ClientAnalysisScreenshotDto,
  ClientAnalysisDto,
  RunClientAnalysisRequestDto,
  GetClientAnalysisRequestDto,
  DeleteClientAnalysisRequestDto,
  TeamAnalysisOverviewItemDto,
  TeamAnalysisOverviewRequestDto,
  GetTeamAnalysisOverviewRequestDto,
  TeamAnalysisOverviewResponseDto,
} from './public/analysis.types';
