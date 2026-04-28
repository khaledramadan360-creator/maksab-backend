import { DeliveryProvider } from './enums';

export interface ReportDeliveryEventPayload {
  reportId: string;
  clientId: string;
  provider: DeliveryProvider;
  recipientPhone: string;
  requestedByUserId: string;
  occurredAt: Date;
}

export interface ReportDeliveryRequested {
  type: 'ReportDeliveryRequested';
  payload: ReportDeliveryEventPayload;
}

export interface ReportDeliveryAccepted {
  type: 'ReportDeliveryAccepted';
  payload: ReportDeliveryEventPayload & {
    providerMessageId: string | null;
    providerStatusCode: string | null;
  };
}

export interface ReportDeliveryFailed {
  type: 'ReportDeliveryFailed';
  payload: ReportDeliveryEventPayload & {
    providerStatusCode: string | null;
    failureReason: string | null;
  };
}

export type ReportDeliveryDomainEvent =
  | ReportDeliveryRequested
  | ReportDeliveryAccepted
  | ReportDeliveryFailed;
