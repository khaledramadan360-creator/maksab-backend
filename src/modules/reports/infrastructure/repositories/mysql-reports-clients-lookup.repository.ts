import { ClientModel } from '../../../clients/infrastructure/persistence/models/client.model';
import { UserModel } from '../../../auth/infrastructure/persistence/models/user.model';
import { ReportClientSnapshot } from '../../domain/entities';
import { ReportsClientsLookupRepository } from '../../domain/repositories';

export class MySQLReportsClientsLookupRepository implements ReportsClientsLookupRepository {
  async existsById(clientId: string): Promise<boolean> {
    const count = await ClientModel.count({
      where: { id: clientId },
    });

    return count > 0;
  }

  async findClientForReport(clientId: string): Promise<ReportClientSnapshot | null> {
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
    };
  }
}
