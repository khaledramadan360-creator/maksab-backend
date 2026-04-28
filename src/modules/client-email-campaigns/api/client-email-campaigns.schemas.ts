import { z } from 'zod';
import { CampaignStatus } from '../domain/enums';

type RawRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is RawRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeString = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

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

const isParsableDate = (value: string): boolean => {
  const trimmed = value.trim();
  if (trimmed === '') {
    return false;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return true;
  }

  const slashDateMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (slashDateMatch) {
    const first = Number(slashDateMatch[1]);
    const second = Number(slashDateMatch[2]);
    const year = Number(slashDateMatch[3]);

    let month = first;
    let day = second;
    if (first > 12 && second <= 12) {
      day = first;
      month = second;
    } else if (first > 12 && second > 12) {
      return false;
    }

    const parsed = new Date(Date.UTC(year, month - 1, day));
    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    );
  }

  return !Number.isNaN(Date.parse(trimmed));
};

const pickFirstNormalizedString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value !== 'string') {
      continue;
    }
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return undefined;
};

const normalizeListCampaignsQuery = (value: unknown): unknown => {
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
    createdAtFrom,
    createdAtTo,
    dateFrom: createdAtFrom,
    dateTo: createdAtTo,
  };
};

const maxRecipients = () => {
  const value = Number(process.env.CLIENT_EMAIL_CAMPAIGN_MAX_RECIPIENTS ?? 200);
  return Number.isFinite(value) && value > 0 ? value : 200;
};

const baseCampaignBodyShape = {
  title: z.string().trim().min(1).max(255),
  subject: z.string().trim().min(1).max(255),
  htmlContent: z.preprocess(normalizeString, z.string().trim().optional().nullable()),
  textContent: z.preprocess(normalizeString, z.string().trim().optional().nullable()),
  senderName: z.string().trim().min(1).max(255),
  senderEmail: z.string().trim().email(),
  clientIds: z.array(z.string().uuid()).min(1).max(maxRecipients()).transform(ids => Array.from(new Set(ids))),
};

const withContentRule = <T extends z.ZodTypeAny>(schema: T) => schema.refine((data: any) => !!data.htmlContent || !!data.textContent, {
  message: 'Either htmlContent or textContent is required',
  path: ['htmlContent'],
});

export const previewClientEmailCampaignSchema = z.object({
  body: withContentRule(z.object(baseCampaignBodyShape)),
});

export const sendClientEmailCampaignSchema = z.object({
  body: withContentRule(z.object({
    ...baseCampaignBodyShape,
    overrideWarningClientIds: z.array(z.string().uuid()).optional().default([]).transform(ids => Array.from(new Set(ids))),
    overrideReason: z.preprocess(normalizeString, z.string().trim().max(500).optional().nullable()),
  })).refine(data => {
    return !data.overrideWarningClientIds || data.overrideWarningClientIds.length === 0 || !!data.overrideReason;
  }, {
    message: 'overrideReason is required when overrideWarningClientIds is not empty',
    path: ['overrideReason'],
  }),
});

export const listClientEmailCampaignsSchema = z.object({
  query: z.preprocess(
    normalizeListCampaignsQuery,
    z.object({
      page: z.preprocess(value => normalizeOptionalNumber(value), z.number().int().min(1).default(1)),
      pageSize: z.preprocess(
        value => normalizeOptionalNumber(value),
        z.number().int().min(1).max(100).default(20)
      ),
      status: z.nativeEnum(CampaignStatus).optional(),
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
    })
  ),
});

export const getClientEmailCampaignDetailsSchema = z.object({
  params: z.object({
    campaignId: z.string().uuid(),
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(200).default(100),
  }),
});
