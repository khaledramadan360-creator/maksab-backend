import {
  ClientReport,
  GenerateClientReportInput,
  ReportDeliveryAttempt,
  TeamReportOverviewItem,
} from './entities';
import { DeliveryStatus } from './enums';
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

export interface SendReportToWhatChimpInput
  extends ReportsActorContext {
  clientId: string;
  recipientPhone: string;
  recipientSource?: string | null;
  recipientName?: string | null;
  messageText?: string | null;
}

export interface SendReportToWhatChimpResult {
  status: DeliveryStatus.Accepted | DeliveryStatus.Failed;
  accepted: boolean;
  attempt: ReportDeliveryAttempt;
  providerMessageId: string | null;
  providerStatusCode: string | null;
  failureReason: string | null;
}

export interface ListReportDeliveryAttemptsInput
  extends ReportsActorContext {
  reportId: string;
}

export interface IReportsUseCases {
  generateClientReport(input: GenerateClientReportCommand): Promise<ClientReport>;
  getClientReport(input: GetClientReportInput): Promise<ClientReport | null>;
  getReportById(input: GetReportByIdInput): Promise<ClientReport | null>;
  listReports(input: ListReportsInput): Promise<PaginatedResult<TeamReportOverviewItem>>;
  deleteClientReport(input: DeleteClientReportInput): Promise<void>;
  sendReportToWhatChimp(input: SendReportToWhatChimpInput): Promise<SendReportToWhatChimpResult>;
  listReportDeliveryAttempts(input: ListReportDeliveryAttemptsInput): Promise<ReportDeliveryAttempt[]>;
}
