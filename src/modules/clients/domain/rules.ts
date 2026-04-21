import { ClientPlatform, ClientStatus } from './enums';

export const OwnerRules = {
  singleOwnerOnly: true,
  creatorIsOwnerInV1: true,
} as const;

export const SaveFromSearchRules = {
  requiresSaudiCity: true,
  requiresSourcePlatformLink: true,
  requiresPrimaryPlatform: true,
  remainingLinksAreOptional: true,
} as const;

export const DuplicateRules = {
  exactMobile: true,
  exactEmail: true,
  exactSocialProfileUrl: true,
  exactWebsiteDomain: true,
} as const;

export const ViewerRules = {
  uiPreviewOnly: true,
  canSeeRealData: false,
  canExecuteActions: false,
} as const;

export const DeleteRules = {
  deleteIsPhysical: true,
  deleteIsNotArchive: true,
  archivedRemainsAValidStatus: true,
} as const;

export const DefaultStatusRules = {
  defaultStatusOnCreate: ClientStatus.New,
} as const;

export const LinkRules = {
  oneLinkPerPlatform: true,
  primaryPlatformLinkMustExist: true,
} as const;

export const SocialProfilePlatforms: ClientPlatform[] = [
  ClientPlatform.Facebook,
  ClientPlatform.Instagram,
  ClientPlatform.Snapchat,
  ClientPlatform.Linkedin,
  ClientPlatform.X,
  ClientPlatform.Tiktok,
];

export const PlatformToLinkKeyMap: Record<ClientPlatform, string> = {
  [ClientPlatform.Website]: 'websiteUrl',
  [ClientPlatform.Facebook]: 'facebookUrl',
  [ClientPlatform.Instagram]: 'instagramUrl',
  [ClientPlatform.Snapchat]: 'snapchatUrl',
  [ClientPlatform.Linkedin]: 'linkedinUrl',
  [ClientPlatform.X]: 'xUrl',
  [ClientPlatform.Tiktok]: 'tiktokUrl',
};

