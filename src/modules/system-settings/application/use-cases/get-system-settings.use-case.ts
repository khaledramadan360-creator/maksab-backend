import { SystemSettingKey } from '../../domain/enums';
import { SystemSettingsRepository } from '../../domain/repositories';
import { SystemSettingsAccessService } from '../services/system-settings-access.service';
import { SystemSettingsSnapshot } from '../services/system-settings-mapper.service';

export interface GetSystemSettingsInput {
  actorUserId: string;
  actorUserRole: string;
}

export class GetSystemSettingsUseCase {
  constructor(
    private readonly settingsRepo: SystemSettingsRepository,
    private readonly accessService: SystemSettingsAccessService
  ) {}

  async execute(input: GetSystemSettingsInput): Promise<SystemSettingsSnapshot> {
    this.accessService.assertActorIdentity(input.actorUserId, input.actorUserRole);
    this.accessService.assertCanRead(input.actorUserRole);

    return this.loadSnapshot();
  }

  async executeInternal(): Promise<SystemSettingsSnapshot> {
    return this.loadSnapshot();
  }

  private async loadSnapshot(): Promise<SystemSettingsSnapshot> {
    const prompt = await this.settingsRepo.findByKey(SystemSettingKey.AnalysisGeminiSystemPrompt);

    return {
      analysisGeminiSystemPrompt: this.normalizeNullableText(prompt?.valueText ?? null),
    };
  }

  private normalizeNullableText(value: string | null): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
}
