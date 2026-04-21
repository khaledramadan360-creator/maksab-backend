import { AuditAction, SystemSettingKey } from '../../domain/enums';
import {
  AuditLogRepository,
  SystemSettingsRepository,
} from '../../domain/repositories';
import { SystemSettingsAccessService } from '../services/system-settings-access.service';
import { SystemSettingsSnapshot } from '../services/system-settings-mapper.service';

export interface UpdateSystemSettingsInput {
  actorUserId: string;
  actorUserRole: string;
  analysisGeminiSystemPrompt: string | null;
}

export class UpdateSystemSettingsUseCase {
  constructor(
    private readonly settingsRepo: SystemSettingsRepository,
    private readonly auditRepo: AuditLogRepository,
    private readonly accessService: SystemSettingsAccessService
  ) {}

  async execute(input: UpdateSystemSettingsInput): Promise<SystemSettingsSnapshot> {
    this.accessService.assertActorIdentity(input.actorUserId, input.actorUserRole);
    this.accessService.assertCanUpdate(input.actorUserRole);

    const normalizedPrompt = this.normalizeNullableText(input.analysisGeminiSystemPrompt);
    await this.settingsRepo.upsert({
      key: SystemSettingKey.AnalysisGeminiSystemPrompt,
      valueText: normalizedPrompt,
    });

    await this.safeAudit(input.actorUserId, input.actorUserRole, normalizedPrompt);

    return {
      analysisGeminiSystemPrompt: normalizedPrompt,
    };
  }

  private normalizeNullableText(value: string | null): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  private async safeAudit(
    actorUserId: string,
    actorUserRole: string,
    analysisGeminiSystemPrompt: string | null
  ): Promise<void> {
    try {
      await this.auditRepo.createAuditLog({
        actorUserId,
        action: AuditAction.SystemSettingsUpdated,
        entityType: 'system_setting',
        entityId: SystemSettingKey.AnalysisGeminiSystemPrompt,
        metadata: {
          actorRole: actorUserRole,
          updatedAt: new Date().toISOString(),
          analysisGeminiSystemPromptLength: analysisGeminiSystemPrompt?.length ?? 0,
          analysisGeminiSystemPromptIsCleared: analysisGeminiSystemPrompt === null,
        },
      });
    } catch {
      // Audit persistence must not block settings updates.
    }
  }
}
