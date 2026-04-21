import { ClientModel } from '../../../clients/infrastructure/persistence/models/client.model';
import { UserModel } from '../../../auth/infrastructure/persistence/models/user.model';
import {
  ClientForAnalysisLookup,
  ClientsLookupRepository,
} from '../../domain/repositories';

export class MySQLAnalysisClientsLookupRepository implements ClientsLookupRepository {
  async existsById(clientId: string): Promise<boolean> {
    const count = await ClientModel.count({
      where: { id: clientId },
    });
    return count > 0;
  }

  async findClientForAnalysis(clientId: string): Promise<ClientForAnalysisLookup | null> {
    const client = await ClientModel.findByPk(clientId);
    if (!client) {
      return null;
    }

    const owner = await UserModel.findByPk(client.ownerUserId, {
      attributes: ['id', 'fullName'],
    });

    return {
      id: client.id,
      name: client.name,
      ownerUserId: client.ownerUserId,
      ownerName: owner?.fullName ?? null,
      saudiCity: client.saudiCity,
      links: {
        websiteUrl: client.websiteUrl,
        facebookUrl: client.facebookUrl,
        instagramUrl: client.instagramUrl,
        snapchatUrl: client.snapchatUrl,
        linkedinUrl: client.linkedinUrl,
        xUrl: client.xUrl,
        tiktokUrl: client.tiktokUrl,
      },
    };
  }
}
