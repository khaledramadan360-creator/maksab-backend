import { Role } from '../../../auth/domain/enums';
import { AuthorizationError, ValidationError } from '../errors';

export class ClientAnalysisOwnershipService {
  assertActorIdentity(actorUserId?: string, actorUserRole?: string): void {
    if (!actorUserId || actorUserId.trim() === '') {
      throw new ValidationError('Actor user id is required');
    }

    if (!actorUserRole || actorUserRole.trim() === '') {
      throw new ValidationError('Actor role is required');
    }
  }

  assertCanRunAnalysis(actorRole: string): void {
    if (![Role.Admin, Role.Manager, Role.Employee].includes(actorRole as Role)) {
      throw new AuthorizationError('You do not have permission to run analysis');
    }
  }

  assertCanReadAnalysis(actorRole: string): void {
    if (![Role.Admin, Role.Manager, Role.Employee].includes(actorRole as Role)) {
      throw new AuthorizationError('You do not have permission to view analysis');
    }
  }

  assertCanDeleteAnalysis(actorRole: string): void {
    if (![Role.Admin, Role.Manager].includes(actorRole as Role)) {
      throw new AuthorizationError('Only admin or manager can delete analysis');
    }
  }

  assertCanViewTeamOverview(actorRole: string): void {
    if (![Role.Admin, Role.Manager].includes(actorRole as Role)) {
      throw new AuthorizationError('Only admin or manager can view team analysis overview');
    }
  }

  assertCanAccessClient(actorRole: string, actorUserId: string, ownerUserId: string): void {
    if (actorRole === Role.Admin || actorRole === Role.Manager) {
      return;
    }

    if (actorRole === Role.Employee && actorUserId === ownerUserId) {
      return;
    }

    throw new AuthorizationError('You do not have permission to access this client analysis');
  }
}
