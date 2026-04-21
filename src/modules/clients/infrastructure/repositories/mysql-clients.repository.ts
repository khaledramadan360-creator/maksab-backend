import { v4 as uuidv4 } from 'uuid';
import { Op, WhereOptions, fn, col } from 'sequelize';
import {
  ClientCreateRecord,
  ClientUpdatePatch,
  ClientsListFilters,
  ClientsRepository,
  DuplicateCheckInput,
  DuplicateMatch,
  PaginatedResult,
  PaginationParams,
} from '../../domain/repositories';
import { Client, ClientSummary, TeamClientOverviewItem } from '../../domain/entities';
import { ClientStatus, ClientPlatform } from '../../domain/enums';
import { ClientModel } from '../persistence/models/client.model';
import { ClientMapper } from '../mappers/client.mapper';
import { UserModel } from '../../../auth/infrastructure/persistence/models/user.model';

type TeamCountRow = {
  ownerUserId: string;
  clientsCount: number | string;
};

export class MySQLClientsRepository implements ClientsRepository {
  async create(record: ClientCreateRecord): Promise<Client> {
    const id = uuidv4();
    const now = new Date();
    const linkFields = this.toLinkFields(record.links);

    const model = await ClientModel.create({
      id,
      name: record.name,
      clientType: record.clientType,
      mobile: record.mobile,
      whatsapp: record.whatsapp,
      email: record.email,
      saudiCity: record.saudiCity,
      notes: record.notes,
      primaryPlatform: record.primaryPlatform,
      status: record.status,
      sourceModule: record.sourceModule,
      sourcePlatform: record.sourcePlatform,
      sourceUrl: record.sourceUrl,
      ownerUserId: record.ownerUserId,
      ...linkFields,
      createdAt: now,
      updatedAt: now,
    });

    return this.attachOwnerNameToClient(ClientMapper.toDomain(model));
  }

  async update(clientId: string, patch: ClientUpdatePatch): Promise<Client> {
    const model = await ClientModel.findByPk(clientId);
    if (!model) {
      throw new Error('Client not found');
    }

    const updates: Record<string, any> = {};

    if (patch.name !== undefined) updates.name = patch.name;
    if (patch.clientType !== undefined) updates.clientType = patch.clientType;
    if (patch.mobile !== undefined) updates.mobile = patch.mobile;
    if (patch.whatsapp !== undefined) updates.whatsapp = patch.whatsapp;
    if (patch.email !== undefined) updates.email = patch.email;
    if (patch.saudiCity !== undefined) updates.saudiCity = patch.saudiCity;
    if (patch.notes !== undefined) updates.notes = patch.notes;
    if (patch.primaryPlatform !== undefined) updates.primaryPlatform = patch.primaryPlatform;
    if (patch.sourceUrl !== undefined) updates.sourceUrl = patch.sourceUrl;

    if (patch.links) {
      Object.assign(updates, this.toLinkFields(patch.links));
    }

    updates.updatedAt = new Date();
    await model.update(updates);

    return this.attachOwnerNameToClient(ClientMapper.toDomain(model));
  }

  async delete(clientId: string): Promise<void> {
    const affected = await ClientModel.destroy({ where: { id: clientId } });
    if (affected === 0) {
      throw new Error('Client not found');
    }
  }

  async findById(clientId: string): Promise<Client | null> {
    const model = await ClientModel.findByPk(clientId);
    if (!model) {
      return null;
    }

    return this.attachOwnerNameToClient(ClientMapper.toDomain(model));
  }

  async list(
    filters: ClientsListFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<ClientSummary>> {
    const where: WhereOptions = {};

    if (filters.keyword && filters.keyword.trim() !== '') {
      const keyword = filters.keyword.trim();
      (where as any)[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { mobile: { [Op.like]: `%${keyword}%` } },
        { whatsapp: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
      ];
    }

    if (filters.ownerUserId) {
      where['ownerUserId'] = filters.ownerUserId;
    }

    if (filters.primaryPlatform) {
      where['primaryPlatform'] = filters.primaryPlatform;
    }

    if (filters.clientType) {
      where['clientType'] = filters.clientType;
    }

    if (filters.saudiCity) {
      where['saudiCity'] = filters.saudiCity;
    }

    if (filters.status) {
      where['status'] = filters.status;
    } else if (!filters.includeArchived) {
      where['status'] = { [Op.ne]: ClientStatus.Archived };
    }

    if (filters.createdAtFrom || filters.createdAtTo) {
      const createdAtRange: Record<symbol, Date> = {};
      if (filters.createdAtFrom) createdAtRange[Op.gte] = filters.createdAtFrom;
      if (filters.createdAtTo) createdAtRange[Op.lte] = filters.createdAtTo;
      (where as any)['createdAt'] = createdAtRange;
    }

    const page = Math.max(1, pagination.page);
    const pageSize = Math.max(1, pagination.pageSize);
    const offset = (page - 1) * pageSize;

    const { count, rows } = await ClientModel.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset,
    });

    const ownerNameById = await this.getOwnerNameById(
      rows.map(row => row.ownerUserId)
    );

    return {
      items: rows.map(row => ClientMapper.toSummary(row, ownerNameById.get(row.ownerUserId) || null)),
      total: count,
      page,
      pageSize,
    };
  }

  async changeStatus(clientId: string, newStatus: ClientStatus): Promise<Client> {
    const model = await ClientModel.findByPk(clientId);
    if (!model) {
      throw new Error('Client not found');
    }

    model.status = newStatus;
    model.updatedAt = new Date();
    await model.save();
    return this.attachOwnerNameToClient(ClientMapper.toDomain(model));
  }

  async changeOwner(clientId: string, newOwnerUserId: string): Promise<Client> {
    const model = await ClientModel.findByPk(clientId);
    if (!model) {
      throw new Error('Client not found');
    }

    model.ownerUserId = newOwnerUserId;
    model.updatedAt = new Date();
    await model.save();
    return this.attachOwnerNameToClient(ClientMapper.toDomain(model));
  }

  async existsDuplicate(input: DuplicateCheckInput): Promise<boolean> {
    const matches = await this.findDuplicateMatches(input);
    return matches.length > 0;
  }

  async findDuplicateMatches(input: DuplicateCheckInput): Promise<DuplicateMatch[]> {
    const matchesMap = new Map<string, DuplicateMatch>();
    const excludeClientId = input.excludeClientId || null;

    if (input.mobile) {
      const rows = await ClientModel.findAll({
        where: this.withOptionalExclude({ mobile: input.mobile }, excludeClientId),
        attributes: ['id'],
      });
      rows.forEach(row => this.pushMatch(matchesMap, row.id, 'mobile', ['mobile']));
    }

    if (input.email) {
      const rows = await ClientModel.findAll({
        where: this.withOptionalExclude({ email: input.email }, excludeClientId),
        attributes: ['id'],
      });
      rows.forEach(row => this.pushMatch(matchesMap, row.id, 'email', ['email']));
    }

    if (input.socialProfileUrls) {
      const socialEntries = Object.entries(input.socialProfileUrls).filter(([, value]) => !!value && value.trim() !== '');

      for (const [platform, value] of socialEntries) {
        const platformEnum = platform as ClientPlatform;
        const column = this.platformToLinkColumn(platformEnum);
        if (!column) {
          continue;
        }

        const rows = await ClientModel.findAll({
          where: this.withOptionalExclude({ [column]: value }, excludeClientId),
          attributes: ['id'],
        });

        rows.forEach(row =>
          this.pushMatch(matchesMap, row.id, 'social_profile_url', [column])
        );
      }
    }

    if (input.websiteDomain) {
      const rows = await ClientModel.findAll({
        where: this.withOptionalExclude(
          { websiteUrl: { [Op.like]: `%${input.websiteDomain}%` } },
          excludeClientId
        ),
        attributes: ['id', 'websiteUrl'],
      });

      for (const row of rows) {
        const candidateDomain = this.extractDomain(row.websiteUrl);
        if (candidateDomain && candidateDomain === input.websiteDomain) {
          this.pushMatch(matchesMap, row.id, 'website_domain', ['websiteUrl']);
        }
      }
    }

    return Array.from(matchesMap.values());
  }

  async getTeamOverview(): Promise<TeamClientOverviewItem[]> {
    const grouped = (await ClientModel.findAll({
      attributes: [
        'ownerUserId',
        [fn('COUNT', col('id')), 'clientsCount'],
      ],
      group: ['ownerUserId'],
      raw: true,
    })) as unknown as TeamCountRow[];

    if (grouped.length === 0) {
      return [];
    }

    const ownerIds = grouped.map(row => row.ownerUserId);
    const users = await UserModel.findAll({
      where: { id: { [Op.in]: ownerIds } },
      attributes: ['id', 'fullName'],
      raw: true,
    });
    const userNameById = new Map(users.map(user => [String((user as any).id), String((user as any).fullName)]));

    return grouped.map(row => ({
      employeeId: row.ownerUserId,
      employeeName: userNameById.get(row.ownerUserId) || 'Unknown',
      clientsCount: Number(row.clientsCount),
    }));
  }

  private async attachOwnerNameToClient(client: Client): Promise<Client> {
    const ownerNameById = await this.getOwnerNameById([client.ownerUserId]);
    return {
      ...client,
      ownerName: ownerNameById.get(client.ownerUserId) || null,
    };
  }

  private async getOwnerNameById(ownerIds: string[]): Promise<Map<string, string>> {
    const uniqueOwnerIds = Array.from(new Set(ownerIds.filter(ownerId => !!ownerId)));
    if (uniqueOwnerIds.length === 0) {
      return new Map();
    }

    const users = await UserModel.findAll({
      where: { id: { [Op.in]: uniqueOwnerIds } },
      attributes: ['id', 'fullName'],
      raw: true,
    });

    return new Map(
      users.map(user => [String((user as any).id), String((user as any).fullName)])
    );
  }

  private toLinkFields(links: Partial<Record<string, string | null>>): Record<string, string | null> {
    return {
      websiteUrl: links.websiteUrl ?? null,
      facebookUrl: links.facebookUrl ?? null,
      instagramUrl: links.instagramUrl ?? null,
      snapchatUrl: links.snapchatUrl ?? null,
      linkedinUrl: links.linkedinUrl ?? null,
      xUrl: links.xUrl ?? null,
      tiktokUrl: links.tiktokUrl ?? null,
    };
  }

  private withOptionalExclude(where: Record<string, any>, excludeClientId: string | null): WhereOptions {
    if (!excludeClientId) {
      return where;
    }

    return {
      ...where,
      id: { [Op.ne]: excludeClientId },
    };
  }

  private pushMatch(
    matchesMap: Map<string, DuplicateMatch>,
    clientId: string,
    matchedBy: DuplicateMatch['matchedBy'],
    fields: string[]
  ): void {
    const key = `${clientId}:${matchedBy}`;
    const existing = matchesMap.get(key);
    if (!existing) {
      matchesMap.set(key, {
        clientId,
        matchedBy,
        matchedFields: Array.from(new Set(fields)),
      });
      return;
    }

    existing.matchedFields = Array.from(new Set([...existing.matchedFields, ...fields]));
  }

  private platformToLinkColumn(platform: ClientPlatform): string | null {
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

  private extractDomain(url: string | null): string | null {
    if (!url || url.trim() === '') {
      return null;
    }

    try {
      const normalized = url.match(/^https?:\/\//i) ? url : `https://${url}`;
      return new URL(normalized).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      return null;
    }
  }
}
