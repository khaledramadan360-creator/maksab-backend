import { ReportsFacade } from './reports.facade';
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
import { ReportStatus } from '../domain/enums';
import { ValidationError } from '../application/errors';
import { ReportMapperService } from '../application/services/report-mapper.service';
import { GenerateClientReportUseCase } from '../application/use-cases/generate-client-report.use-case';
import { GetClientReportUseCase } from '../application/use-cases/get-client-report.use-case';
import { GetReportByIdUseCase } from '../application/use-cases/get-report-by-id.use-case';
import { ListReportsUseCase } from '../application/use-cases/list-reports.use-case';
import { DeleteClientReportUseCase } from '../application/use-cases/delete-client-report.use-case';
import { SendReportToWhatChimpUseCase } from '../application/use-cases/send-report-to-whatchimp.use-case';

export class ReportsFacadeImpl implements ReportsFacade {
  constructor(
    private readonly mapper: ReportMapperService,
    private readonly generateClientReportUseCase: GenerateClientReportUseCase,
    private readonly getClientReportUseCase: GetClientReportUseCase,
    private readonly getReportByIdUseCase: GetReportByIdUseCase,
    private readonly listReportsUseCase: ListReportsUseCase,
    private readonly deleteClientReportUseCase: DeleteClientReportUseCase,
    private readonly sendReportToWhatChimpUseCase: SendReportToWhatChimpUseCase
  ) {}

  async generateClientReport(input: GenerateClientReportRequestDto): Promise<ReportPreviewDto> {
    const result = await this.generateClientReportUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      clientId: input.clientId,
    });

    return this.mapper.toReportPreviewDto(result);
  }

  async getClientReport(input: GetClientReportRequestDto): Promise<ReportPreviewDto | null> {
    const result = await this.getClientReportUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      clientId: input.clientId,
    });

    return result ? this.mapper.toReportPreviewDto(result) : null;
  }

  async getReportById(input: GetReportByIdRequestDto): Promise<ReportPreviewDto | null> {
    const result = await this.getReportByIdUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      reportId: input.reportId,
    });

    return result ? this.mapper.toReportPreviewDto(result) : null;
  }

  async listReports(input: ListReportsQueryDto): Promise<ReportsListResponseDto> {
    const generatedAtFrom = this.toDateFilter(input.generatedAtFrom, 'from');
    const generatedAtTo = this.toDateFilter(input.generatedAtTo, 'to');

    if (generatedAtFrom && generatedAtTo && generatedAtFrom.getTime() > generatedAtTo.getTime()) {
      throw new ValidationError('generatedAtFrom must be before or equal to generatedAtTo');
    }

    const result = await this.listReportsUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      filters: {
        keyword: input.keyword,
        ownerUserId: input.ownerUserId,
        status: input.status ? this.toStatus(input.status) : undefined,
        generatedAtFrom,
        generatedAtTo,
      },
      page: input.page,
      pageSize: input.pageSize,
    });

    return this.mapper.toReportsListResponseDto(result);
  }

  async deleteClientReport(input: DeleteClientReportRequestDto): Promise<void> {
    await this.deleteClientReportUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      reportId: input.reportId,
    });
  }

  async sendReportToWhatChimp(
    input: SendReportToWhatChimpRequestDto
  ): Promise<SendReportToWhatChimpResponseDto> {
    const result = await this.sendReportToWhatChimpUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      clientId: input.clientId,
      recipientPhone: input.recipientPhone,
      recipientSource: input.recipientSource,
      recipientName: input.recipientName,
      messageText: input.messageText,
    });

    return this.mapper.toSendReportToWhatChimpResponseDto(result);
  }

  private toStatus(value: string): ReportStatus {
    return value as ReportStatus;
  }

  private toDateFilter(value: string | undefined, direction: 'from' | 'to'): Date | undefined {
    if (!value) {
      return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const parsed = this.parseDateFilterValue(trimmed, direction);
    if (!parsed) {
      throw new ValidationError(
        `Invalid ${direction === 'from' ? 'generatedAtFrom' : 'generatedAtTo'} format`
      );
    }

    return parsed;
  }

  private parseDateFilterValue(value: string, direction: 'from' | 'to'): Date | null {
    const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (isoDateMatch) {
      return this.buildUtcDateBoundary(
        Number(isoDateMatch[1]),
        Number(isoDateMatch[2]),
        Number(isoDateMatch[3]),
        direction
      );
    }

    const slashDateMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
    if (slashDateMatch) {
      const first = Number(slashDateMatch[1]);
      const second = Number(slashDateMatch[2]);
      const year = Number(slashDateMatch[3]);

      let month = first;
      let day = second;
      if (first > 12 && second <= 12) {
        day = first;
        month = second;
      } else if (first > 12 && second > 12) {
        return null;
      }

      return this.buildUtcDateBoundary(year, month, day, direction);
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    const hasExplicitTime = /T\d{2}:\d{2}| \d{1,2}:\d{2}/.test(value);
    if (hasExplicitTime) {
      return parsed;
    }

    return this.buildUtcDateBoundary(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth() + 1,
      parsed.getUTCDate(),
      direction
    );
  }

  private buildUtcDateBoundary(
    year: number,
    month: number,
    day: number,
    direction: 'from' | 'to'
  ): Date | null {
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    const parsed = new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        direction === 'from' ? 0 : 23,
        direction === 'from' ? 0 : 59,
        direction === 'from' ? 0 : 59,
        direction === 'from' ? 0 : 999
      )
    );

    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      return null;
    }

    return parsed;
  }
}
