import { z } from 'zod';
import { ReportStatus } from '../domain/enums';

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

const normalizeListReportsQuery = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return value;
  }

  const generatedAtFrom = pickFirstNormalizedString(
    value.generatedAtFrom,
    value.dateFrom,
    value.fromDate,
    value.startDate,
    value.from
  );
  const generatedAtTo = pickFirstNormalizedString(
    value.generatedAtTo,
    value.dateTo,
    value.toDate,
    value.endDate,
    value.to
  );

  return {
    ...value,
    status: normalizeEnumString(value.status),
    generatedAtFrom,
    generatedAtTo,
    dateFrom: generatedAtFrom ?? normalizeString(value.dateFrom),
    dateTo: generatedAtTo ?? normalizeString(value.dateTo),
  };
};

export const reportClientIdParamSchema = z.object({
  params: z.object({
    clientId: z.string().uuid(),
  }),
});

export const reportIdParamSchema = z.object({
  params: z.object({
    reportId: z.string().uuid(),
  }),
});

export const generateClientReportSchema = z.object({
  params: reportClientIdParamSchema.shape.params,
  body: z.object({}).passthrough().optional(),
});

export const getWhatChimpPhoneNumberOptionsSchema = z.object({
  query: z.object({}).passthrough().optional(),
});

export const sendReportToWhatChimpSchema = z.object({
  params: reportClientIdParamSchema.shape.params,
  body: z.object({
    recipientPhone: z.preprocess(
      value => normalizeString(value),
      z.string().min(1, 'recipientPhone is required')
    ),
    recipientSource: z
      .preprocess(value => normalizeEnumString(value), z.enum(['whatsapp', 'mobile', 'custom']).optional())
      .optional(),
    recipientName: z.preprocess(value => normalizeString(value), z.string().max(255).optional()),
    messageText: z.preprocess(value => normalizeString(value), z.string().max(1024).optional()),
    whatchimpPhoneNumberId: z.preprocess(
      value => normalizeString(value),
      z.string().max(255).optional()
    ),
  }),
});

export const getClientReportSchema = reportClientIdParamSchema;
export const getReportByIdSchema = reportIdParamSchema;
export const deleteReportSchema = reportIdParamSchema;

export const listReportsSchema = z.object({
  query: z.preprocess(
    normalizeListReportsQuery,
    z.object({
      keyword: z.preprocess(value => normalizeString(value), z.string().trim().optional()),
      ownerUserId: z.preprocess(value => normalizeString(value), z.string().uuid().optional()),
      status: z.preprocess(value => normalizeEnumString(value), z.nativeEnum(ReportStatus).optional()),
      generatedAtFrom: z.preprocess(
        value => normalizeString(value),
        z.string().refine(isParsableDate, 'Invalid generatedAtFrom date format').optional()
      ),
      generatedAtTo: z.preprocess(
        value => normalizeString(value),
        z.string().refine(isParsableDate, 'Invalid generatedAtTo date format').optional()
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
