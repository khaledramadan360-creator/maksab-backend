import {
  AnalysisResultPayload,
  ClientAnalysis,
  ClientAnalysisScreenshot,
  ClientPlatformAnalysis,
  ScrapedPlatformInput,
  TeamAnalysisOverviewItem,
} from './entities';
import { AnalysisScreenshotStatus, AnalysisSourcePlatform, AnalysisStatus, AuditAction } from './enums';

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TeamAnalysisOverviewFilters {
  keyword?: string;
  ownerUserId?: string;
  hasAnalysis?: boolean;
}

export interface ClientAnalysisCreateRecord {
  clientId: string;
  ownerUserId: string;
  status: AnalysisStatus;
  summary: string | null;
  overallScore: number | null;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  analyzedAt: Date | null;
}

export interface ClientPlatformAnalysisCreateRecord {
  platform: AnalysisSourcePlatform;
  platformUrl: string;
  platformScore: number | null;
  summary: string | null;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface ClientAnalysisScreenshotCreateRecord {
  platform: AnalysisSourcePlatform;
  platformUrl: string;
  supabasePath: string | null;
  publicUrl: string | null;
  captureStatus: AnalysisScreenshotStatus;
  capturedAt: Date | null;
}

export interface ReplaceClientAnalysisRecord {
  analysis: ClientAnalysisCreateRecord;
  platformAnalyses: ClientPlatformAnalysisCreateRecord[];
}

export interface ClientAnalysisRepository {
  create(record: ClientAnalysisCreateRecord): Promise<ClientAnalysis>;
  replaceForClient(clientId: string, record: ReplaceClientAnalysisRecord): Promise<ClientAnalysis>;
  findByClientId(clientId: string): Promise<ClientAnalysis | null>;
  deleteByClientId(clientId: string): Promise<void>;
  listTeamOverview(
    filters: TeamAnalysisOverviewFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<TeamAnalysisOverviewItem>>;
}

export interface ClientPlatformAnalysisRepository {
  saveForAnalysis(
    clientAnalysisId: string,
    platformAnalyses: ClientPlatformAnalysisCreateRecord[]
  ): Promise<ClientPlatformAnalysis[]>;
  deleteByClientAnalysisId(clientAnalysisId: string): Promise<void>;
  findByClientAnalysisId(clientAnalysisId: string): Promise<ClientPlatformAnalysis[]>;
}

export interface ClientAnalysisScreenshotRepository {
  saveForAnalysis(
    clientAnalysisId: string,
    screenshots: ClientAnalysisScreenshotCreateRecord[]
  ): Promise<ClientAnalysisScreenshot[]>;
  findByClientAnalysisId(clientAnalysisId: string): Promise<ClientAnalysisScreenshot[]>;
  deleteByClientAnalysisId(clientAnalysisId: string): Promise<void>;
}

export interface ClientLinksSnapshot {
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  snapchatUrl?: string | null;
  linkedinUrl?: string | null;
  xUrl?: string | null;
  tiktokUrl?: string | null;
}

export interface ClientForAnalysisLookup {
  id: string;
  name: string;
  ownerUserId: string;
  ownerName?: string | null;
  saudiCity: string;
  links: ClientLinksSnapshot;
}

export interface ClientsLookupRepository {
  existsById(clientId: string): Promise<boolean>;
  findClientForAnalysis(clientId: string): Promise<ClientForAnalysisLookup | null>;
}

export interface AnalysisAuditLogEntry {
  actorUserId: string | null;
  action: AuditAction;
  entityType: 'client_analysis';
  entityId: string;
  metadata: Record<string, unknown>;
}

export interface AuditLogRepository {
  createAuditLog(entry: AnalysisAuditLogEntry): Promise<void>;
}

export interface AnalyzeClientDataInput {
  clientId: string;
  clientName: string;
  saudiCity: string;
  scrapedPlatforms: ScrapedPlatformInput[];
}

export interface AnalysisAiProviderContract {
  analyzeClientData(input: AnalyzeClientDataInput): Promise<AnalysisResultPayload>;
}

export interface ScrapeClientPlatformsInput {
  clientId: string;
  platformLinks: Partial<Record<AnalysisSourcePlatform, string>>;
}

export interface ClientScrapingProviderContract {
  scrapeClientPlatforms(input: ScrapeClientPlatformsInput): Promise<ScrapedPlatformInput[]>;
}

export interface CapturedPlatformScreenshot {
  platform: AnalysisSourcePlatform;
  platformUrl: string;
  contentType: string;
  fileExtension: string;
  data: Buffer;
  capturedAt: Date;
}

export interface PlatformScreenshotProviderContract {
  capturePlatformScreenshot(
    platform: AnalysisSourcePlatform,
    platformUrl: string
  ): Promise<CapturedPlatformScreenshot>;
}

export interface UploadScreenshotInput {
  path: string;
  contentType: string;
  data: Buffer;
}

export interface UploadScreenshotResult {
  path: string;
  publicUrl: string;
}

export interface AnalysisScreenshotStorageProviderContract {
  uploadScreenshot(input: UploadScreenshotInput): Promise<UploadScreenshotResult>;
  deleteScreenshot(path: string): Promise<void>;
  deleteAnalysisScreenshots(paths: string[]): Promise<void>;
  getAccessibleUrl(path: string): Promise<string>;
}

export interface WebsitePageSpeedCategoryScores {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
}

export interface WebsitePageSpeedKeyAudit {
  id: string;
  title: string;
  score: number | null;
  numericValue: number | null;
  displayValue: string | null;
}

export interface WebsitePageSpeedStrategyResult {
  strategy: 'mobile' | 'desktop';
  fetchedAt: string;
  categories: WebsitePageSpeedCategoryScores;
  keyAudits: WebsitePageSpeedKeyAudit[];
}

export interface WebsitePageSpeedResult {
  url: string;
  mobile: WebsitePageSpeedStrategyResult | null;
  desktop: WebsitePageSpeedStrategyResult | null;
  aggregate: WebsitePageSpeedCategoryScores;
}

export interface WebsitePageSpeedProviderContract {
  analyzeWebsite(url: string): Promise<WebsitePageSpeedResult | null>;
}
