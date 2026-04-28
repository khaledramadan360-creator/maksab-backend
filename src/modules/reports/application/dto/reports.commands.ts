import { ClientReport, ReportRenderPayload, TeamReportOverviewItem } from '../../domain/entities';
import { DeliveryProvider, DeliveryStatus } from '../../domain/enums';
import { PaginatedResult, ReportsListFilters } from '../../domain/repositories';

export interface ActorContext {
  actorUserId: string;
  actorUserRole: string;
}

export interface GenerateClientReportCommand extends ActorContext {
  clientId: string;
}

export interface GetClientReportQuery extends ActorContext {
  clientId: string;
}

export interface GetReportByIdQuery extends ActorContext {
  reportId: string;
}

export interface ListReportsQuery extends ActorContext {
  filters: ReportsListFilters;
  page?: number;
  pageSize?: number;
}

export interface DeleteClientReportCommand extends ActorContext {
  reportId: string;
}

export type RecipientSource = 'whatsapp' | 'mobile' | 'custom';

export interface SendReportToWhatChimpCommand extends ActorContext {
  clientId: string;
  recipientPhone: string;
  recipientSource?: RecipientSource | null;
  recipientName?: string | null;
  messageText?: string | null;
}

export interface SendReportToWhatChimpResult {
  success: boolean;
  status: DeliveryStatus.Accepted | DeliveryStatus.Failed;
  attemptId: string;
  reportId: string;
  clientId: string;
  recipientPhone: string;
  recipientSource: RecipientSource | null;
  provider: DeliveryProvider.WhatChimp;
  providerMessageId: string | null;
  providerStatusCode: string | null;
  failureReason: string | null;
  createdAt: Date;
}

export interface ReportPreviewResult {
  report: ClientReport;
  payload: ReportRenderPayload;
  resolvedPdfUrl?: string | null;
}

export interface ListReportsResult extends PaginatedResult<TeamReportOverviewItem> {}
