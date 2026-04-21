export type AnalysisStatusDto = 'pending' | 'completed' | 'failed';
export type AnalysisScreenshotStatusDto = 'pending' | 'captured' | 'failed';
export type AnalysisPlatformDto =
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

export interface ClientPlatformAnalysisDto {
  platform: AnalysisPlatformDto;
  platformUrl: string;
  platformScore: number | null;
  summary: string | null;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface ClientAnalysisScreenshotDto {
  platform: AnalysisPlatformDto;
  platformUrl: string;
  supabasePath: string | null;
  publicUrl: string | null;
  captureStatus: AnalysisScreenshotStatusDto;
  capturedAt: string | null;
}

export interface ClientAnalysisDto {
  id: string;
  clientId: string;
  ownerUserId: string;
  status: AnalysisStatusDto;
  summary: string | null;
  overallScore: number | null;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  analyzedAt: string | null;
  createdAt: string;
  updatedAt: string;
  platformAnalyses: ClientPlatformAnalysisDto[];
  screenshots: ClientAnalysisScreenshotDto[];
}

export interface RunClientAnalysisRequestDto extends RequestActorContext {
  clientId: string;
}

export interface GetClientAnalysisRequestDto extends RequestActorContext {
  clientId: string;
}

export interface DeleteClientAnalysisRequestDto extends RequestActorContext {
  clientId: string;
}

export interface TeamAnalysisOverviewItemDto {
  clientId: string;
  clientName: string;
  ownerUserId: string;
  ownerName: string;
  overallScore: number | null;
  analyzedAt: string | null;
  hasAnalysis: boolean;
}

export interface TeamAnalysisOverviewRequestDto {
  keyword?: string;
  ownerUserId?: string;
  hasAnalysis?: boolean;
  page: number;
  pageSize: number;
}

export interface GetTeamAnalysisOverviewRequestDto
  extends RequestActorContext,
    TeamAnalysisOverviewRequestDto {}

export interface TeamAnalysisOverviewResponseDto {
  items: TeamAnalysisOverviewItemDto[];
  total: number;
  page: number;
  pageSize: number;
}
