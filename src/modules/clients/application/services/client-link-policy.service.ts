import { ClientLinks } from '../../domain/entities';
import { ClientPlatform } from '../../domain/enums';
import { ValidationError } from '../errors';

export class ClientLinkPolicyService {
  normalizeLinks(input?: Partial<Record<string, string | null | undefined>>): Omit<ClientLinks, 'clientId'> {
    const pick = (value?: string | null) => {
      if (!value) return null;
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    };

    return {
      websiteUrl: pick(input?.websiteUrl),
      facebookUrl: pick(input?.facebookUrl),
      instagramUrl: pick(input?.instagramUrl),
      snapchatUrl: pick(input?.snapchatUrl),
      linkedinUrl: pick(input?.linkedinUrl),
      xUrl: pick(input?.xUrl),
      tiktokUrl: pick(input?.tiktokUrl),
    };
  }

  applySourceLinkToPlatform(
    links: Omit<ClientLinks, 'clientId'>,
    sourcePlatform: ClientPlatform,
    sourceUrl: string
  ): Omit<ClientLinks, 'clientId'> {
    const linkKey = this.platformToLinkKey(sourcePlatform);
    if (!linkKey) {
      return links;
    }

    return {
      ...links,
      [linkKey]: sourceUrl,
    };
  }

  assertPrimaryLinkExists(primaryPlatform: ClientPlatform, links: Omit<ClientLinks, 'clientId'>): void {
    const linkKey = this.platformToLinkKey(primaryPlatform);
    if (!linkKey) {
      throw new ValidationError(`Unsupported primary platform: ${primaryPlatform}`);
    }

    const value = links[linkKey];
    if (!value || value.trim() === '') {
      throw new ValidationError('Primary platform link must exist');
    }
  }

  assertRequiredSourceLink(sourceUrl?: string | null): void {
    if (!sourceUrl || sourceUrl.trim() === '') {
      throw new ValidationError('Source platform link is required');
    }
  }

  private platformToLinkKey(platform: ClientPlatform): keyof Omit<ClientLinks, 'clientId'> | null {
    switch (platform) {
      case ClientPlatform.Website:
        return 'websiteUrl';
      case ClientPlatform.Facebook:
        return 'facebookUrl';
      case ClientPlatform.Instagram:
        return 'instagramUrl';
      case ClientPlatform.Snapchat:
        return 'snapchatUrl';
      case ClientPlatform.Linkedin:
        return 'linkedinUrl';
      case ClientPlatform.X:
        return 'xUrl';
      case ClientPlatform.Tiktok:
        return 'tiktokUrl';
      default:
        return null;
    }
  }
}

