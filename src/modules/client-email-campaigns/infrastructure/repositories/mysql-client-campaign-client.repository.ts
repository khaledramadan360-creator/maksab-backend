import { Op } from 'sequelize';
import { CampaignClient } from '../../domain/entities';
import { ClientCampaignClientRepository } from '../../domain/repositories';
import { ClientModel } from '../../../clients/infrastructure/persistence/models/client.model';

export class MySQLClientCampaignClientRepository implements ClientCampaignClientRepository {
  async findByIds(clientIds: string[]): Promise<CampaignClient[]> {
    const uniqueIds = Array.from(new Set(clientIds));
    if (uniqueIds.length === 0) {
      return [];
    }

    const rows = await ClientModel.findAll({
      where: { id: { [Op.in]: uniqueIds } },
      attributes: ['id', 'name', 'email', 'ownerUserId', 'saudiCity'],
    });

    const byId = new Map(rows.map(row => [row.id, row]));

    return uniqueIds
      .map(id => byId.get(id))
      .filter((row): row is ClientModel => !!row)
      .map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        ownerUserId: row.ownerUserId,
        saudiCity: row.saudiCity,
      }));
  }
}
