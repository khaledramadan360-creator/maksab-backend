export interface RequestActorContext {
  actorUserId: string;
  actorUserRole: string;
}

export interface SystemSettingsDto {
  analysisGeminiSystemPrompt: string | null;
}

export interface GetSystemSettingsRequestDto extends RequestActorContext {}

export interface UpdateSystemSettingsRequestDto extends RequestActorContext {
  analysisGeminiSystemPrompt: string | null;
}
