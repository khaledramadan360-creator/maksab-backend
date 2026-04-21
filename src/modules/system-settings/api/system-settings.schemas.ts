import { z } from 'zod';

type RawRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is RawRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeNullablePrompt = (value: unknown): string | null | undefined => {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

const normalizeUpdateBody = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return value;
  }

  return {
    ...value,
    analysisGeminiSystemPrompt: normalizeNullablePrompt(value.analysisGeminiSystemPrompt),
  };
};

export const updateSystemSettingsSchema = z.object({
  body: z.preprocess(
    normalizeUpdateBody,
    z.object({
      analysisGeminiSystemPrompt: z.preprocess(
        value => normalizeNullablePrompt(value),
        z.string().max(20000).nullable()
      ),
    })
  ),
});
