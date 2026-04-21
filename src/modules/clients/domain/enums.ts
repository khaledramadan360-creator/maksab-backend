export enum ClientType {
  Person = 'person',
  Company = 'company',
}

export enum ClientStatus {
  New = 'new',
  Contacted = 'contacted',
  Interested = 'interested',
  NotInterested = 'not_interested',
  Converted = 'converted',
  Archived = 'archived',
}

export enum ClientPlatform {
  Website = 'website',
  Facebook = 'facebook',
  Instagram = 'instagram',
  Snapchat = 'snapchat',
  Linkedin = 'linkedin',
  X = 'x',
  Tiktok = 'tiktok',
}

export enum ClientSourceModule {
  LeadSearch = 'lead_search',
  Manual = 'manual',
}

export enum AuditAction {
  ClientCreated = 'client.created',
  ClientUpdated = 'client.updated',
  ClientDeleted = 'client.deleted',
  ClientStatusChanged = 'client.status.changed',
  ClientOwnerChanged = 'client.owner.changed',
  ClientLinkUpdated = 'client.link.updated',
  ClientDuplicateDetected = 'client.duplicate.detected',
}

