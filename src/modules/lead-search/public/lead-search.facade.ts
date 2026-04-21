import { SearchLeadsUseCase } from '../application/use-cases/search-leads/search-leads.use-case';
import { PlatformSearchOrchestrator } from '../application/services/platform-search-orchestrator.service';
import { QueryPatternBuilderService } from '../application/services/query-pattern-builder.service';
import { SearchStopPolicyService } from '../application/services/search-stop-policy.service';
import { SearchOutputMapper } from '../application/mappers/search-output.mapper';

import { WebsiteSearchService } from '../infrastructure/platform-services/website-search.service';
import { LinkedinSearchService } from '../infrastructure/platform-services/linkedin-search.service';
import { FacebookSearchService } from '../infrastructure/platform-services/facebook-search.service';
import { InstagramSearchService } from '../infrastructure/platform-services/instagram-search.service';
import { XSearchService } from '../infrastructure/platform-services/x-search.service';
import { TiktokSearchService } from '../infrastructure/platform-services/tiktok-search.service';
import { SnapchatSearchService } from '../infrastructure/platform-services/snapchat-search.service';
import { WebsiteQueryBuilder } from '../infrastructure/query-builders/website-query-builder';
import { LinkedinQueryBuilder } from '../infrastructure/query-builders/linkedin-query-builder';
import { FacebookQueryBuilder } from '../infrastructure/query-builders/facebook-query-builder';
import { InstagramQueryBuilder } from '../infrastructure/query-builders/instagram-query-builder';
import { XQueryBuilder } from '../infrastructure/query-builders/x-query-builder';
import { TiktokQueryBuilder } from '../infrastructure/query-builders/tiktok-query-builder';
import { SnapchatQueryBuilder } from '../infrastructure/query-builders/snapchat-query-builder';
import { BrightDataSerpProvider } from '../infrastructure/providers/brightdata-serp.provider';
import { DefaultUrlNormalizer } from '../infrastructure/normalizers/url-normalizer';
import { DefaultResultDeduplicator } from '../infrastructure/deduplicators/result-deduplicator';
import { PlatformUrlFilter } from '../infrastructure/filters/platform-url.filter';
import { ClientOnlyResultFilter } from '../infrastructure/filters/client-only-result.filter';
import { RelevanceResultFilter } from '../infrastructure/filters/relevance-result.filter';
import { DefaultRelevanceRanker } from '../infrastructure/rankers/relevance-ranker';
import { MySQLAuditLogRepository } from '../../auth/infrastructure/repositories/mysql-audit-log.repository';

import { SearchPlatform } from '../domain/enums';
import { SearchRequest, LeadSearchOutput } from '../domain/entities';

/**
 * LeadSearchFacade
 *
 * The ONLY public entry point for the lead-search module.
 * Assembles all dependencies and exposes a single searchLeads() method.
 *
 * Consumers (API layer, other modules) MUST only interact through this facade.
 */
export class LeadSearchFacade {
  private readonly useCase: SearchLeadsUseCase;

  constructor() {
    const patternBuilder = new QueryPatternBuilderService();
    const provider = new BrightDataSerpProvider();
    const normalizer = new DefaultUrlNormalizer();
    const deduplicator = new DefaultResultDeduplicator(normalizer);
    const platformUrlFilter = new PlatformUrlFilter();
    const clientOnlyFilter = new ClientOnlyResultFilter();
    const relevanceFilter = new RelevanceResultFilter();
    const ranker = new DefaultRelevanceRanker();
    const stopPolicy = new SearchStopPolicyService();
    const auditRepo = new MySQLAuditLogRepository();

    const websiteService = new WebsiteSearchService(
      new WebsiteQueryBuilder(patternBuilder),
      provider,
      normalizer,
      deduplicator,
      platformUrlFilter,
      clientOnlyFilter,
      relevanceFilter,
      ranker,
      stopPolicy
    );

    const linkedinService = new LinkedinSearchService(
      new LinkedinQueryBuilder(patternBuilder),
      provider,
      normalizer,
      deduplicator,
      platformUrlFilter,
      clientOnlyFilter,
      relevanceFilter,
      ranker,
      stopPolicy
    );

    const facebookService = new FacebookSearchService(
      new FacebookQueryBuilder(patternBuilder),
      provider,
      normalizer,
      deduplicator,
      platformUrlFilter,
      clientOnlyFilter,
      relevanceFilter,
      ranker,
      stopPolicy
    );

    const instagramService = new InstagramSearchService(
      new InstagramQueryBuilder(patternBuilder),
      provider,
      normalizer,
      deduplicator,
      platformUrlFilter,
      clientOnlyFilter,
      relevanceFilter,
      ranker,
      stopPolicy
    );

    const xService = new XSearchService(
      new XQueryBuilder(patternBuilder),
      provider,
      normalizer,
      deduplicator,
      platformUrlFilter,
      clientOnlyFilter,
      relevanceFilter,
      ranker,
      stopPolicy
    );

    const tiktokService = new TiktokSearchService(
      new TiktokQueryBuilder(patternBuilder),
      provider,
      normalizer,
      deduplicator,
      platformUrlFilter,
      clientOnlyFilter,
      relevanceFilter,
      ranker,
      stopPolicy
    );

    const snapchatService = new SnapchatSearchService(
      new SnapchatQueryBuilder(patternBuilder),
      provider,
      normalizer,
      deduplicator,
      platformUrlFilter,
      clientOnlyFilter,
      relevanceFilter,
      ranker,
      stopPolicy
    );

    const orchestrator = new PlatformSearchOrchestrator();
    orchestrator.registerService(SearchPlatform.WEBSITE, websiteService);
    orchestrator.registerService(SearchPlatform.LINKEDIN, linkedinService);
    orchestrator.registerService(SearchPlatform.FACEBOOK, facebookService);
    orchestrator.registerService(SearchPlatform.INSTAGRAM, instagramService);
    orchestrator.registerService(SearchPlatform.X, xService);
    orchestrator.registerService(SearchPlatform.TIKTOK, tiktokService);
    orchestrator.registerService(SearchPlatform.SNAPCHAT, snapchatService);

    const outputMapper = new SearchOutputMapper();
    this.useCase = new SearchLeadsUseCase(orchestrator, outputMapper, auditRepo);
  }

  /**
   * Search for leads across selected platforms.
   * This is the only method exposed to the outside world.
   */
  public async searchLeads(request: SearchRequest): Promise<LeadSearchOutput> {
    return this.useCase.execute(request);
  }
}
