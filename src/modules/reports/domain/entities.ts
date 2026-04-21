import {
  ReportFormat,
  ReportStatus,
  ReportTemplateKey,
} from './enums';

export interface ClientReport {
  id: string;
  clientId: string;
  analysisId: string;
  ownerUserId: string;
  templateKey: ReportTemplateKey;
  status: ReportStatus;
  format: ReportFormat;
  pdfPath: string | null;
  pdfUrl: string | null;
  generatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportClientSnapshot {
  id: string;
  name: string;
  ownerUserId: string;
  ownerName: string | null;
  saudiCity: string | null;
}

export interface ReportAnalysisPlatformSnapshot {
  platform: string;
  platformUrl: string;
  platformScore: number | null;
  summary: string | null;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface ReportAnalysisSnapshot {
  id: string;
  summary: string | null;
  overallScore: number | null;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  analyzedAt: Date | null;
  platformAnalyses: ReportAnalysisPlatformSnapshot[];
}

export interface ReportScreenshotSnapshot {
  platform: string;
  platformUrl: string;
  publicUrl: string | null;
  captureStatus: string;
  capturedAt: Date | null;
}

export interface ReportMarketingSeasonSnapshot {
  id: string;
  title: string;
  description: string | null;
}

export interface ReportRenderPayload {
  client: ReportClientSnapshot;
  analysis: ReportAnalysisSnapshot;
  screenshots: ReportScreenshotSnapshot[];
  marketingSeason?: ReportMarketingSeasonSnapshot | null;
}

export interface ReportTemplateDefinition {
  templateKey: ReportTemplateKey;
  templateName: string;
  htmlTemplate: string;
  cssTemplate: string;
}

export interface GenerateClientReportInput {
  clientId: string;
  actorUserId: string;
}

export interface TeamReportOverviewItem {
  reportId: string;
  clientId: string;
  clientName: string;
  ownerUserId: string;
  ownerName: string | null;
  status: ReportStatus;
  generatedAt: Date | null;
  updatedAt: Date;
}
