import {
  ClientReport,
  GenerateClientReportInput,
  TeamReportOverviewItem,
} from './entities';
import {
  PaginatedResult,
  PaginationParams,
  ReportsListFilters,
} from './repositories';

export interface ReportsActorContext {
  actorUserId: string;
  actorUserRole: string;
}

export interface GenerateClientReportCommand
  extends GenerateClientReportInput {
  actorUserRole: string;
}

export interface GetClientReportInput
  extends ReportsActorContext {
  clientId: string;
}

export interface GetReportByIdInput
  extends ReportsActorContext {
  reportId: string;
}

export interface ListReportsInput
  extends ReportsActorContext {
  filters: ReportsListFilters;
  pagination: PaginationParams;
}

export interface DeleteClientReportInput
  extends ReportsActorContext {
  reportId: string;
}

export interface IReportsUseCases {
  generateClientReport(input: GenerateClientReportCommand): Promise<ClientReport>;
  getClientReport(input: GetClientReportInput): Promise<ClientReport | null>;
  getReportById(input: GetReportByIdInput): Promise<ClientReport | null>;
  listReports(input: ListReportsInput): Promise<PaginatedResult<TeamReportOverviewItem>>;
  deleteClientReport(input: DeleteClientReportInput): Promise<void>;
}
