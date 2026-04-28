import { Role } from '../../../auth/domain/enums';
import { AuthorizationError, ValidationError } from '../errors';

export class ClientReportOwnershipService {
  assertActorIdentity(actorUserId?: string, actorUserRole?: string): void {
    if (!actorUserId || actorUserId.trim() === '') {
      throw new ValidationError('Actor user id is required');
    }

    if (!actorUserRole || actorUserRole.trim() === '') {
      throw new ValidationError('Actor role is required');
    }
  }

  assertCanGenerateReport(actorRole: string): void {
    if (![Role.Admin, Role.Manager, Role.Employee].includes(actorRole as Role)) {
      throw new AuthorizationError('You do not have permission to generate reports');
    }
  }

  assertCanSendReport(actorRole: string): void {
    if (![Role.Admin, Role.Manager, Role.Employee].includes(actorRole as Role)) {
      throw new AuthorizationError('You do not have permission to send reports');
    }
  }

  assertCanReadReport(actorRole: string): void {
    if (![Role.Admin, Role.Manager, Role.Employee].includes(actorRole as Role)) {
      throw new AuthorizationError('You do not have permission to view reports');
    }
  }

  assertCanDeleteReport(actorRole: string): void {
    if (![Role.Admin, Role.Manager].includes(actorRole as Role)) {
      throw new AuthorizationError('Only admin or manager can delete reports');
    }
  }

  assertCanAccessClient(actorRole: string, actorUserId: string, ownerUserId: string): void {
    if (actorRole === Role.Admin || actorRole === Role.Manager) {
      return;
    }

    if (actorRole === Role.Employee && actorUserId === ownerUserId) {
      return;
    }

    throw new AuthorizationError('You do not have permission to access this report');
  }

  resolveOwnerFilter(actorRole: string, actorUserId: string, requestedOwnerUserId?: string): string | undefined {
    if (actorRole === Role.Employee) {
      return actorUserId;
    }

    if (actorRole === Role.Admin || actorRole === Role.Manager) {
      return requestedOwnerUserId;
    }

    throw new AuthorizationError('You do not have permission to list reports');
  }
}
