import { SystemSettingsDto } from '../../public/system-settings.types';

export interface SystemSettingsSnapshot {
  analysisGeminiSystemPrompt: string | null;
}

export class SystemSettingsMapperService {
  toDto(snapshot: SystemSettingsSnapshot): SystemSettingsDto {
    return {
      analysisGeminiSystemPrompt: snapshot.analysisGeminiSystemPrompt,
    };
  }
}
