import {
  DeleteClientReportRequestDto,
  GenerateClientReportRequestDto,
  GetClientReportRequestDto,
  GetReportByIdRequestDto,
  ListReportsQueryDto,
  ReportPreviewDto,
  ReportsListResponseDto,
  SendReportToWhatChimpRequestDto,
  SendReportToWhatChimpResponseDto,
} from './reports.types';

/**
 * Public gateway for the reports module.
 * This is the only contract external consumers should use.
 */
export interface ReportsFacade {
  generateClientReport(input: GenerateClientReportRequestDto): Promise<ReportPreviewDto>;
  getClientReport(input: GetClientReportRequestDto): Promise<ReportPreviewDto | null>;
  getReportById(input: GetReportByIdRequestDto): Promise<ReportPreviewDto | null>;
  listReports(input: ListReportsQueryDto): Promise<ReportsListResponseDto>;
  deleteClientReport(input: DeleteClientReportRequestDto): Promise<void>;
  sendReportToWhatChimp(input: SendReportToWhatChimpRequestDto): Promise<SendReportToWhatChimpResponseDto>;
}
