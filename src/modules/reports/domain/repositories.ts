import {
  ClientReport,
  ReportDeliveryAttempt,
  ReportMarketingSeasonSnapshot,
  ReportAnalysisSnapshot,
  ReportClientSnapshot,
  ReportRenderPayload,
  ReportScreenshotSnapshot,
  ReportTemplateDefinition,
  TeamReportOverviewItem,
} from './entities';
import {
  AuditAction,
  DeliveryProvider,
  DeliveryStatus,
  ReportFormat,
  ReportStatus,
  ReportTemplateKey,
} from './enums';

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

export interface ReportsListFilters {
  keyword?: string;
  ownerUserId?: string;
  status?: ReportStatus;
  generatedAtFrom?: Date;
  generatedAtTo?: Date;
}

export interface ClientReportCreateRecord {
  clientId: string;
  analysisId: string;
  ownerUserId: string;
  templateKey: ReportTemplateKey;
  status: ReportStatus;
  format: ReportFormat;
  pdfPath: string | null;
  pdfUrl: string | null;
  generatedAt: Date | null;
}

export interface ReplaceClientReportRecord {
  report: ClientReportCreateRecord;
}

export interface ClientReportRepository {
  create(record: ClientReportCreateRecord): Promise<ClientReport>;
  replaceForClient(clientId: string, record: ReplaceClientReportRecord): Promise<ClientReport>;
  findCurrentByClientId(clientId: string): Promise<ClientReport | null>;
  findByClientId(clientId: string): Promise<ClientReport | null>;
  findById(reportId: string): Promise<ClientReport | null>;
  list(
    filters: ReportsListFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<TeamReportOverviewItem>>;
  deleteById(reportId: string): Promise<void>;
}

export interface CreateReportDeliveryAttemptRecord {
  reportId: string;
  clientId: string;
  provider: DeliveryProvider;
  recipientPhone: string;
  recipientSource: string | null;
  recipientName: string | null;
  messageText: string | null;
  requestedByUserId: string;
}

export interface MarkReportDeliveryAttemptAcceptedRecord {
  providerMessageId?: string | null;
  providerStatusCode?: string | null;
}

export interface MarkReportDeliveryAttemptFailedRecord {
  failureReason: string;
  providerStatusCode?: string | null;
}

export interface ReportDeliveryAttemptRepository {
  createPending(record: CreateReportDeliveryAttemptRecord): Promise<ReportDeliveryAttempt>;
  markAccepted(attemptId: string, data: MarkReportDeliveryAttemptAcceptedRecord): Promise<ReportDeliveryAttempt>;
  markFailed(attemptId: string, data: MarkReportDeliveryAttemptFailedRecord): Promise<ReportDeliveryAttempt>;
  findLatestByClientId(clientId: string): Promise<ReportDeliveryAttempt | null>;
  findLatestByReportId(reportId: string): Promise<ReportDeliveryAttempt | null>;
  listByReportId(reportId: string): Promise<ReportDeliveryAttempt[]>;
}

export interface ReportsClientsLookupRepository {
  existsById(clientId: string): Promise<boolean>;
  findClientForReport(clientId: string): Promise<ReportClientSnapshot | null>;
}

export interface ReportsAnalysisLookupRepository {
  hasSavedAnalysis(clientId: string): Promise<boolean>;
  findLatestAnalysisForClient(clientId: string): Promise<ReportAnalysisSnapshot | null>;
  findSavedScreenshotsForClient(clientId: string): Promise<ReportScreenshotSnapshot[]>;
  getReportRenderPayload(clientId: string): Promise<ReportRenderPayload | null>;
}

export interface ReportsMarketingSeasonsLookupRepository {
  findActiveMarketingSeason(): Promise<ReportMarketingSeasonSnapshot | null>;
}

export interface ReportTemplateRepositoryContract {
  getTemplateByKey(templateKey: ReportTemplateKey): Promise<ReportTemplateDefinition | null>;
}

export interface ReportPdfFilePayload {
  data: Buffer;
  contentType: 'application/pdf';
}

export interface SavePdfInput {
  clientId: string;
  reportId: string;
  fileName: string;
  pdf: ReportPdfFilePayload;
}

export interface SavePdfResult {
  path: string;
  url: string;
}

export interface ReportPdfStorageProviderContract {
  savePdf(input: SavePdfInput): Promise<SavePdfResult>;
  replacePdf(previousPath: string, input: SavePdfInput): Promise<SavePdfResult>;
  deletePdf(path: string): Promise<void>;
  getAccessibleUrl(path: string): Promise<string>;
}

export type SendableReportFileReferenceType = 'url' | 'binary' | 'token';

export interface SendableReportFileReference {
  type: SendableReportFileReferenceType;
  url?: string;
  data?: Buffer;
  token?: string;
  fileName: string;
  contentType: 'application/pdf';
  sizeBytes?: number;
}

export interface WhatChimpPhoneNumberOption {
  id: string;
  name: string | null;
  phoneNumber: string | null;
  label: string;
  isDefault: boolean;
}

export interface FileReferenceResolver {
  resolveSendableFile(report: ClientReport): Promise<SendableReportFileReference>;
}

export interface WhatChimpSendDocumentCommand {
  recipientPhone: string;
  recipientName?: string | null;
  messageText?: string | null;
  whatchimpPhoneNumberId?: string | null;
  document: SendableReportFileReference;
  reportId: string;
  clientId: string;
  requestedByUserId: string;
}

export interface ProviderDispatchResult {
  accepted: boolean;
  providerMessageId?: string | null;
  providerStatusCode?: string | null;
  failureReason?: string | null;
  resolvedWhatChimpAccountId?: string | null;
  resolvedWhatChimpSenderValue?: string | null;
}

export interface WhatChimpGateway {
  getPhoneNumberOptions(): WhatChimpPhoneNumberOption[];
  getDefaultPhoneNumberId(): string | null;
  allowsCustomPhoneNumberId(): boolean;
  sendDocument(command: WhatChimpSendDocumentCommand): Promise<ProviderDispatchResult>;
}

export interface RenderHtmlInput {
  template: ReportTemplateDefinition;
  payload: ReportRenderPayload;
}

export interface RenderPdfInput {
  html: string;
  css: string;
}

export interface ReportRendererContract {
  renderHtml(input: RenderHtmlInput): Promise<string>;
}

export interface ReportPdfGeneratorContract {
  generatePdf(input: RenderPdfInput): Promise<ReportPdfFilePayload>;
}

export interface ReportAuditLogEntry {
  actorUserId: string | null;
  action: AuditAction;
  entityType: 'client_report' | 'report_delivery_attempt';
  entityId: string;
  metadata: Record<string, unknown>;
}

export interface AuditLogRepository {
  createAuditLog(entry: ReportAuditLogEntry): Promise<void>;
}
