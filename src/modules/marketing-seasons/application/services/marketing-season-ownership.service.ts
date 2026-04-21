import { Role } from '../../../auth/domain/enums';
import { AuthorizationError, ValidationError } from '../errors';

export class MarketingSeasonOwnershipService {
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
      throw new AuthorizationError('You do not have permission to create marketing seasons');
    }
  }

  assertCanReadRealData(actorRole: string): void {
    if (![Role.Admin, Role.Manager, Role.Employee].includes(actorRole as Role)) {
      throw new AuthorizationError('Viewer preview mode does not provide real marketing seasons data');
    }
  }

  assertCanMutate(actorRole: string): void {
    if (![Role.Admin, Role.Manager, Role.Employee].includes(actorRole as Role)) {
      throw new AuthorizationError('You do not have permission to modify marketing seasons');
    }
  }

  assertCanActivate(actorRole: string): void {
    if (![Role.Admin, Role.Manager, Role.Employee].includes(actorRole as Role)) {
      throw new AuthorizationError('You do not have permission to activate marketing seasons');
    }
  }

  assertCanAccessSeason(actorRole: string, actorUserId: string, ownerUserId: string): void {
    if (actorRole === Role.Admin || actorRole === Role.Manager) {
      return;
    }

    if (actorRole === Role.Employee && actorUserId === ownerUserId) {
      return;
    }

    throw new AuthorizationError('You do not have permission to access this marketing season');
  }

  resolveOwnerFilter(actorRole: string, actorUserId: string, requestedOwnerUserId?: string): string | undefined {
    if (actorRole === Role.Employee) {
      return actorUserId;
    }

    if (actorRole === Role.Admin || actorRole === Role.Manager) {
      return requestedOwnerUserId;
    }

    throw new AuthorizationError('You do not have permission to list marketing seasons');
  }
}

