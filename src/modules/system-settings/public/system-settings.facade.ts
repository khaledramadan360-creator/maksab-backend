import {
  GetSystemSettingsRequestDto,
  SystemSettingsDto,
  UpdateSystemSettingsRequestDto,
} from './system-settings.types';

export interface SystemSettingsPromptReader {
  getAnalysisGeminiSystemPrompt(): Promise<string | null>;
}

export interface SystemSettingsFacade extends SystemSettingsPromptReader {
  getSystemSettings(input: GetSystemSettingsRequestDto): Promise<SystemSettingsDto>;
  updateSystemSettings(input: UpdateSystemSettingsRequestDto): Promise<SystemSettingsDto>;
}
