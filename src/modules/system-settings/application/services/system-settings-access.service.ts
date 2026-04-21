import { Role } from '../../../auth/domain/enums';
import { AuthorizationError, ValidationError } from '../errors';

export class SystemSettingsAccessService {
  assertActorIdentity(actorUserId: string, actorUserRole: string): void {
    if (!actorUserId || !actorUserRole) {
      throw new ValidationError('Actor identity is required');
    }
  }

  assertCanRead(actorUserRole: string): void {
    if (![Role.Admin, Role.Manager].includes(actorUserRole as Role)) {
      throw new AuthorizationError('You are not allowed to read system settings');
    }
  }

  assertCanUpdate(actorUserRole: string): void {
    if (![Role.Admin, Role.Manager].includes(actorUserRole as Role)) {
      throw new AuthorizationError('You are not allowed to update system settings');
    }
  }
}
