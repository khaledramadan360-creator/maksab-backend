import { v4 as uuidv4 } from 'uuid';
import {
  CreateReportDeliveryAttemptRecord,
  MarkReportDeliveryAttemptAcceptedRecord,
  MarkReportDeliveryAttemptFailedRecord,
  ReportDeliveryAttemptRepository,
} from '../../domain/repositories';
import { ReportDeliveryAttempt } from '../../domain/entities';
import { DeliveryStatus } from '../../domain/enums';
import { ReportDeliveryAttemptModel } from '../persistence/models/report-delivery-attempt.model';
import { ReportDeliveryAttemptMapper } from '../mappers/report-delivery-attempt.mapper';
import { NotFoundError } from '../../application/errors';

export class MySQLReportDeliveryAttemptRepository implements ReportDeliveryAttemptRepository {
  async createPending(record: CreateReportDeliveryAttemptRecord): Promise<ReportDeliveryAttempt> {
    const now = new Date();
    const created = await ReportDeliveryAttemptModel.create({
      id: uuidv4(),
      reportId: record.reportId,
      clientId: record.clientId,
      provider: record.provider,
      recipientPhone: record.recipientPhone,
      recipientSource: record.recipientSource,
      recipientName: record.recipientName,
      messageText: record.messageText,
      status: DeliveryStatus.Pending,
      providerMessageId: null,
      providerStatusCode: null,
      failureReason: null,
      requestedByUserId: record.requestedByUserId,
      createdAt: now,
      updatedAt: now,
    });

    return ReportDeliveryAttemptMapper.toDomain(created);
  }

  async markAccepted(
    attemptId: string,
    data: MarkReportDeliveryAttemptAcceptedRecord
  ): Promise<ReportDeliveryAttempt> {
    const model = await this.mustFindById(attemptId);
    await model.update({
      status: DeliveryStatus.Accepted,
      providerMessageId: data.providerMessageId ?? null,
      providerStatusCode: data.providerStatusCode ?? null,
      failureReason: null,
      updatedAt: new Date(),
    });

    return ReportDeliveryAttemptMapper.toDomain(model);
  }

  async markFailed(
    attemptId: string,
    data: MarkReportDeliveryAttemptFailedRecord
  ): Promise<ReportDeliveryAttempt> {
    const model = await this.mustFindById(attemptId);
    await model.update({
      status: DeliveryStatus.Failed,
      providerStatusCode: data.providerStatusCode ?? null,
      failureReason: data.failureReason,
      updatedAt: new Date(),
    });

    return ReportDeliveryAttemptMapper.toDomain(model);
  }

  async findLatestByClientId(clientId: string): Promise<ReportDeliveryAttempt | null> {
    const model = await ReportDeliveryAttemptModel.findOne({
      where: { clientId },
      order: [['createdAt', 'DESC']],
    });

    return model ? ReportDeliveryAttemptMapper.toDomain(model) : null;
  }

  async findLatestByReportId(reportId: string): Promise<ReportDeliveryAttempt | null> {
    const model = await ReportDeliveryAttemptModel.findOne({
      where: { reportId },
      order: [['createdAt', 'DESC']],
    });

    return model ? ReportDeliveryAttemptMapper.toDomain(model) : null;
  }

  async listByReportId(reportId: string): Promise<ReportDeliveryAttempt[]> {
    const models = await ReportDeliveryAttemptModel.findAll({
      where: { reportId },
      order: [['createdAt', 'DESC']],
    });

    return models.map(model => ReportDeliveryAttemptMapper.toDomain(model));
  }

  private async mustFindById(attemptId: string): Promise<ReportDeliveryAttemptModel> {
    const model = await ReportDeliveryAttemptModel.findByPk(attemptId);
    if (!model) {
      throw new NotFoundError('Report delivery attempt not found');
    }

    return model;
  }
}
