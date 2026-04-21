export type PublicClientType = 'person' | 'company';
export type PublicClientStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'not_interested'
  | 'converted'
  | 'archived';
export type PublicClientPlatform =
  | 'website'
  | 'facebook'
  | 'instagram'
  | 'snapchat'
  | 'linkedin'
  | 'x'
  | 'tiktok';
export type PublicClientSourceModule = 'lead_search' | 'manual';

export interface ClientLinksDto {
  websiteUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  snapchatUrl: string | null;
  linkedinUrl: string | null;
  xUrl: string | null;
  tiktokUrl: string | null;
}

export interface PublicClientDto {
  id: string;
  name: string;
  clientType: PublicClientType;
  mobile: string | null;
  whatsapp: string | null;
  email: string | null;
  saudiCity: string;
  notes: string | null;
  primaryPlatform: PublicClientPlatform;
  status: PublicClientStatus;
  sourceModule: PublicClientSourceModule;
  sourcePlatform: PublicClientPlatform;
  sourceUrl: string;
  ownerUserId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientListItemDto {
  id: string;
  name: string;
  clientType: PublicClientType;
  status: PublicClientStatus;
  primaryPlatform: PublicClientPlatform;
  saudiCity: string;
  ownerUserId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientDetailsDto extends PublicClientDto {
  links: ClientLinksDto;
}

export interface TeamClientsOverviewDto {
  employeeId: string;
  employeeName: string;
  clientsCount: number;
}

export interface ClientOwnerOptionDto {
  id: string;
  fullName: string;
  role: string;
}

export interface DuplicateWarningDto {
  isDuplicate: boolean;
  matchedBy: 'mobile' | 'email' | 'social_profile_url' | 'website_domain' | null;
  matchedClientId: string | null;
  matchedFields: string[];
}

export interface RequestActorContext {
  actorUserId: string;
  actorUserRole: string;
}

export interface CreateClientRequestDto extends RequestActorContext {
  name: string;
  clientType: PublicClientType;
  mobile?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  saudiCity: string;
  notes?: string | null;
  primaryPlatform: PublicClientPlatform;
  sourceModule: PublicClientSourceModule;
  sourcePlatform: PublicClientPlatform;
  sourceUrl: string;
  links?: Partial<ClientLinksDto>;
  forceCreateIfDuplicate?: boolean;
}

export interface CreateClientFromSearchRequestDto extends RequestActorContext {
  name: string;
  clientType: PublicClientType;
  mobile?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  saudiCity: string;
  notes?: string | null;
  primaryPlatform: PublicClientPlatform;
  sourcePlatform: PublicClientPlatform;
  sourceUrl: string;
  links: Partial<ClientLinksDto>;
  forceCreateIfDuplicate?: boolean;
}

export interface UpdateClientRequestDto extends RequestActorContext {
  clientId: string;
  name?: string;
  clientType?: PublicClientType;
  mobile?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  saudiCity?: string;
  notes?: string | null;
  primaryPlatform?: PublicClientPlatform;
  sourceUrl?: string;
  links?: Partial<ClientLinksDto>;
}

export interface ListClientsRequestDto {
  keyword?: string;
  status?: PublicClientStatus;
  clientType?: PublicClientType;
  ownerUserId?: string;
  primaryPlatform?: PublicClientPlatform;
  saudiCity?: string;
  includeArchived?: boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}

export interface ListClientsQueryDto extends RequestActorContext, ListClientsRequestDto {}

export interface ListClientOwnerOptionsRequestDto extends RequestActorContext {
  keyword?: string;
  limit?: number;
}

export interface ListClientsResponseDto {
  items: ClientListItemDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ChangeClientStatusRequestDto extends RequestActorContext {
  clientId: string;
  status: PublicClientStatus;
}

export interface ChangeClientOwnerRequestDto extends RequestActorContext {
  clientId: string;
  newOwnerUserId: string;
}

export interface DeleteClientRequestDto extends RequestActorContext {
  clientId: string;
}

export interface GetClientByIdRequestDto extends RequestActorContext {
  clientId: string;
}

export interface CreateClientResultDto {
  client: ClientDetailsDto;
  duplicateWarning?: DuplicateWarningDto;
}

export interface GetTeamClientsOverviewRequestDto extends RequestActorContext {}
