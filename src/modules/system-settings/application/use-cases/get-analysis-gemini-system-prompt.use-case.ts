import { SystemSettingKey } from '../../domain/enums';
import { SystemSettingsRepository } from '../../domain/repositories';

export class GetAnalysisGeminiSystemPromptUseCase {
  constructor(private readonly settingsRepo: SystemSettingsRepository) {}

  async execute(): Promise<string | null> {
    const setting = await this.settingsRepo.findByKey(SystemSettingKey.AnalysisGeminiSystemPrompt);
    return this.normalizeNullableText(setting?.valueText ?? null);
  }

  private normalizeNullableText(value: string | null): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
}
