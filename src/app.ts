import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initAuthModule } from './modules/auth';
import { initLeadSearchModule } from './modules/lead-search';
import { initClientsModule } from './modules/clients';
import { initAnalysisModule } from './modules/analysis';
import { initReportsModule } from './modules/reports';
import { initMarketingSeasonsModule } from './modules/marketing-seasons';
import { initSystemSettingsModule } from './modules/system-settings';
import { JsonWebTokenService } from './modules/auth/infrastructure/services/jsonwebtoken.service';
import {
  resolveAnalysisScreenshotsFilesBaseUrl,
  resolveAnalysisScreenshotsStorageRootPath,
} from './modules/analysis/infrastructure/providers/local-screenshot-storage.provider';
import {
  resolveReportsFilesBaseUrl,
  resolveReportsStorageRootPath,
} from './modules/reports/infrastructure/providers/report-pdf-storage.provider';

/**
 * Creates and configures the Express application.
 */
export function createApp(): Express {
  const app = express();

  // Basic Middlewares
  app.use(cors());
  app.use(express.json());

  const reportsStorageRootPath = resolveReportsStorageRootPath();
  const reportsFilesBaseUrl = resolveReportsFilesBaseUrl();
  const reportsFilesMountPath = /^https?:\/\//i.test(reportsFilesBaseUrl)
    ? '/api/v1/reports-files'
    : reportsFilesBaseUrl.startsWith('/')
      ? reportsFilesBaseUrl
      : `/${reportsFilesBaseUrl}`;

  app.use(
    reportsFilesMountPath,
    express.static(reportsStorageRootPath, {
      index: false,
    })
  );

  const analysisScreenshotsStorageRootPath = resolveAnalysisScreenshotsStorageRootPath();
  const analysisScreenshotsFilesBaseUrl = resolveAnalysisScreenshotsFilesBaseUrl();
  const analysisScreenshotsMountPath = /^https?:\/\//i.test(analysisScreenshotsFilesBaseUrl)
    ? '/api/v1/analysis-screenshots'
    : analysisScreenshotsFilesBaseUrl.startsWith('/')
      ? analysisScreenshotsFilesBaseUrl
      : `/${analysisScreenshotsFilesBaseUrl}`;

  app.use(
    analysisScreenshotsMountPath,
    express.static(analysisScreenshotsStorageRootPath, {
      index: false,
    })
  );

  // Initialize Modules (Composition Roots)
  const authModule = initAuthModule();

  // Share JwtService with modules that require authentication
  const jwtService = new JsonWebTokenService(process.env.JWT_ACCESS_SECRET || 'dev_secret_access');
  const leadSearchModule = initLeadSearchModule(jwtService);
  const systemSettingsModule = initSystemSettingsModule(jwtService);
  const analysisModule = initAnalysisModule(jwtService, {
    systemPromptSource: systemSettingsModule.facade,
  });
  const clientsModule = initClientsModule(jwtService);
  const reportsModule = initReportsModule(jwtService);
  const marketingSeasonsModule = initMarketingSeasonsModule(jwtService);

  // Mount API Routers
  app.use('/api/v1/auth', authModule.router);
  app.use('/api/v1/lead-search', leadSearchModule.router);
  app.use('/api/v1/system-settings', systemSettingsModule.router);
  app.use('/api/v1/clients', analysisModule.router);
  app.use('/api/v1/clients', clientsModule.router);
  app.use('/api/v1', reportsModule.router);
  app.use('/api/v1/marketing-seasons', marketingSeasonsModule.router);

  // Mount error handlers per module path to avoid cross-module error swallowing.
  app.use('/api/v1/auth', authModule.errorMiddleware);
  app.use('/api/v1/lead-search', leadSearchModule.errorMiddleware);
  app.use('/api/v1/system-settings', systemSettingsModule.errorMiddleware);
  app.use('/api/v1/clients', analysisModule.errorMiddleware);
  app.use('/api/v1/clients', clientsModule.errorMiddleware);
  app.use('/api/v1', reportsModule.errorMiddleware);
  app.use('/api/v1/marketing-seasons', marketingSeasonsModule.errorMiddleware);

  // Fallback 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } });
  });

  return app;
}
