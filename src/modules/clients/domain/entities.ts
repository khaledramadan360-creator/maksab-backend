import {
  ClientPlatform,
  ClientSourceModule,
  ClientStatus,
  ClientType,
} from './enums';

export interface Client {
  id: string;
  name: string;
  clientType: ClientType;
  mobile: string | null;
  whatsapp: string | null;
  email: string | null;
  saudiCity: string;
  notes: string | null;
  primaryPlatform: ClientPlatform;
  status: ClientStatus;
  sourceModule: ClientSourceModule;
  sourcePlatform: ClientPlatform;
  sourceUrl: string;
  links: Omit<ClientLinks, 'clientId'>;
  ownerUserId: string;
  ownerName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientLinks {
  clientId: string;
  websiteUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  snapchatUrl: string | null;
  linkedinUrl: string | null;
  xUrl: string | null;
  tiktokUrl: string | null;
}

export interface SaveClientFromSearchInput {
  name: string;
  clientType: ClientType;
  mobile?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  saudiCity: string;
  notes?: string | null;
  primaryPlatform: ClientPlatform;
  sourcePlatform: ClientPlatform;
  sourceUrl: string;
  links: Omit<ClientLinks, 'clientId'>;
  forceCreateIfDuplicate?: boolean;
}

export type DuplicateMatchedBy = 'mobile' | 'email' | 'social_profile_url' | 'website_domain';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedBy: DuplicateMatchedBy | null;
  matchedClientId: string | null;
  matchedFields: string[];
}

export interface ClientSummary {
  id: string;
  name: string;
  clientType: ClientType;
  status: ClientStatus;
  primaryPlatform: ClientPlatform;
  saudiCity: string;
  ownerUserId: string;
  ownerName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamClientOverviewItem {
  employeeId: string;
  employeeName: string;
  clientsCount: number;
}

export interface ClientOwnerOption {
  id: string;
  fullName: string;
  role: string;
}
