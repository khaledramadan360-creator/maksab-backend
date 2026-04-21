import { Router } from 'express';
import { LeadSearchFacade } from './public/lead-search.facade';
import { LeadSearchController } from './api/lead-search.controller';
import { createLeadSearchRoutes } from './api/lead-search.routes';
import { createLeadSearchAuthMiddleware, createLeadSearchExecuteAuthorizationMiddleware } from './api/lead-search.middleware';
import { leadSearchErrorMiddleware } from './api/lead-search.error-mapper';
import { JwtService } from '../auth/application/services/jwt.interface';
import { MySQLAuditLogRepository } from '../auth/infrastructure/repositories/mysql-audit-log.repository';

/**
 * Initialises the lead-search module and returns its HTTP router + error middleware.
 * jwtService is injected from the auth module to share the same token verification.
 */
export function initLeadSearchModule(jwtService: JwtService): {
  router: Router;
  errorMiddleware: any;
} {
  const facade = new LeadSearchFacade();
  const controller = new LeadSearchController(facade);
  const auditRepo = new MySQLAuditLogRepository();
  const authenticate = createLeadSearchAuthMiddleware(jwtService);
  const authorizeExecute = createLeadSearchExecuteAuthorizationMiddleware(auditRepo);
  const router = createLeadSearchRoutes(controller, authenticate, authorizeExecute);

  return { router, errorMiddleware: leadSearchErrorMiddleware };
}

/**
 * lead-search module public boundary.
 * ONLY the facade and public types are exported.
 */
export { LeadSearchFacade } from './public/lead-search.facade';
export type { SearchRequest, LeadSearchOutput, PlatformSearchResult, CandidateResult } from './public/lead-search.types';
export { SearchPlatform, SupportedSaudiCity, RequestedResultsCount, ResultType } from './public/lead-search.types';
