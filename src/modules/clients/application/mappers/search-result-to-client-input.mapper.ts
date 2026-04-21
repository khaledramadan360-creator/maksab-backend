import { SaveClientFromSearchInput } from '../../domain/entities';
import { ClientPlatform, ClientType } from '../../domain/enums';

export interface SearchResultToClientMapperInput {
  name: string;
  clientType: ClientType;
  mobile?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  saudiCity: string;
  notes?: string | null;
  sourcePlatform: ClientPlatform;
  sourceUrl: string;
  links?: Partial<SaveClientFromSearchInput['links']>;
  forceCreateIfDuplicate?: boolean;
}

export class SearchResultToClientInputMapper {
  map(input: SearchResultToClientMapperInput): SaveClientFromSearchInput {
    return {
      name: input.name,
      clientType: input.clientType,
      mobile: input.mobile ?? null,
      whatsapp: input.whatsapp ?? null,
      email: input.email ?? null,
      saudiCity: input.saudiCity,
      notes: input.notes ?? null,
      primaryPlatform: input.sourcePlatform,
      sourcePlatform: input.sourcePlatform,
      sourceUrl: input.sourceUrl,
      links: {
        websiteUrl: input.links?.websiteUrl ?? null,
        facebookUrl: input.links?.facebookUrl ?? null,
        instagramUrl: input.links?.instagramUrl ?? null,
        snapchatUrl: input.links?.snapchatUrl ?? null,
        linkedinUrl: input.links?.linkedinUrl ?? null,
        xUrl: input.links?.xUrl ?? null,
        tiktokUrl: input.links?.tiktokUrl ?? null,
      },
      forceCreateIfDuplicate: input.forceCreateIfDuplicate ?? false,
    };
  }
}

