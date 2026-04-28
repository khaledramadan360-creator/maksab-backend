import { Router } from 'express';
import { JwtService } from '../auth/application/services/jwt.interface';
import { ClientEmailCampaignsController } from './api/client-email-campaigns.controller';
import { createClientEmailCampaignsAuthMiddleware } from './api/client-email-campaigns.middleware';
import { createClientEmailCampaignsRoutes } from './api/client-email-campaigns.routes';
import { clientEmailCampaignsErrorMiddleware } from './api/client-email-campaigns.error-mapper';
import { ClientEmailCampaignInputService } from './application/services/client-email-campaign-input.service';
import { ClientEmailCampaignMapperService } from './application/services/client-email-campaign-mapper.service';
import { GetClientEmailCampaignDetailsUseCase } from './application/use-cases/get-client-email-campaign-details.use-case';
import { ListClientEmailCampaignsUseCase } from './application/use-cases/list-client-email-campaigns.use-case';
import { PreviewClientEmailCampaignUseCase } from './application/use-cases/preview-client-email-campaign.use-case';
import { SendClientEmailCampaignUseCase } from './application/use-cases/send-client-email-campaign.use-case';
import {
  ClientEmailCampaignPermissionService,
  ClientEmailOverridePolicyService,
  ClientEmailRecipientEligibilityService,
  EmailTemplateRendererService,
} from './domain/services';
import { BrevoMarketingHttpGateway } from './infrastructure/providers/brevo-marketing.gateway';
import { MySQLClientCampaignClientRepository } from './infrastructure/repositories/mysql-client-campaign-client.repository';
import { MySQLClientEmailCampaignAuditLogRepository } from './infrastructure/repositories/mysql-client-email-campaign-audit-log.repository';
import { MySQLClientEmailCampaignRecipientRepository } from './infrastructure/repositories/mysql-client-email-campaign-recipient.repository';
import { MySQLClientEmailCampaignRepository } from './infrastructure/repositories/mysql-client-email-campaign.repository';
import { MySQLEmailSuppressionRepository } from './infrastructure/repositories/mysql-email-suppression.repository';

export function initClientEmailCampaignsModule(jwtService: JwtService): {
  router: Router;
  errorMiddleware: any;
} {
  const clientRepo = new MySQLClientCampaignClientRepository();
  const campaignRepo = new MySQLClientEmailCampaignRepository();
  const recipientRepo = new MySQLClientEmailCampaignRecipientRepository();
  const suppressionRepo = new MySQLEmailSuppressionRepository();
  const auditRepo = new MySQLClientEmailCampaignAuditLogRepository();

  const permissionService = new ClientEmailCampaignPermissionService();
  const overridePolicy = new ClientEmailOverridePolicyService();
  const eligibilityService = new ClientEmailRecipientEligibilityService(permissionService, overridePolicy);
  const inputService = new ClientEmailCampaignInputService();
  const mapper = new ClientEmailCampaignMapperService();
  const templateRenderer = new EmailTemplateRendererService();
  const brevoGateway = new BrevoMarketingHttpGateway(templateRenderer);

  const previewUseCase = new PreviewClientEmailCampaignUseCase(
    clientRepo,
    suppressionRepo,
    auditRepo,
    permissionService,
    eligibilityService,
    inputService,
    mapper
  );
  const sendUseCase = new SendClientEmailCampaignUseCase(
    clientRepo,
    campaignRepo,
    recipientRepo,
    suppressionRepo,
    auditRepo,
    brevoGateway,
    permissionService,
    overridePolicy,
    eligibilityService,
    inputService
  );
  const listUseCase = new ListClientEmailCampaignsUseCase(campaignRepo, mapper);
  const detailsUseCase = new GetClientEmailCampaignDetailsUseCase(campaignRepo, recipientRepo, mapper);

  const controller = new ClientEmailCampaignsController(
    previewUseCase,
    sendUseCase,
    listUseCase,
    detailsUseCase
  );
  const authenticate = createClientEmailCampaignsAuthMiddleware(jwtService);
  const router = createClientEmailCampaignsRoutes(controller, authenticate);

  return {
    router,
    errorMiddleware: clientEmailCampaignsErrorMiddleware,
  };
}

export type {
  ClientEmailCampaignBaseRequestDto,
  ClientEmailCampaignDetailsDto,
  ClientEmailCampaignDto,
  ClientEmailCampaignRecipientDto,
  ListClientEmailCampaignsQueryDto,
  ListClientEmailCampaignsResponseDto,
  PreviewClientEmailCampaignRequestDto,
  PreviewClientEmailCampaignResponseDto,
  RecipientPreviewDto,
  RequestActorContext,
  SendClientEmailCampaignRequestDto,
  SendClientEmailCampaignResponseDto,
} from './public/client-email-campaigns.types';
