import { Client, ClientLinks, ClientSummary } from '../../domain/entities';
import { ClientPlatform, ClientSourceModule, ClientStatus, ClientType } from '../../domain/enums';
import { ClientModel } from '../persistence/models/client.model';

export class ClientMapper {
  static toDomain(model: ClientModel, ownerName?: string | null): Client {
    return {
      id: model.id,
      name: model.name,
      clientType: model.clientType as ClientType,
      mobile: model.mobile,
      whatsapp: model.whatsapp,
      email: model.email,
      saudiCity: model.saudiCity,
      notes: model.notes,
      primaryPlatform: model.primaryPlatform as ClientPlatform,
      status: model.status as ClientStatus,
      sourceModule: model.sourceModule as ClientSourceModule,
      sourcePlatform: model.sourcePlatform as ClientPlatform,
      sourceUrl: model.sourceUrl,
      links: this.toLinksPayload(model),
      ownerUserId: model.ownerUserId,
      ownerName: ownerName ?? this.getOwnerNameFromModel(model),
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  static toSummary(model: ClientModel, ownerName?: string | null): ClientSummary {
    return {
      id: model.id,
      name: model.name,
      clientType: model.clientType as ClientType,
      status: model.status as ClientStatus,
      primaryPlatform: model.primaryPlatform as ClientPlatform,
      saudiCity: model.saudiCity,
      ownerUserId: model.ownerUserId,
      ownerName: ownerName ?? this.getOwnerNameFromModel(model),
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  static toLinksPayload(model: ClientModel): Omit<ClientLinks, 'clientId'> {
    return {
      websiteUrl: model.websiteUrl,
      facebookUrl: model.facebookUrl,
      instagramUrl: model.instagramUrl,
      snapchatUrl: model.snapchatUrl,
      linkedinUrl: model.linkedinUrl,
      xUrl: model.xUrl,
      tiktokUrl: model.tiktokUrl,
    };
  }

  private static getOwnerNameFromModel(model: ClientModel): string | null {
    const anyModel = model as unknown as { get?: (key: string) => unknown; ownerName?: unknown };
    const fromGetter = typeof anyModel.get === 'function' ? anyModel.get('ownerName') : undefined;
    const candidate = fromGetter ?? anyModel.ownerName;

    if (typeof candidate !== 'string') {
      return null;
    }

    const trimmed = candidate.trim();
    return trimmed === '' ? null : trimmed;
  }
}
