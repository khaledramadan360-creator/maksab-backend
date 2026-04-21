import { ClientAnalysisDetails, TeamAnalysisOverviewItem } from '../../domain/entities';
import { PaginatedResult } from '../../domain/repositories';
import {
  ClientAnalysisDto,
  ClientAnalysisScreenshotDto,
  ClientPlatformAnalysisDto,
  TeamAnalysisOverviewItemDto,
  TeamAnalysisOverviewResponseDto,
} from '../../public/analysis.types';

export class AnalysisMapperService {
  toClientAnalysisDto(details: ClientAnalysisDetails): ClientAnalysisDto {
    return {
      id: details.analysis.id,
      clientId: details.analysis.clientId,
      ownerUserId: details.analysis.ownerUserId,
      status: details.analysis.status,
      summary: details.analysis.summary,
      overallScore: details.analysis.overallScore,
      strengths: details.analysis.strengths,
      weaknesses: details.analysis.weaknesses,
      recommendations: details.analysis.recommendations,
      analyzedAt: details.analysis.analyzedAt ? details.analysis.analyzedAt.toISOString() : null,
      createdAt: details.analysis.createdAt.toISOString(),
      updatedAt: details.analysis.updatedAt.toISOString(),
      platformAnalyses: details.platformAnalyses.map(item => this.toPlatformAnalysisDto(item)),
      screenshots: details.screenshots.map(item => this.toScreenshotDto(item)),
    };
  }

  toTeamOverviewResponseDto(
    result: PaginatedResult<TeamAnalysisOverviewItem>
  ): TeamAnalysisOverviewResponseDto {
    return {
      items: result.items.map(item => this.toTeamOverviewItemDto(item)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  private toPlatformAnalysisDto(item: {
    platform: string;
    platformUrl: string;
    platformScore: number | null;
    summary: string | null;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }): ClientPlatformAnalysisDto {
    return {
      platform: item.platform as ClientPlatformAnalysisDto['platform'],
      platformUrl: item.platformUrl,
      platformScore: item.platformScore,
      summary: item.summary,
      strengths: item.strengths,
      weaknesses: item.weaknesses,
      recommendations: item.recommendations,
    };
  }

  private toTeamOverviewItemDto(item: TeamAnalysisOverviewItem): TeamAnalysisOverviewItemDto {
    return {
      clientId: item.clientId,
      clientName: item.clientName,
      ownerUserId: item.ownerUserId,
      ownerName: item.ownerName,
      overallScore: item.overallScore,
      analyzedAt: item.analyzedAt ? item.analyzedAt.toISOString() : null,
      hasAnalysis: item.hasAnalysis,
    };
  }

  private toScreenshotDto(item: {
    platform: string;
    platformUrl: string;
    supabasePath: string | null;
    publicUrl: string | null;
    captureStatus: string;
    capturedAt: Date | null;
  }): ClientAnalysisScreenshotDto {
    return {
      platform: item.platform as ClientAnalysisScreenshotDto['platform'],
      platformUrl: item.platformUrl,
      supabasePath: item.supabasePath,
      publicUrl: item.publicUrl,
      captureStatus: item.captureStatus as ClientAnalysisScreenshotDto['captureStatus'],
      capturedAt: item.capturedAt ? item.capturedAt.toISOString() : null,
    };
  }
}
