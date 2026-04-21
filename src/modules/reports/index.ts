import { Router } from 'express';
import { JwtService } from '../auth/application/services/jwt.interface';
import { ReportsFacade } from './public/reports.facade';
import { ReportsFacadeImpl } from './public/reports.facade.impl';
import { ReportsController } from './api/reports.controller';
import { createReportsRoutes } from './api/reports.routes';
import { createReportsAuthMiddleware } from './api/reports.middleware';
import { reportsErrorMiddleware } from './api/reports.error-mapper';
import { MySQLClientReportRepository } from './infrastructure/repositories/mysql-client-report.repository';
import { MySQLReportsClientsLookupRepository } from './infrastructure/repositories/mysql-reports-clients-lookup.repository';
import { MySQLReportsAnalysisLookupRepository } from './infrastructure/repositories/mysql-reports-analysis-lookup.repository';
import { MySQLReportsAuditLogRepository } from './infrastructure/repositories/mysql-reports-audit-log.repository';
import { MySQLReportsMarketingSeasonsLookupRepository } from './infrastructure/repositories/mysql-reports-marketing-seasons-lookup.repository';
import { ReportTemplateProvider } from './infrastructure/providers/report-template.provider';
import { ReportRendererProvider } from './infrastructure/providers/report-renderer.provider';
import { ReportPdfProvider } from './infrastructure/providers/report-pdf.provider';
import { ReportPdfStorageProvider } from './infrastructure/providers/report-pdf-storage.provider';
import { ClientReportOwnershipService } from './application/services/client-report-ownership.service';
import { ReportRenderPayloadBuilderService } from './application/services/report-render-payload-builder.service';
import { ClientReportOrchestratorService } from './application/services/client-report-orchestrator.service';
import { ClientReportReplacementService } from './application/services/client-report-replacement.service';
import { ReportMapperService } from './application/services/report-mapper.service';
import { GenerateClientReportUseCase } from './application/use-cases/generate-client-report.use-case';
import { GetClientReportUseCase } from './application/use-cases/get-client-report.use-case';
import { GetReportByIdUseCase } from './application/use-cases/get-report-by-id.use-case';
import { ListReportsUseCase } from './application/use-cases/list-reports.use-case';
import { DeleteClientReportUseCase } from './application/use-cases/delete-client-report.use-case';

export function initReportsModule(jwtService: JwtService): {
  router: Router;
  errorMiddleware: any;
  facade: ReportsFacade;
} {
  const reportRepo = new MySQLClientReportRepository();
  const clientsLookupRepo = new MySQLReportsClientsLookupRepository();
  const analysisLookupRepo = new MySQLReportsAnalysisLookupRepository();
  const marketingSeasonsLookupRepo = new MySQLReportsMarketingSeasonsLookupRepository();
  const auditRepo = new MySQLReportsAuditLogRepository();

  const templateProvider = new ReportTemplateProvider();
  const rendererProvider = new ReportRendererProvider();
  const pdfProvider = new ReportPdfProvider();
  const pdfStorageProvider = new ReportPdfStorageProvider();

  const ownershipService = new ClientReportOwnershipService();
  const payloadBuilderService = new ReportRenderPayloadBuilderService(
    clientsLookupRepo,
    analysisLookupRepo,
    marketingSeasonsLookupRepo
  );
  const orchestratorService = new ClientReportOrchestratorService(
    payloadBuilderService,
    templateProvider,
    rendererProvider,
    pdfProvider
  );
  const replacementService = new ClientReportReplacementService(reportRepo, pdfStorageProvider);
  const mapper = new ReportMapperService();

  const generateClientReportUseCase = new GenerateClientReportUseCase(
    clientsLookupRepo,
    analysisLookupRepo,
    ownershipService,
    orchestratorService,
    replacementService,
    auditRepo
  );
  const getClientReportUseCase = new GetClientReportUseCase(
    clientsLookupRepo,
    reportRepo,
    payloadBuilderService,
    ownershipService,
    pdfStorageProvider,
    auditRepo
  );
  const getReportByIdUseCase = new GetReportByIdUseCase(
    reportRepo,
    clientsLookupRepo,
    payloadBuilderService,
    ownershipService,
    pdfStorageProvider,
    auditRepo
  );
  const listReportsUseCase = new ListReportsUseCase(reportRepo, ownershipService);
  const deleteClientReportUseCase = new DeleteClientReportUseCase(
    reportRepo,
    pdfStorageProvider,
    ownershipService,
    auditRepo
  );

  const facade = new ReportsFacadeImpl(
    mapper,
    generateClientReportUseCase,
    getClientReportUseCase,
    getReportByIdUseCase,
    listReportsUseCase,
    deleteClientReportUseCase
  );

  const controller = new ReportsController(facade);
  const authenticate = createReportsAuthMiddleware(jwtService);
  const router = createReportsRoutes(controller, authenticate);

  return {
    router,
    errorMiddleware: reportsErrorMiddleware,
    facade,
  };
}

export type { ReportsFacade } from './public/reports.facade';
export type {
  ReportStatusDto,
  ReportFormatDto,
  ReportTemplateKeyDto,
  ReportPlatformDto,
  RequestActorContext,
  ClientReportDto,
  ReportPreviewScreenshotDto,
  ReportPreviewPlatformScoreDto,
  ReportPreviewDto,
  ReportsListItemDto,
  ReportsListRequestDto,
  ListReportsQueryDto,
  ReportsListResponseDto,
  GenerateClientReportRequestDto,
  GetClientReportRequestDto,
  GetReportByIdRequestDto,
  DeleteClientReportRequestDto,
} from './public/reports.types';
