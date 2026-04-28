import { Role } from '../../auth/domain/enums';
import { CampaignClient, EmailSuppression, RecipientPreview } from './entities';
import {
  EligibilityLevel,
  EligibilityReason,
  SuppressionLevel,
} from './enums';
import {
  ClientEmailCampaignAccessDeniedError,
  OverrideNotAllowedError,
} from './errors';
import { EmailAddress } from './value-objects';

export class ClientEmailCampaignPermissionService {
  assertCanPreview(actorRole: string): void {
    if (actorRole === Role.Viewer) {
      throw new ClientEmailCampaignAccessDeniedError('Viewer cannot preview real client campaign data');
    }
  }

  assertCanSend(actorRole: string): void {
    if (![Role.Admin, Role.Manager, Role.Employee].includes(actorRole as Role)) {
      throw new ClientEmailCampaignAccessDeniedError('You do not have permission to send campaigns');
    }
  }

  canAccessClient(actorRole: string, actorUserId: string, clientOwnerUserId: string): boolean {
    if (actorRole === Role.Admin || actorRole === Role.Manager) {
      return true;
    }

    return actorRole === Role.Employee && actorUserId === clientOwnerUserId;
  }
}

export class ClientEmailOverridePolicyService {
  canOverride(actorRole: string, reason: EligibilityReason | null): boolean {
    if (!reason) {
      return false;
    }

    if (!this.readBooleanEnv('CLIENT_EMAIL_CAMPAIGN_ALLOW_WARNING_OVERRIDE', true)) {
      return false;
    }

    if (actorRole === Role.Admin || actorRole === Role.Manager) {
      return this.managerCanOverride(reason);
    }

    if (actorRole === Role.Employee) {
      if (reason === EligibilityReason.RiskyEmail) {
        return this.readBooleanEnv('CLIENT_EMAIL_CAMPAIGN_EMPLOYEE_CAN_OVERRIDE_RISKY', false);
      }

      return reason === EligibilityReason.UnknownStatus || reason === EligibilityReason.UnverifiedEmail;
    }

    return false;
  }

  assertCanOverride(actorRole: string, reason: EligibilityReason | null): void {
    if (!this.canOverride(actorRole, reason)) {
      throw new OverrideNotAllowedError();
    }
  }

  private managerCanOverride(reason: EligibilityReason): boolean {
    if (
      [EligibilityReason.Suppressed, EligibilityReason.Bounced].includes(reason) &&
      !this.readBooleanEnv('CLIENT_EMAIL_CAMPAIGN_MANAGER_CAN_OVERRIDE_SUPPRESSION', true)
    ) {
      return false;
    }

    if (reason === EligibilityReason.Complained && this.readBooleanEnv('CLIENT_EMAIL_CAMPAIGN_COMPLAINED_IS_BLOCKED', true)) {
      return false;
    }

    if (reason === EligibilityReason.Unsubscribed && this.readBooleanEnv('CLIENT_EMAIL_CAMPAIGN_UNSUBSCRIBED_IS_BLOCKED', true)) {
      return false;
    }

    return [
      EligibilityReason.UnknownStatus,
      EligibilityReason.UnverifiedEmail,
      EligibilityReason.RiskyEmail,
      EligibilityReason.Suppressed,
      EligibilityReason.Bounced,
      EligibilityReason.Complained,
      EligibilityReason.Unsubscribed,
    ].includes(reason);
  }

  private readBooleanEnv(name: string, defaultValue: boolean): boolean {
    const value = process.env[name];
    if (value === undefined || value.trim() === '') {
      return defaultValue;
    }
    return value.trim().toLowerCase() === 'true';
  }
}

export class ClientEmailRecipientEligibilityService {
  constructor(
    private readonly permissionService: ClientEmailCampaignPermissionService,
    private readonly overridePolicy: ClientEmailOverridePolicyService
  ) {}

  classify(
    clients: CampaignClient[],
    suppressions: EmailSuppression[],
    actorRole: string,
    actorUserId: string
  ): RecipientPreview[] {
    const suppressionByEmail = new Map(suppressions.map(item => [item.email, item]));
    const seenEmails = new Set<string>();

    return clients.map(client => {
      const hasAccess = this.permissionService.canAccessClient(actorRole, actorUserId, client.ownerUserId);
      if (!hasAccess) {
        return this.createPreview(client, null, EligibilityLevel.Blocked, EligibilityReason.AccessDenied, false);
      }

      if (!client.email || client.email.trim() === '') {
        return this.createPreview(client, null, EligibilityLevel.Blocked, EligibilityReason.MissingEmail, false);
      }

      const normalizedEmail = EmailAddress.tryNormalize(client.email);
      if (!normalizedEmail) {
        return this.createPreview(client, null, EligibilityLevel.Blocked, EligibilityReason.InvalidFormat, false);
      }

      if (seenEmails.has(normalizedEmail)) {
        return this.createPreview(client, normalizedEmail, EligibilityLevel.Blocked, EligibilityReason.DuplicateEmail, false);
      }
      seenEmails.add(normalizedEmail);

      const suppression = suppressionByEmail.get(normalizedEmail);
      if (suppression) {
        const reason = this.normalizeSuppressionReason(suppression.reason);
        const level = suppression.level === SuppressionLevel.Blocked
          ? EligibilityLevel.Blocked
          : EligibilityLevel.Warning;
        return this.createPreview(
          client,
          normalizedEmail,
          level,
          reason,
          level === EligibilityLevel.Warning && this.overridePolicy.canOverride(actorRole, reason)
        );
      }

      return this.createPreview(client, normalizedEmail, EligibilityLevel.Sendable, null, false);
    });
  }

  private createPreview(
    client: CampaignClient,
    normalizedEmail: string | null,
    eligibilityLevel: EligibilityLevel,
    eligibilityReason: EligibilityReason | null,
    canOverride: boolean
  ): RecipientPreview {
    return {
      clientId: client.id,
      clientName: client.name,
      email: client.email,
      normalizedEmail,
      ownerUserId: client.ownerUserId,
      eligibilityLevel,
      eligibilityReason,
      canOverride,
    };
  }

  private normalizeSuppressionReason(reason: string): EligibilityReason {
    if (Object.values(EligibilityReason).includes(reason as EligibilityReason)) {
      return reason as EligibilityReason;
    }

    return EligibilityReason.Suppressed;
  }
}

export class EmailTemplateRendererService {
  render(rawContent: string, variables: { clientName?: string | null; clientEmail?: string | null; clientCity?: string | null }): string {
    return rawContent
      .replaceAll('{{clientName}}', variables.clientName ?? '')
      .replaceAll('{{clientEmail}}', variables.clientEmail ?? '')
      .replaceAll('{{clientCity}}', variables.clientCity ?? '');
  }

  toBrevoTemplate(rawContent: string): string {
    return rawContent
      .replaceAll('{{clientName}}', '{{contact.FIRSTNAME}}')
      .replaceAll('{{clientEmail}}', '{{contact.EMAIL}}')
      .replaceAll('{{clientCity}}', '{{contact.CITY}}');
  }
}
