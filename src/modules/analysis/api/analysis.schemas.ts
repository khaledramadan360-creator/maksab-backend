import { z } from 'zod';

const normalizeString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const normalizeOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  }
  return undefined;
};

export const analysisClientIdParamSchema = z.object({
  params: z.object({
    clientId: z.string().uuid(),
  }),
});

export const runClientAnalysisSchema = z.object({
  params: analysisClientIdParamSchema.shape.params,
  body: z.object({}).passthrough().optional(),
});

export const getClientAnalysisSchema = analysisClientIdParamSchema;
export const deleteClientAnalysisSchema = analysisClientIdParamSchema;

export const teamAnalysisOverviewSchema = z.object({
  query: z.object({
    keyword: z.preprocess(value => normalizeString(value), z.string().trim().optional()),
    ownerUserId: z.preprocess(value => normalizeString(value), z.string().uuid().optional()),
    hasAnalysis: z.preprocess(value => normalizeBoolean(value), z.boolean().optional()),
    page: z.preprocess(value => normalizeOptionalNumber(value), z.number().int().min(1).default(1)),
    pageSize: z.preprocess(
      value => normalizeOptionalNumber(value),
      z.number().int().min(1).max(100).default(20)
    ),
  }),
});
