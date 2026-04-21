import { z } from 'zod';
import { ClientPlatform, ClientSourceModule, ClientStatus, ClientType } from '../domain/enums';

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

const normalizeEnumString = (value: unknown): string | undefined => {
  const normalized = normalizeString(value);
  return normalized ? normalized.toLowerCase() : undefined;
};

const normalizeBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  }
  return undefined;
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
    const normalized = normalizeString(value);
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
};

const nullableTrimmedString = z.preprocess(
  value => {
    if (value === undefined || value === null) return value;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  },
  z.string().min(1).optional().nullable()
);

const nullableEmailString = z.preprocess(
  value => {
    if (value === undefined || value === null) return value;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed.toLowerCase();
  },
  z.string().email().optional().nullable()
);

const nullableNotesString = z.preprocess(
  value => {
    if (value === undefined || value === null) return value;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  },
  z.string().max(5000).optional().nullable()
);

const platformToLinkKey: Record<ClientPlatform, keyof ClientLinksShape> = {
  [ClientPlatform.Website]: 'websiteUrl',
  [ClientPlatform.Facebook]: 'facebookUrl',
  [ClientPlatform.Instagram]: 'instagramUrl',
  [ClientPlatform.Snapchat]: 'snapchatUrl',
  [ClientPlatform.Linkedin]: 'linkedinUrl',
  [ClientPlatform.X]: 'xUrl',
  [ClientPlatform.Tiktok]: 'tiktokUrl',
};

interface ClientLinksShape {
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  snapchatUrl?: string | null;
  linkedinUrl?: string | null;
  xUrl?: string | null;
  tiktokUrl?: string | null;
}

const pickLinkValue = (source: RawRecord, canonical: string, alias?: string): string | null | undefined => {
  return (
    normalizeNullableString(source[canonical]) ??
    (alias ? normalizeNullableString(source[alias]) : undefined)
  );
};

const normalizeLinksInput = (value: unknown): ClientLinksShape | undefined => {
  if (!isRecord(value)) return undefined;

  return {
    websiteUrl: pickLinkValue(value, 'websiteUrl', 'website'),
    facebookUrl: pickLinkValue(value, 'facebookUrl', 'facebook'),
    instagramUrl: pickLinkValue(value, 'instagramUrl', 'instagram'),
    snapchatUrl: pickLinkValue(value, 'snapchatUrl', 'snapchat'),
    linkedinUrl: pickLinkValue(value, 'linkedinUrl', 'linkedin'),
    xUrl: pickLinkValue(value, 'xUrl', 'x'),
    tiktokUrl: pickLinkValue(value, 'tiktokUrl', 'tiktok'),
  };
};

const deriveSourceUrlFromLinks = (
  links: ClientLinksShape | undefined,
  sourcePlatform: string | undefined,
  primaryPlatform: string | undefined
): string | undefined => {
  if (!links) return undefined;

  const platform = (sourcePlatform ?? primaryPlatform) as ClientPlatform | undefined;
  if (!platform || !(platform in platformToLinkKey)) return undefined;

  const linkKey = platformToLinkKey[platform];
  const value = links[linkKey];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const normalizeCreateBody = (value: unknown): unknown => {
  if (!isRecord(value)) return value;

  const links =
    normalizeLinksInput(value.links) ??
    normalizeLinksInput(value.clientLinks) ??
    normalizeLinksInput(value.platformLinks);

  const primaryPlatform = normalizeEnumString(value.primaryPlatform ?? value.platform);
  const sourcePlatform = normalizeEnumString(value.sourcePlatform ?? value.platform ?? primaryPlatform);
  const sourceUrl =
    normalizeString(
      value.sourceUrl ?? value.sourceLink ?? value.platformUrl ?? value.profileUrl ?? value.url
    ) ?? deriveSourceUrlFromLinks(links, sourcePlatform, primaryPlatform);

  return {
    ...value,
    name: normalizeString(value.name ?? value.clientName),
    clientType: normalizeEnumString(value.clientType ?? value.type),
    mobile: normalizeNullableString(value.mobile ?? value.phone),
    whatsapp: normalizeNullableString(value.whatsapp ?? value.whatsApp),
    email: normalizeNullableString(value.email),
    saudiCity: normalizeString(value.saudiCity ?? value.city),
    notes: normalizeNullableString(value.notes ?? value.note ?? value.description),
    primaryPlatform,
    sourceModule: normalizeEnumString(value.sourceModule ?? value.source ?? ClientSourceModule.Manual),
    sourcePlatform,
    sourceUrl,
    links,
    forceCreateIfDuplicate: normalizeBoolean(value.forceCreateIfDuplicate ?? value.forceCreate),
  };
};

const normalizeCreateFromSearchBody = (value: unknown): unknown => {
  if (!isRecord(value)) return value;

  const links =
    normalizeLinksInput(value.links) ??
    normalizeLinksInput(value.clientLinks) ??
    normalizeLinksInput(value.platformLinks);

  const sourcePlatform = normalizeEnumString(value.sourcePlatform ?? value.primaryPlatform ?? value.platform);
  const sourceUrl =
    normalizeString(
      value.sourceUrl ?? value.sourceLink ?? value.platformUrl ?? value.profileUrl ?? value.url
    ) ?? deriveSourceUrlFromLinks(links, sourcePlatform, undefined);

  return {
    ...value,
    name: normalizeString(value.name ?? value.clientName),
    clientType: normalizeEnumString(value.clientType ?? value.type),
    mobile: normalizeNullableString(value.mobile ?? value.phone),
    whatsapp: normalizeNullableString(value.whatsapp ?? value.whatsApp),
    email: normalizeNullableString(value.email),
    saudiCity: normalizeString(value.saudiCity ?? value.city),
    notes: normalizeNullableString(value.notes ?? value.note ?? value.description),
    sourcePlatform,
    sourceUrl,
    links,
    forceCreateIfDuplicate: normalizeBoolean(value.forceCreateIfDuplicate ?? value.forceCreate),
  };
};

const normalizeListClientsQuery = (value: unknown): unknown => {
  if (!isRecord(value)) return value;

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
    clientType: normalizeEnumString(value.clientType ?? value.type),
    createdAtFrom,
    createdAtTo,
    dateFrom: createdAtFrom ?? normalizeString(value.dateFrom),
    dateTo: createdAtTo ?? normalizeString(value.dateTo),
  };
};

const linksSchema = z.object({
  websiteUrl: nullableTrimmedString.optional(),
  facebookUrl: nullableTrimmedString.optional(),
  instagramUrl: nullableTrimmedString.optional(),
  snapchatUrl: nullableTrimmedString.optional(),
  linkedinUrl: nullableTrimmedString.optional(),
  xUrl: nullableTrimmedString.optional(),
  tiktokUrl: nullableTrimmedString.optional(),
});

export const createClientSchema = z.object({
  body: z.preprocess(
    normalizeCreateBody,
    z.object({
      name: z.string().trim().min(1).max(255),
      clientType: z.nativeEnum(ClientType),
      mobile: nullableTrimmedString.optional(),
      whatsapp: nullableTrimmedString.optional(),
      email: nullableEmailString.optional(),
      saudiCity: z.string().trim().min(1).max(100),
      notes: nullableNotesString.optional(),
      primaryPlatform: z.nativeEnum(ClientPlatform),
      sourceModule: z.nativeEnum(ClientSourceModule).default(ClientSourceModule.Manual),
      sourcePlatform: z.nativeEnum(ClientPlatform),
      sourceUrl: z.string().trim().min(1).max(2048),
      links: linksSchema.partial().optional(),
      forceCreateIfDuplicate: z.boolean().optional(),
    })
  ),
});

export const createClientFromSearchSchema = z.object({
  body: z.preprocess(
    normalizeCreateFromSearchBody,
    z.object({
      name: z.string().trim().min(1).max(255),
      clientType: z.nativeEnum(ClientType),
      mobile: nullableTrimmedString.optional(),
      whatsapp: nullableTrimmedString.optional(),
      email: nullableEmailString.optional(),
      saudiCity: z.string().trim().min(1).max(100),
      notes: nullableNotesString.optional(),
      sourcePlatform: z.nativeEnum(ClientPlatform),
      sourceUrl: z.string().trim().min(1).max(2048),
      links: linksSchema.partial().optional(),
      forceCreateIfDuplicate: z.boolean().optional(),
    })
  ),
});

export const listClientsSchema = z.object({
  query: z.preprocess(
    normalizeListClientsQuery,
    z.object({
      keyword: z.preprocess(value => normalizeString(value), z.string().trim().optional()),
      status: z.preprocess(value => normalizeEnumString(value), z.nativeEnum(ClientStatus).optional()),
      clientType: z.preprocess(value => normalizeEnumString(value), z.nativeEnum(ClientType).optional()),
      ownerUserId: z.preprocess(value => normalizeString(value), z.string().uuid().optional()),
      primaryPlatform: z.preprocess(value => normalizeEnumString(value), z.nativeEnum(ClientPlatform).optional()),
      saudiCity: z.preprocess(value => normalizeString(value), z.string().trim().optional()),
      includeArchived: z.preprocess(value => normalizeBoolean(value), z.boolean().optional()),
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

export const listClientOwnerOptionsSchema = z.object({
  query: z.object({
    keyword: z.preprocess(value => normalizeString(value), z.string().trim().optional()),
    limit: z.preprocess(
      value => normalizeOptionalNumber(value),
      z.number().int().min(1).max(200).default(100)
    ),
  }),
});

export const clientIdParamSchema = z.object({
  params: z.object({
    clientId: z.string().uuid(),
  }),
});

export const updateClientSchema = z.object({
  params: z.object({
    clientId: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().trim().min(1).max(255).optional(),
    clientType: z.nativeEnum(ClientType).optional(),
    mobile: nullableTrimmedString.optional(),
    whatsapp: nullableTrimmedString.optional(),
    email: nullableEmailString.optional(),
    saudiCity: z.string().trim().min(1).max(100).optional(),
    notes: nullableNotesString.optional(),
    primaryPlatform: z.nativeEnum(ClientPlatform).optional(),
    sourceUrl: z.string().trim().min(1).max(2048).optional(),
    links: linksSchema.partial().optional(),
  }),
});

export const changeClientStatusSchema = z.object({
  params: z.object({
    clientId: z.string().uuid(),
  }),
  body: z.object({
    status: z.nativeEnum(ClientStatus),
  }),
});

export const changeClientOwnerSchema = z.object({
  params: z.object({
    clientId: z.string().uuid(),
  }),
  body: z.object({
    newOwnerUserId: z.string().uuid(),
  }),
});
