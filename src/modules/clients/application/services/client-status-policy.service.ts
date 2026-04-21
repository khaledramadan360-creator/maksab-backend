import { ClientStatus } from '../../domain/enums';
import { ValidationError } from '../errors';

export class ClientStatusPolicyService {
  getDefaultStatus(): ClientStatus {
    return ClientStatus.New;
  }

  assertSupportedStatus(status: ClientStatus): void {
    const allowed = new Set<string>([
      ClientStatus.New,
      ClientStatus.Contacted,
      ClientStatus.Interested,
      ClientStatus.NotInterested,
      ClientStatus.Converted,
      ClientStatus.Archived,
    ]);

    if (!allowed.has(status)) {
      throw new ValidationError(`Unsupported client status: ${status}`);
    }
  }

  assertCanChangeStatus(current: ClientStatus, next: ClientStatus): void {
    this.assertSupportedStatus(current);
    this.assertSupportedStatus(next);
  }
}

