import { ClientReport, ReportRenderPayload, TeamReportOverviewItem } from '../../domain/entities';
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

export interface ReportPreviewResult {
  report: ClientReport;
  payload: ReportRenderPayload;
  resolvedPdfUrl?: string | null;
}

export interface ListReportsResult extends PaginatedResult<TeamReportOverviewItem> {}
