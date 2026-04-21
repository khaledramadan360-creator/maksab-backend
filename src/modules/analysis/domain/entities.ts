import { AnalysisScreenshotStatus, AnalysisSourcePlatform, AnalysisStatus } from './enums';

export interface ClientAnalysis {
  id: string;
  clientId: string;
  ownerUserId: string;
  status: AnalysisStatus;
  summary: string | null;
  overallScore: number | null;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  analyzedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientPlatformAnalysis {
  id: string;
  clientAnalysisId: string;
  platform: AnalysisSourcePlatform;
  platformUrl: string;
  platformScore: number | null;
  summary: string | null;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface ClientAnalysisScreenshot {
  id: string;
  clientAnalysisId: string;
  platform: AnalysisSourcePlatform;
  platformUrl: string;
  supabasePath: string | null;
  publicUrl: string | null;
  captureStatus: AnalysisScreenshotStatus;
  capturedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RunClientAnalysisInput {
  clientId: string;
  actorUserId: string;
}

export interface AnalysisPlatformResultPayload {
  platform: AnalysisSourcePlatform;
  platformUrl: string;
  platformScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface AnalysisResultPayload {
  summary: string;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  platformAnalyses: AnalysisPlatformResultPayload[];
}

export interface TeamAnalysisOverviewItem {
  clientId: string;
  clientName: string;
  ownerUserId: string;
  ownerName: string;
  overallScore: number | null;
  analyzedAt: Date | null;
  hasAnalysis: boolean;
}

export interface ScrapedPlatformInput {
  platform: AnalysisSourcePlatform;
  platformUrl: string;
  scrapedText: string;
  scrapedMetadata: Record<string, unknown>;
}

export interface ClientAnalysisDetails {
  analysis: ClientAnalysis;
  platformAnalyses: ClientPlatformAnalysis[];
  screenshots: ClientAnalysisScreenshot[];
}
