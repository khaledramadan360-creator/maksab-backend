export type ReportStatusDto = 'generating' | 'ready' | 'failed';
export type ReportFormatDto = 'pdf';
export type ReportTemplateKeyDto = 'default_client_report';
export type ReportPlatformDto =
  | 'website'
  | 'facebook'
  | 'instagram'
  | 'snapchat'
  | 'linkedin'
  | 'x'
  | 'tiktok';

export interface RequestActorContext {
  actorUserId: string;
  actorUserRole: string;
}

export interface ClientReportDto {
  id: string;
  clientId: string;
  analysisId: string;
  ownerUserId: string;
  ownerName: string | null;
  templateKey: ReportTemplateKeyDto;
  status: ReportStatusDto;
  format: ReportFormatDto;
  pdfUrl: string | null;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportPreviewScreenshotDto {
  platform: ReportPlatformDto;
  platformUrl: string;
  publicUrl: string | null;
  captureStatus: 'pending' | 'captured' | 'failed';
  capturedAt: string | null;
}

export interface ReportPreviewPlatformScoreDto {
  platform: ReportPlatformDto;
  platformScore: number | null;
  summary: string | null;
}

export interface ReportPreviewDto {
  report: ClientReportDto;
  client: {
    id: string;
    name: string;
    saudiCity: string | null;
  };
  preview: {
    overallScore: number | null;
    analysisSummary: string | null;
    analyzedAt: string | null;
    platformScores: ReportPreviewPlatformScoreDto[];
    screenshots: ReportPreviewScreenshotDto[];
  };
}

export interface ReportsListItemDto {
  reportId: string;
  clientId: string;
  clientName: string;
  ownerUserId: string;
  ownerName: string | null;
  status: ReportStatusDto;
  generatedAt: string | null;
  updatedAt: string;
}

export interface ReportsListRequestDto {
  keyword?: string;
  ownerUserId?: string;
  status?: ReportStatusDto;
  generatedAtFrom?: string;
  generatedAtTo?: string;
  page: number;
  pageSize: number;
}

export interface ListReportsQueryDto
  extends RequestActorContext,
    ReportsListRequestDto {}

export interface ReportsListResponseDto {
  items: ReportsListItemDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GenerateClientReportRequestDto
  extends RequestActorContext {
  clientId: string;
}

export interface GetClientReportRequestDto
  extends RequestActorContext {
  clientId: string;
}

export interface GetReportByIdRequestDto
  extends RequestActorContext {
  reportId: string;
}

export interface DeleteClientReportRequestDto
  extends RequestActorContext {
  reportId: string;
}
