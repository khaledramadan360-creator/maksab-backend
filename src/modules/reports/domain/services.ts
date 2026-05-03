import { Role } from '../../auth/domain/enums';
import { ClientReport } from './entities';
import { ReportStatus } from './enums';
import {
  ReportAccessDeniedError,
  ReportDeliveryNotAllowedError,
  ReportFileMissingError,
  WhatChimpRejectedError,
} from './errors';
import {
  FileReferenceResolver,
  ProviderDispatchResult,
  SendableReportFileReference,
  WhatChimpGateway,
  WhatChimpSendDocumentCommand,
} from './repositories';

export class ReportDeliveryPermissionService {
  canSend(actorRole: string, actorUserId: string, reportOwnerUserId: string): boolean {
    if (actorRole === Role.Admin || actorRole === Role.Manager) {
      return true;
    }

    if (actorRole === Role.Employee) {
      return actorUserId === reportOwnerUserId;
    }

    return false;
  }

  assertCanSend(actorRole: string, actorUserId: string, reportOwnerUserId: string): void {
    if (!this.canSend(actorRole, actorUserId, reportOwnerUserId)) {
      throw new ReportAccessDeniedError('You do not have permission to send this report');
    }
  }
}

export class ReportDeliveryFileAccessService {
  async resolveSendableFile(
    report: ClientReport,
    resolver: FileReferenceResolver
  ): Promise<SendableReportFileReference> {
    if (report.status !== ReportStatus.Ready) {
      throw new ReportDeliveryNotAllowedError('Only ready reports can be sent');
    }

    if (!report.pdfPath && !report.pdfUrl) {
      throw new ReportFileMissingError();
    }

    const fileReference = await resolver.resolveSendableFile(report);

    if (!fileReference || fileReference.contentType !== 'application/pdf') {
      throw new ReportFileMissingError();
    }

    return fileReference;
  }
}

export class WhatChimpDispatchService {
  constructor(private readonly gateway: WhatChimpGateway) {}

  async sendDocument(command: WhatChimpSendDocumentCommand): Promise<ProviderDispatchResult> {
    const result = await this.gateway.sendDocument(command);

    if (!result.accepted) {
      throw new WhatChimpRejectedError(result.failureReason || undefined, result.providerStatusCode ?? null);
    }

    return {
      accepted: true,
      providerMessageId: result.providerMessageId ?? null,
      providerStatusCode: result.providerStatusCode ?? null,
      failureReason: null,
      resolvedWhatChimpAccountId: result.resolvedWhatChimpAccountId ?? null,
      resolvedWhatChimpSenderValue: result.resolvedWhatChimpSenderValue ?? null,
    };
  }
}
