import { GetAnalysisGeminiSystemPromptUseCase } from '../application/use-cases/get-analysis-gemini-system-prompt.use-case';
import { GetSystemSettingsUseCase } from '../application/use-cases/get-system-settings.use-case';
import { UpdateSystemSettingsUseCase } from '../application/use-cases/update-system-settings.use-case';
import { SystemSettingsMapperService } from '../application/services/system-settings-mapper.service';
import { SystemSettingsFacade } from './system-settings.facade';
import {
  GetSystemSettingsRequestDto,
  SystemSettingsDto,
  UpdateSystemSettingsRequestDto,
} from './system-settings.types';

export class SystemSettingsFacadeImpl implements SystemSettingsFacade {
  constructor(
    private readonly mapper: SystemSettingsMapperService,
    private readonly getSystemSettingsUseCase: GetSystemSettingsUseCase,
    private readonly updateSystemSettingsUseCase: UpdateSystemSettingsUseCase,
    private readonly getAnalysisGeminiSystemPromptUseCase: GetAnalysisGeminiSystemPromptUseCase
  ) {}

  async getSystemSettings(input: GetSystemSettingsRequestDto): Promise<SystemSettingsDto> {
    const snapshot = await this.getSystemSettingsUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
    });

    return this.mapper.toDto(snapshot);
  }

  async updateSystemSettings(input: UpdateSystemSettingsRequestDto): Promise<SystemSettingsDto> {
    const snapshot = await this.updateSystemSettingsUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      analysisGeminiSystemPrompt: input.analysisGeminiSystemPrompt,
    });

    return this.mapper.toDto(snapshot);
  }

  async getAnalysisGeminiSystemPrompt(): Promise<string | null> {
    return this.getAnalysisGeminiSystemPromptUseCase.execute();
  }
}
