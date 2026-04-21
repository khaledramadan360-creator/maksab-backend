import {
  Client,
  ClientOwnerOption,
  ClientSummary,
  DuplicateCheckResult,
  TeamClientOverviewItem,
} from '../../domain/entities';
import {
  ClientOwnerOptionDto,
  ClientDetailsDto,
  ClientListItemDto,
  DuplicateWarningDto,
  ListClientsResponseDto,
  TeamClientsOverviewDto,
} from '../../public/clients.types';
import { PaginatedResult } from '../../domain/repositories';

export class ClientMapperService {
  toClientDetailsDto(client: Client): ClientDetailsDto {
    return {
      id: client.id,
      name: client.name,
      clientType: client.clientType,
      mobile: client.mobile,
      whatsapp: client.whatsapp,
      email: client.email,
      saudiCity: client.saudiCity,
      notes: client.notes,
      primaryPlatform: client.primaryPlatform,
      status: client.status,
      sourceModule: client.sourceModule,
      sourcePlatform: client.sourcePlatform,
      sourceUrl: client.sourceUrl,
      ownerUserId: client.ownerUserId,
      ownerName: client.ownerName || 'Unknown',
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
      links: {
        websiteUrl: client.links.websiteUrl,
        facebookUrl: client.links.facebookUrl,
        instagramUrl: client.links.instagramUrl,
        snapchatUrl: client.links.snapchatUrl,
        linkedinUrl: client.links.linkedinUrl,
        xUrl: client.links.xUrl,
        tiktokUrl: client.links.tiktokUrl,
      },
    };
  }

  toClientListItemDto(summary: ClientSummary): ClientListItemDto {
    return {
      id: summary.id,
      name: summary.name,
      clientType: summary.clientType,
      status: summary.status,
      primaryPlatform: summary.primaryPlatform,
      saudiCity: summary.saudiCity,
      ownerUserId: summary.ownerUserId,
      ownerName: summary.ownerName || 'Unknown',
      createdAt: summary.createdAt.toISOString(),
      updatedAt: summary.updatedAt.toISOString(),
    };
  }

  toListClientsResponseDto(result: PaginatedResult<ClientSummary>): ListClientsResponseDto {
    return {
      items: result.items.map(item => this.toClientListItemDto(item)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  toTeamOverviewDto(items: TeamClientOverviewItem[]): TeamClientsOverviewDto[] {
    return items.map(item => ({
      employeeId: item.employeeId,
      employeeName: item.employeeName,
      clientsCount: item.clientsCount,
    }));
  }

  toOwnerOptionsDto(items: ClientOwnerOption[]): ClientOwnerOptionDto[] {
    return items.map(item => ({
      id: item.id,
      fullName: item.fullName,
      role: item.role,
    }));
  }

  toDuplicateWarningDto(duplicate: DuplicateCheckResult): DuplicateWarningDto {
    return {
      isDuplicate: duplicate.isDuplicate,
      matchedBy: duplicate.matchedBy,
      matchedClientId: duplicate.matchedClientId,
      matchedFields: duplicate.matchedFields,
    };
  }
}
