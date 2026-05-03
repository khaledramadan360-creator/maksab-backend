import {
  ClientReportRepository,
  AuditLogRepository,
  ReportDeliveryAttemptRepository,
  ReportsClientsLookupRepository,
  FileReferenceResolver,
} from '../../domain/repositories';
import {
  DeliveryProvider,
  DeliveryStatus,
  AuditAction,
} from '../../domain/enums';
import {
  ClientNotFoundError,
  ReportNotFoundError,
  WhatChimpRejectedError,
} from '../../domain/errors';
import {
  MessageText,
  RecipientName,
  RecipientPhone,
} from '../../domain/value-objects';
import {
  ReportDeliveryFileAccessService,
  WhatChimpDispatchService,
} from '../../domain/services';
import {
  RecipientSource,
  SendReportToWhatChimpCommand,
  SendReportToWhatChimpResult,
} from '../dto/reports.commands';
import { ClientReportOwnershipService } from '../services/client-report-ownership.service';

export class SendReportToWhatChimpUseCase {
  constructor(
    private readonly clientsLookupRepo: ReportsClientsLookupRepository,
    private readonly reportRepo: ClientReportRepository,
    private readonly attemptRepo: ReportDeliveryAttemptRepository,
    private readonly ownershipService: ClientReportOwnershipService,
    private readonly fileAccessService: ReportDeliveryFileAccessService,
    private readonly fileReferenceResolver: FileReferenceResolver,
    private readonly dispatchService: WhatChimpDispatchService,
    private readonly auditRepo: AuditLogRepository
  ) {}

  async execute(command: SendReportToWhatChimpCommand): Promise<SendReportToWhatChimpResult> {
    this.ownershipService.assertActorIdentity(command.actorUserId, command.actorUserRole);
    this.ownershipService.assertCanSendReport(command.actorUserRole);

    const client = await this.clientsLookupRepo.findClientForReport(command.clientId);
    if (!client) {
      throw new ClientNotFoundError();
    }

    this.ownershipService.assertCanAccessClient(
      command.actorUserRole,
      command.actorUserId,
      client.ownerUserId
    );

    const report = await this.reportRepo.findCurrentByClientId(command.clientId);
    if (!report) {
      throw new ReportNotFoundError('No current report found for this client');
    }

    const recipientPhone = RecipientPhone.create(command.recipientPhone).value;
    const recipientName = RecipientName.create(command.recipientName).value;
    const messageText = MessageText.create(command.messageText).value;
    const recipientSource = this.normalizeRecipientSource(command.recipientSource);
    const requestedWhatChimpSenderValue = this.normalizePhoneNumberId(command.whatchimpPhoneNumberId);

    const sendableFile = await this.fileAccessService.resolveSendableFile(
      report,
      this.fileReferenceResolver
    );

    const pendingAttempt = await this.attemptRepo.createPending({
      reportId: report.id,
      clientId: report.clientId,
      provider: DeliveryProvider.WhatChimp,
      recipientPhone,
      recipientSource,
      recipientName,
      messageText,
      requestedByUserId: command.actorUserId,
    });

    await this.safeAudit({
      actorUserId: command.actorUserId,
      action: AuditAction.ClientReportDeliveryRequested,
      entityType: 'report_delivery_attempt',
      entityId: pendingAttempt.id,
      metadata: {
        reportId: report.id,
        clientId: report.clientId,
        attemptId: pendingAttempt.id,
        provider: DeliveryProvider.WhatChimp,
        recipientPhone,
        recipientSource,
        whatchimpPhoneNumberId: requestedWhatChimpSenderValue,
      },
    });

    try {
      const dispatchResult = await this.dispatchService.sendDocument({
        recipientPhone,
        recipientName,
        messageText,
        whatchimpPhoneNumberId: requestedWhatChimpSenderValue,
        document: sendableFile,
        reportId: report.id,
        clientId: report.clientId,
        requestedByUserId: command.actorUserId,
      });
      const resolvedWhatChimpAccountId = dispatchResult.resolvedWhatChimpAccountId ?? null;
      const effectiveWhatChimpSenderValue =
        dispatchResult.resolvedWhatChimpSenderValue ??
        requestedWhatChimpSenderValue ??
        null;

      const acceptedAttempt = await this.attemptRepo.markAccepted(pendingAttempt.id, {
        providerMessageId: dispatchResult.providerMessageId ?? null,
        providerStatusCode: dispatchResult.providerStatusCode ?? null,
      });

      await this.safeAudit({
        actorUserId: command.actorUserId,
        action: AuditAction.ClientReportDeliveryAccepted,
        entityType: 'report_delivery_attempt',
        entityId: acceptedAttempt.id,
        metadata: {
          reportId: acceptedAttempt.reportId,
          clientId: acceptedAttempt.clientId,
          attemptId: acceptedAttempt.id,
          provider: acceptedAttempt.provider,
          providerMessageId: acceptedAttempt.providerMessageId,
          providerStatusCode: acceptedAttempt.providerStatusCode,
          whatchimpPhoneNumberId: effectiveWhatChimpSenderValue,
          resolvedWhatChimpAccountId,
        },
      });

      return {
        success: true,
        status: DeliveryStatus.Accepted,
        attemptId: acceptedAttempt.id,
        reportId: acceptedAttempt.reportId,
        clientId: acceptedAttempt.clientId,
        recipientPhone: acceptedAttempt.recipientPhone,
        recipientSource: this.normalizeRecipientSource(acceptedAttempt.recipientSource),
        provider: DeliveryProvider.WhatChimp,
        providerMessageId: acceptedAttempt.providerMessageId,
        providerStatusCode: acceptedAttempt.providerStatusCode,
        failureReason: null,
        whatchimpPhoneNumberId: effectiveWhatChimpSenderValue,
        resolvedWhatChimpAccountId,
        createdAt: acceptedAttempt.createdAt,
      };
    } catch (error: any) {
      const providerStatusCode =
        error instanceof WhatChimpRejectedError
          ? error.providerStatusCode
          : this.normalizeProviderStatusCode(error?.providerStatusCode);
      const failureReason = this.resolveFailureReason(error);

      try {
        const failedAttempt = await this.attemptRepo.markFailed(pendingAttempt.id, {
          failureReason,
          providerStatusCode,
        });

        await this.safeAudit({
          actorUserId: command.actorUserId,
          action: AuditAction.ClientReportDeliveryFailed,
          entityType: 'report_delivery_attempt',
          entityId: failedAttempt.id,
          metadata: {
            reportId: failedAttempt.reportId,
            clientId: failedAttempt.clientId,
            attemptId: failedAttempt.id,
            provider: failedAttempt.provider,
            providerStatusCode: failedAttempt.providerStatusCode,
            failureReason: failedAttempt.failureReason,
            whatchimpPhoneNumberId: requestedWhatChimpSenderValue,
          },
        });
      } catch {
        // Keep provider error as the main failure cause.
      }

      console.error('[WHATCHIMP_ARCHIVE_FAILED] Report generated but not archived', {
        reportId: report.id,
        clientId: report.clientId,
        attemptId: pendingAttempt.id,
        provider: DeliveryProvider.WhatChimp,
        providerStatusCode,
        failureReason,
        whatchimpPhoneNumberId: requestedWhatChimpSenderValue,
      });

      throw error;
    }
  }

  private normalizeRecipientSource(value?: string | null): RecipientSource | null {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'whatsapp' || normalized === 'mobile' || normalized === 'custom') {
      return normalized;
    }

    return null;
  }

  private normalizeProviderStatusCode(value: unknown): string | null {
    const normalized = String(value ?? '').trim();
    return normalized === '' ? null : normalized;
  }

  private normalizePhoneNumberId(value?: string | null): string | null {
    const normalized = String(value || '').trim();
    return normalized === '' ? null : normalized;
  }

  private resolveFailureReason(error: any): string {
    const explicit = String(error?.message || '').trim();
    if (explicit) {
      return explicit;
    }

    return 'WhatChimp request failed';
  }

  private async safeAudit(entry: Parameters<AuditLogRepository['createAuditLog']>[0]): Promise<void> {
    try {
      await this.auditRepo.createAuditLog(entry);
    } catch {
      // Audit persistence is non-blocking.
    }
  }
}
