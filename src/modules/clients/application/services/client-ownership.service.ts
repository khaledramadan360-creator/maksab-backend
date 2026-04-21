import { Role } from '../../../auth/domain/enums';
import { AuthorizationError, ValidationError } from '../errors';

export class ClientOwnershipService {
  assertActorIdentity(actorUserId?: string, actorUserRole?: string): void {
    if (!actorUserId || actorUserId.trim() === '') {
      throw new ValidationError('Actor user id is required');
    }

    if (!actorUserRole || actorUserRole.trim() === '') {
      throw new ValidationError('Actor role is required');
    }
  }

  assertCanCreate(actorRole: string): void {
    if (![Role.Admin, Role.Manager, Role.Employee].includes(actorRole as Role)) {
      throw new AuthorizationError('You do not have permission to create clients');
    }
  }

  assertCanReadRealData(actorRole: string): void {
    if (actorRole === Role.Viewer) {
      throw new AuthorizationError('Viewer preview mode does not provide real client data');
    }
  }

  assertCanAccessClient(actorRole: string, actorUserId: string, ownerUserId: string): void {
    if (actorRole === Role.Admin || actorRole === Role.Manager) {
      return;
    }

    if (actorRole === Role.Employee && actorUserId === ownerUserId) {
      return;
    }

    throw new AuthorizationError('You do not have permission to access this client');
  }

  assertCanChangeOwner(actorRole: string): void {
    if (actorRole !== Role.Admin && actorRole !== Role.Manager) {
      throw new AuthorizationError('Only admin or manager can change client owner');
    }
  }

  resolveOwnerFilter(actorRole: string, actorUserId: string, requestedOwnerUserId?: string): string | undefined {
    if (actorRole === Role.Employee) {
      return actorUserId;
    }

    return requestedOwnerUserId;
  }
}

