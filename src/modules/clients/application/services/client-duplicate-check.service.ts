import { ClientPlatform } from '../../domain/enums';
import { DuplicateCheckResult } from '../../domain/entities';
import { ClientsRepository, DuplicateCheckInput, DuplicateMatch } from '../../domain/repositories';

export interface DuplicateProbeInput {
  mobile?: string | null;
  email?: string | null;
  sourceUrl?: string | null;
  primaryPlatform?: ClientPlatform;
  links?: Partial<Record<string, string | null | undefined>>;
  excludeClientId?: string;
}

export interface DuplicateProbeOutput {
  result: DuplicateCheckResult;
  matches: DuplicateMatch[];
  normalizedInput: DuplicateCheckInput;
}

export class ClientDuplicateCheckService {
  constructor(private readonly clientsRepo: ClientsRepository) {}

  async check(input: DuplicateProbeInput): Promise<DuplicateProbeOutput> {
    const normalizedInput = this.toDuplicateCheckInput(input);
    const matches = await this.clientsRepo.findDuplicateMatches(normalizedInput);

    const first = matches[0];
    const result: DuplicateCheckResult = {
      isDuplicate: matches.length > 0,
      matchedBy: first?.matchedBy ?? null,
      matchedClientId: first?.clientId ?? null,
      matchedFields: first?.matchedFields ?? [],
    };

    return { result, matches, normalizedInput };
  }

  private toDuplicateCheckInput(input: DuplicateProbeInput): DuplicateCheckInput {
    const normalizedMobile = this.normalizeMobile(input.mobile);
    const normalizedEmail = this.normalizeEmail(input.email);
    const socialProfileUrls: Partial<Record<ClientPlatform, string>> = {};

    const links = input.links || {};
    const sourceUrl = this.normalizeUrl(input.sourceUrl);

    if (sourceUrl && input.primaryPlatform && input.primaryPlatform !== ClientPlatform.Website) {
      socialProfileUrls[input.primaryPlatform] = sourceUrl;
    }

    for (const [key, value] of Object.entries(links)) {
      const normalized = this.normalizeUrl(value);
      if (!normalized) continue;

      const platform = this.linkKeyToPlatform(key);
      if (!platform || platform === ClientPlatform.Website) continue;

      socialProfileUrls[platform] = normalized;
    }

    const websiteUrl =
      this.normalizeUrl(links.websiteUrl) ||
      (input.primaryPlatform === ClientPlatform.Website ? sourceUrl : null);
    const websiteDomain = this.extractDomain(websiteUrl);

    return {
      mobile: normalizedMobile,
      email: normalizedEmail,
      socialProfileUrls,
      websiteDomain,
      excludeClientId: input.excludeClientId,
    };
  }

  private linkKeyToPlatform(key: string): ClientPlatform | null {
    switch (key) {
      case 'websiteUrl':
        return ClientPlatform.Website;
      case 'facebookUrl':
        return ClientPlatform.Facebook;
      case 'instagramUrl':
        return ClientPlatform.Instagram;
      case 'snapchatUrl':
        return ClientPlatform.Snapchat;
      case 'linkedinUrl':
        return ClientPlatform.Linkedin;
      case 'xUrl':
        return ClientPlatform.X;
      case 'tiktokUrl':
        return ClientPlatform.Tiktok;
      default:
        return null;
    }
  }

  private normalizeMobile(value?: string | null): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    if (trimmed === '') return null;
    return trimmed.replace(/\s+/g, '');
  }

  private normalizeEmail(value?: string | null): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    if (trimmed === '') return null;
    return trimmed.toLowerCase();
  }

  private normalizeUrl(value?: string | null): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    if (trimmed === '') return null;

    try {
      const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      const parsed = new URL(withProto);
      parsed.hash = '';
      parsed.search = '';
      parsed.hostname = parsed.hostname.toLowerCase();
      let normalized = parsed.toString();
      if (normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
      }
      return normalized;
    } catch {
      return trimmed;
    }
  }

  private extractDomain(url?: string | null): string | null {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      return parsed.hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      return null;
    }
  }
}

