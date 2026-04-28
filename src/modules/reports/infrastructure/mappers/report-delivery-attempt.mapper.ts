import { ReportDeliveryAttempt } from '../../domain/entities';
import { DeliveryProvider, DeliveryStatus } from '../../domain/enums';
import { ReportDeliveryAttemptModel } from '../persistence/models/report-delivery-attempt.model';

export class ReportDeliveryAttemptMapper {
  static toDomain(model: ReportDeliveryAttemptModel): ReportDeliveryAttempt {
    return {
      id: model.id,
      reportId: model.reportId,
      clientId: model.clientId,
      provider: model.provider as DeliveryProvider,
      recipientPhone: model.recipientPhone,
      recipientSource: model.recipientSource,
      recipientName: model.recipientName,
      messageText: model.messageText,
      status: model.status as DeliveryStatus,
      providerMessageId: model.providerMessageId,
      providerStatusCode: model.providerStatusCode,
      failureReason: model.failureReason,
      requestedByUserId: model.requestedByUserId,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
