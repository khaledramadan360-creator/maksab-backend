import { Router } from 'express';
import { JwtService } from '../auth/application/services/jwt.interface';
import { SystemSettingsFacade } from './public/system-settings.facade';
import { SystemSettingsFacadeImpl } from './public/system-settings.facade.impl';
import { SystemSettingsController } from './api/system-settings.controller';
import { createSystemSettingsRoutes } from './api/system-settings.routes';
import { createSystemSettingsAuthMiddleware } from './api/system-settings.middleware';
import { systemSettingsErrorMiddleware } from './api/system-settings.error-mapper';
import { MySQLSystemSettingsRepository } from './infrastructure/repositories/mysql-system-settings.repository';
import { MySQLSystemSettingsAuditLogRepository } from './infrastructure/repositories/mysql-system-settings-audit-log.repository';
import { SystemSettingsAccessService } from './application/services/system-settings-access.service';
import { SystemSettingsMapperService } from './application/services/system-settings-mapper.service';
import { GetSystemSettingsUseCase } from './application/use-cases/get-system-settings.use-case';
import { UpdateSystemSettingsUseCase } from './application/use-cases/update-system-settings.use-case';
import { GetAnalysisGeminiSystemPromptUseCase } from './application/use-cases/get-analysis-gemini-system-prompt.use-case';

export function initSystemSettingsModule(jwtService: JwtService): {
  router: Router;
  errorMiddleware: any;
  facade: SystemSettingsFacade;
} {
  const settingsRepo = new MySQLSystemSettingsRepository();
  const auditRepo = new MySQLSystemSettingsAuditLogRepository();

  const accessService = new SystemSettingsAccessService();
  const mapper = new SystemSettingsMapperService();

  const getSystemSettingsUseCase = new GetSystemSettingsUseCase(settingsRepo, accessService);
  const updateSystemSettingsUseCase = new UpdateSystemSettingsUseCase(
    settingsRepo,
    auditRepo,
    accessService
  );
  const getAnalysisGeminiSystemPromptUseCase = new GetAnalysisGeminiSystemPromptUseCase(
    settingsRepo
  );

  const facade = new SystemSettingsFacadeImpl(
    mapper,
    getSystemSettingsUseCase,
    updateSystemSettingsUseCase,
    getAnalysisGeminiSystemPromptUseCase
  );

  const controller = new SystemSettingsController(facade);
  const authenticate = createSystemSettingsAuthMiddleware(jwtService);
  const router = createSystemSettingsRoutes(controller, authenticate);

  return {
    router,
    errorMiddleware: systemSettingsErrorMiddleware,
    facade,
  };
}

export type {
  SystemSettingsFacade,
  SystemSettingsPromptReader,
} from './public/system-settings.facade';
export type {
  RequestActorContext,
  SystemSettingsDto,
  GetSystemSettingsRequestDto,
  UpdateSystemSettingsRequestDto,
} from './public/system-settings.types';
