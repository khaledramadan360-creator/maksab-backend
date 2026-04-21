import { z } from 'zod';
import { MarketingSeasonStatus } from '../domain/enums';

type RawRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is RawRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const normalizeNullableString = (value: unknown): string | null | undefined => {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
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
  if (trimmed === '') {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeEnumString = (value: unknown): string | undefined => {
  const normalized = normalizeString(value);
  return normalized ? normalized.toLowerCase() : undefined;
};

const pickFirstNormalizedString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    const normalized = normalizeString(value);
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
};

const isParsableDate = (value: string): boolean => {
  const trimmed = value.trim();
  if (trimmed === '') {
    return false;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return true;
  }

  return !Number.isNaN(Date.parse(trimmed));
};

const normalizeCreateBody = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return value;
  }

  return {
    ...value,
    title: normalizeString(value.title),
    description: normalizeNullableString(value.description),
  };
};

const normalizeUpdateBody = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return value;
  }

  return {
    ...value,
    title: normalizeString(value.title),
    description: normalizeNullableString(value.description),
  };
};

const normalizeListQuery = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return value;
  }

  const createdAtFrom = pickFirstNormalizedString(
    value.createdAtFrom,
    value.dateFrom,
    value.fromDate,
    value.startDate,
    value.from
  );
  const createdAtTo = pickFirstNormalizedString(
    value.createdAtTo,
    value.dateTo,
    value.toDate,
    value.endDate,
    value.to
  );

  return {
    ...value,
    status: normalizeEnumString(value.status),
    createdAtFrom,
    createdAtTo,
    dateFrom: createdAtFrom ?? normalizeString(value.dateFrom),
    dateTo: createdAtTo ?? normalizeString(value.dateTo),
  };
};

const nullableDescriptionSchema = z.preprocess(
  value => {
    if (value === undefined || value === null) {
      return value;
    }
    if (typeof value !== 'string') {
      return value;
    }
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  },
  z.string().max(5000).optional().nullable()
);

export const marketingSeasonIdParamSchema = z.object({
  params: z.object({
    seasonId: z.string().uuid(),
  }),
});

export const createMarketingSeasonSchema = z.object({
  body: z.preprocess(
    normalizeCreateBody,
    z.object({
      title: z.string().trim().min(1).max(255),
      description: nullableDescriptionSchema.optional(),
    })
  ),
});

export const updateMarketingSeasonSchema = z.object({
  params: marketingSeasonIdParamSchema.shape.params,
  body: z.preprocess(
    normalizeUpdateBody,
    z
      .object({
        title: z.string().trim().min(1).max(255).optional(),
        description: nullableDescriptionSchema.optional(),
      })
      .refine(value => value.title !== undefined || value.description !== undefined, {
        message: 'At least one field is required',
      })
  ),
});

export const deleteMarketingSeasonSchema = marketingSeasonIdParamSchema;
export const getMarketingSeasonByIdSchema = marketingSeasonIdParamSchema;

export const activateMarketingSeasonSchema = z.object({
  params: marketingSeasonIdParamSchema.shape.params,
  body: z.object({}).passthrough().optional(),
});

export const listMarketingSeasonsSchema = z.object({
  query: z.preprocess(
    normalizeListQuery,
    z.object({
      keyword: z.preprocess(value => normalizeString(value), z.string().trim().optional()),
      status: z.preprocess(
        value => normalizeEnumString(value),
        z.nativeEnum(MarketingSeasonStatus).optional()
      ),
      ownerUserId: z.preprocess(value => normalizeString(value), z.string().uuid().optional()),
      createdAtFrom: z.preprocess(
        value => normalizeString(value),
        z.string().refine(isParsableDate, 'Invalid createdAtFrom date format').optional()
      ),
      createdAtTo: z.preprocess(
        value => normalizeString(value),
        z.string().refine(isParsableDate, 'Invalid createdAtTo date format').optional()
      ),
      dateFrom: z.preprocess(
        value => normalizeString(value),
        z.string().refine(isParsableDate, 'Invalid dateFrom date format').optional()
      ),
      dateTo: z.preprocess(
        value => normalizeString(value),
        z.string().refine(isParsableDate, 'Invalid dateTo date format').optional()
      ),
      page: z.preprocess(value => normalizeOptionalNumber(value), z.number().int().min(1).default(1)),
      pageSize: z.preprocess(
        value => normalizeOptionalNumber(value),
        z.number().int().min(1).max(100).default(20)
      ),
    })
  ),
});

