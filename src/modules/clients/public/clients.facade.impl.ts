import { ClientsFacade } from './clients.facade';
import {
  ClientOwnerOptionDto,
  ChangeClientOwnerRequestDto,
  ChangeClientStatusRequestDto,
  ClientDetailsDto,
  CreateClientFromSearchRequestDto,
  CreateClientRequestDto,
  CreateClientResultDto,
  DeleteClientRequestDto,
  GetClientByIdRequestDto,
  ListClientOwnerOptionsRequestDto,
  GetTeamClientsOverviewRequestDto,
  ListClientsQueryDto,
  ListClientsResponseDto,
  TeamClientsOverviewDto,
  UpdateClientRequestDto,
} from './clients.types';
import { ClientMapperService } from '../application/services/client-mapper.service';
import { CreateClientUseCase } from '../application/use-cases/create-client.use-case';
import { CreateClientFromSearchUseCase } from '../application/use-cases/create-client-from-search.use-case';
import { UpdateClientUseCase } from '../application/use-cases/update-client.use-case';
import { DeleteClientUseCase } from '../application/use-cases/delete-client.use-case';
import { GetClientByIdUseCase } from '../application/use-cases/get-client-by-id.use-case';
import { ListClientsUseCase } from '../application/use-cases/list-clients.use-case';
import { ChangeClientStatusUseCase } from '../application/use-cases/change-client-status.use-case';
import { ChangeClientOwnerUseCase } from '../application/use-cases/change-client-owner.use-case';
import { GetTeamClientsOverviewUseCase } from '../application/use-cases/get-team-clients-overview.use-case';
import { ListClientOwnerOptionsUseCase } from '../application/use-cases/list-client-owner-options.use-case';
import { NotFoundError, ValidationError } from '../application/errors';
import { ClientPlatform, ClientSourceModule, ClientStatus, ClientType } from '../domain/enums';

export class ClientsFacadeImpl implements ClientsFacade {
  constructor(
    private readonly mapper: ClientMapperService,
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly createClientFromSearchUseCase: CreateClientFromSearchUseCase,
    private readonly updateClientUseCase: UpdateClientUseCase,
    private readonly deleteClientUseCase: DeleteClientUseCase,
    private readonly getClientByIdUseCase: GetClientByIdUseCase,
    private readonly listClientsUseCase: ListClientsUseCase,
    private readonly listClientOwnerOptionsUseCase: ListClientOwnerOptionsUseCase,
    private readonly changeClientStatusUseCase: ChangeClientStatusUseCase,
    private readonly changeClientOwnerUseCase: ChangeClientOwnerUseCase,
    private readonly getTeamClientsOverviewUseCase: GetTeamClientsOverviewUseCase
  ) {}

  async createClient(input: CreateClientRequestDto): Promise<CreateClientResultDto> {
    const result = await this.createClientUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      name: input.name,
      clientType: this.toClientType(input.clientType),
      mobile: input.mobile,
      whatsapp: input.whatsapp,
      email: input.email,
      saudiCity: input.saudiCity,
      notes: input.notes,
      primaryPlatform: this.toClientPlatform(input.primaryPlatform),
      sourceModule: this.toClientSourceModule(input.sourceModule),
      sourcePlatform: this.toClientPlatform(input.sourcePlatform),
      sourceUrl: input.sourceUrl,
      links: input.links,
      forceCreateIfDuplicate: input.forceCreateIfDuplicate,
    });

    return {
      client: this.mapper.toClientDetailsDto(result.client),
      duplicateWarning: result.duplicateWarning
        ? this.mapper.toDuplicateWarningDto(result.duplicateWarning)
        : undefined,
    };
  }

  async createClientFromSearch(input: CreateClientFromSearchRequestDto): Promise<CreateClientResultDto> {
    const result = await this.createClientFromSearchUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      name: input.name,
      clientType: this.toClientType(input.clientType),
      mobile: input.mobile,
      whatsapp: input.whatsapp,
      email: input.email,
      saudiCity: input.saudiCity,
      notes: input.notes,
      sourcePlatform: this.toClientPlatform(input.sourcePlatform),
      sourceUrl: input.sourceUrl,
      links: input.links,
      forceCreateIfDuplicate: input.forceCreateIfDuplicate,
    });

    return {
      client: this.mapper.toClientDetailsDto(result.client),
      duplicateWarning: result.duplicateWarning
        ? this.mapper.toDuplicateWarningDto(result.duplicateWarning)
        : undefined,
    };
  }

  async updateClient(input: UpdateClientRequestDto): Promise<ClientDetailsDto> {
    const client = await this.updateClientUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      clientId: input.clientId,
      name: input.name,
      clientType: input.clientType ? this.toClientType(input.clientType) : undefined,
      mobile: input.mobile,
      whatsapp: input.whatsapp,
      email: input.email,
      saudiCity: input.saudiCity,
      notes: input.notes,
      primaryPlatform: input.primaryPlatform ? this.toClientPlatform(input.primaryPlatform) : undefined,
      sourceUrl: input.sourceUrl,
      links: input.links,
    });
    return this.mapper.toClientDetailsDto(client);
  }

  async deleteClient(input: DeleteClientRequestDto): Promise<void> {
    await this.deleteClientUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      clientId: input.clientId,
    });
  }

  async getClientById(input: GetClientByIdRequestDto): Promise<ClientDetailsDto | null> {
    try {
      const client = await this.getClientByIdUseCase.execute({
        actorUserId: input.actorUserId,
        actorUserRole: input.actorUserRole,
        clientId: input.clientId,
      });
      return this.mapper.toClientDetailsDto(client);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null;
      }
      throw error;
    }
  }

  async listClients(input: ListClientsQueryDto): Promise<ListClientsResponseDto> {
    const createdAtFrom = this.toDateFilter(input.createdAtFrom ?? input.dateFrom, 'from');
    const createdAtTo = this.toDateFilter(input.createdAtTo ?? input.dateTo, 'to');

    if (createdAtFrom && createdAtTo && createdAtFrom.getTime() > createdAtTo.getTime()) {
      throw new ValidationError('dateFrom must be before or equal to dateTo');
    }

    const result = await this.listClientsUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      filters: {
        keyword: input.keyword,
        status: input.status ? this.toClientStatus(input.status) : undefined,
        clientType: input.clientType ? this.toClientType(input.clientType) : undefined,
        ownerUserId: input.ownerUserId,
        primaryPlatform: input.primaryPlatform ? this.toClientPlatform(input.primaryPlatform) : undefined,
        saudiCity: input.saudiCity,
        includeArchived: input.includeArchived,
        createdAtFrom,
        createdAtTo,
      },
      page: input.page,
      pageSize: input.pageSize,
    });

    return this.mapper.toListClientsResponseDto(result);
  }

  async changeClientStatus(input: ChangeClientStatusRequestDto): Promise<ClientDetailsDto> {
    const client = await this.changeClientStatusUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      clientId: input.clientId,
      status: this.toClientStatus(input.status),
    });
    return this.mapper.toClientDetailsDto(client);
  }

  async listClientOwnerOptions(input: ListClientOwnerOptionsRequestDto): Promise<ClientOwnerOptionDto[]> {
    const result = await this.listClientOwnerOptionsUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      keyword: input.keyword,
      limit: input.limit,
    });

    return this.mapper.toOwnerOptionsDto(result);
  }

  async changeClientOwner(input: ChangeClientOwnerRequestDto): Promise<ClientDetailsDto> {
    const client = await this.changeClientOwnerUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      clientId: input.clientId,
      newOwnerUserId: input.newOwnerUserId,
    });
    return this.mapper.toClientDetailsDto(client);
  }

  async getTeamClientsOverview(input: GetTeamClientsOverviewRequestDto): Promise<TeamClientsOverviewDto[]> {
    const result = await this.getTeamClientsOverviewUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
    });
    return this.mapper.toTeamOverviewDto(result);
  }

  private toClientType(value: string): ClientType {
    return value as ClientType;
  }

  private toClientPlatform(value: string): ClientPlatform {
    return value as ClientPlatform;
  }

  private toClientSourceModule(value: string): ClientSourceModule {
    return value as ClientSourceModule;
  }

  private toClientStatus(value: string): ClientStatus {
    return value as ClientStatus;
  }

  private toDateFilter(value: string | undefined, direction: 'from' | 'to'): Date | undefined {
    if (!value) {
      return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const parsed = this.parseDateFilterValue(trimmed, direction);
    if (!parsed) {
      throw new ValidationError(`Invalid ${direction === 'from' ? 'dateFrom' : 'dateTo'} format`);
    }

    return parsed;
  }

  private parseDateFilterValue(value: string, direction: 'from' | 'to'): Date | null {
    const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (isoDateMatch) {
      return this.buildUtcDateBoundary(
        Number(isoDateMatch[1]),
        Number(isoDateMatch[2]),
        Number(isoDateMatch[3]),
        direction
      );
    }

    const slashDateMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
    if (slashDateMatch) {
      const first = Number(slashDateMatch[1]);
      const second = Number(slashDateMatch[2]);
      const year = Number(slashDateMatch[3]);

      // Prefer MM/DD/YYYY, but support DD/MM/YYYY when it's unambiguous.
      let month = first;
      let day = second;
      if (first > 12 && second <= 12) {
        day = first;
        month = second;
      } else if (first > 12 && second > 12) {
        return null;
      }

      return this.buildUtcDateBoundary(year, month, day, direction);
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    const hasExplicitTime = /T\d{2}:\d{2}| \d{1,2}:\d{2}/.test(value);
    if (hasExplicitTime) {
      return parsed;
    }

    return this.buildUtcDateBoundary(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth() + 1,
      parsed.getUTCDate(),
      direction
    );
  }

  private buildUtcDateBoundary(
    year: number,
    month: number,
    day: number,
    direction: 'from' | 'to'
  ): Date | null {
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    const parsed = new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        direction === 'from' ? 0 : 23,
        direction === 'from' ? 0 : 59,
        direction === 'from' ? 0 : 59,
        direction === 'from' ? 0 : 999
      )
    );

    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      return null;
    }

    return parsed;
  }
}
