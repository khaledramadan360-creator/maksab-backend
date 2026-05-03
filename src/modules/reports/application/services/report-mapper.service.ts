import {
  GetWhatChimpPhoneNumberOptionsResult,
  ReportPreviewResult,
  SendReportToWhatChimpResult,
} from '../dto/reports.commands';
import {
  ClientReportDto,
  ReportPreviewDto,
  ReportsListItemDto,
  ReportsListResponseDto,
  SendReportToWhatChimpResponseDto,
  WhatChimpPhoneNumberOptionDto,
  WhatChimpPhoneNumberOptionsDto,
} from '../../public/reports.types';
import { TeamReportOverviewItem } from '../../domain/entities';
import { PaginatedResult } from '../../domain/repositories';

export class ReportMapperService {
  toReportPreviewDto(result: ReportPreviewResult): ReportPreviewDto {
    return {
      report: this.toClientReportDto(
        result.report,
        result.payload.client.ownerName,
        result.resolvedPdfUrl === undefined ? result.report.pdfUrl : result.resolvedPdfUrl
      ),
      client: {
        id: result.payload.client.id,
        name: result.payload.client.name,
        saudiCity: result.payload.client.saudiCity,
      },
      preview: {
        overallScore: result.payload.analysis.overallScore,
        analysisSummary: result.payload.analysis.summary,
        analyzedAt: result.payload.analysis.analyzedAt
          ? result.payload.analysis.analyzedAt.toISOString()
          : null,
        platformScores: result.payload.analysis.platformAnalyses.map(item => ({
          platform: item.platform as ReportPreviewDto['preview']['platformScores'][number]['platform'],
          platformScore: item.platformScore,
          summary: item.summary,
        })),
        screenshots: result.payload.screenshots.map(item => ({
          platform: item.platform as ReportPreviewDto['preview']['screenshots'][number]['platform'],
          platformUrl: item.platformUrl,
          publicUrl: item.publicUrl,
          captureStatus:
            item.captureStatus as ReportPreviewDto['preview']['screenshots'][number]['captureStatus'],
          capturedAt: item.capturedAt ? item.capturedAt.toISOString() : null,
        })),
      },
    };
  }

  toReportsListResponseDto(result: PaginatedResult<TeamReportOverviewItem>): ReportsListResponseDto {
    return {
      items: result.items.map(item => this.toReportsListItemDto(item)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  toWhatChimpPhoneNumberOptionsDto(
    result: GetWhatChimpPhoneNumberOptionsResult
  ): WhatChimpPhoneNumberOptionsDto {
    return {
      options: result.options.map(option => this.toWhatChimpPhoneNumberOptionDto(option)),
      defaultPhoneNumberId: result.defaultPhoneNumberId,
      allowCustomPhoneNumberId: result.allowCustomPhoneNumberId,
    };
  }

  toSendReportToWhatChimpResponseDto(
    result: SendReportToWhatChimpResult
  ): SendReportToWhatChimpResponseDto {
    return {
      success: result.success,
      status: result.status,
      attemptId: result.attemptId,
      reportId: result.reportId,
      clientId: result.clientId,
      recipientPhone: result.recipientPhone,
      recipientSource: result.recipientSource,
      provider: result.provider,
      providerMessageId: result.providerMessageId,
      providerStatusCode: result.providerStatusCode,
      failureReason: result.failureReason,
      whatchimpPhoneNumberId: result.whatchimpPhoneNumberId,
      resolvedWhatChimpAccountId: result.resolvedWhatChimpAccountId,
      createdAt: result.createdAt.toISOString(),
    };
  }

  private toClientReportDto(
    report: {
      id: string;
      clientId: string;
      analysisId: string;
      ownerUserId: string;
      templateKey: string;
      status: string;
      format: string;
      pdfUrl: string | null;
      generatedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
    ownerName: string | null,
    pdfUrl: string | null
  ): ClientReportDto {
    return {
      id: report.id,
      clientId: report.clientId,
      analysisId: report.analysisId,
      ownerUserId: report.ownerUserId,
      ownerName,
      templateKey: report.templateKey as ClientReportDto['templateKey'],
      status: report.status as ClientReportDto['status'],
      format: report.format as ClientReportDto['format'],
      pdfUrl,
      generatedAt: report.generatedAt ? report.generatedAt.toISOString() : null,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    };
  }

  private toReportsListItemDto(item: TeamReportOverviewItem): ReportsListItemDto {
    return {
      reportId: item.reportId,
      clientId: item.clientId,
      clientName: item.clientName,
      ownerUserId: item.ownerUserId,
      ownerName: item.ownerName,
      status: item.status as ReportsListItemDto['status'],
      generatedAt: item.generatedAt ? item.generatedAt.toISOString() : null,
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private toWhatChimpPhoneNumberOptionDto(option: {
    id: string;
    name: string | null;
    phoneNumber: string | null;
    label: string;
    isDefault: boolean;
  }): WhatChimpPhoneNumberOptionDto {
    return {
      id: option.id,
      name: option.name,
      phoneNumber: option.phoneNumber,
      label: option.label,
      isDefault: option.isDefault,
    };
  }
}
