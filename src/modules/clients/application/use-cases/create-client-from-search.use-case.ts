import { CreateClientFromSearchCommand, CreateClientResult } from '../dto/clients.commands';
import { CreateClientUseCase } from './create-client.use-case';
import { SearchResultToClientInputMapper } from '../mappers/search-result-to-client-input.mapper';
import { ClientSourceModule } from '../../domain/enums';
import { ValidationError } from '../errors';

export class CreateClientFromSearchUseCase {
  constructor(
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly searchMapper: SearchResultToClientInputMapper
  ) {}

  async execute(command: CreateClientFromSearchCommand): Promise<CreateClientResult> {
    if (!command.saudiCity || command.saudiCity.trim() === '') {
      throw new ValidationError('Saudi city is required');
    }

    if (!command.sourceUrl || command.sourceUrl.trim() === '') {
      throw new ValidationError('Source platform link is required');
    }

    if (!command.sourcePlatform) {
      throw new ValidationError('Source platform is required');
    }

    const fromSearchInput = this.searchMapper.map({
      name: command.name,
      clientType: command.clientType,
      mobile: command.mobile,
      whatsapp: command.whatsapp,
      email: command.email,
      saudiCity: command.saudiCity,
      notes: command.notes,
      sourcePlatform: command.sourcePlatform,
      sourceUrl: command.sourceUrl,
      links: command.links,
      forceCreateIfDuplicate: command.forceCreateIfDuplicate,
    });

    return this.createClientUseCase.execute({
      actorUserId: command.actorUserId,
      actorUserRole: command.actorUserRole,
      name: fromSearchInput.name,
      clientType: fromSearchInput.clientType,
      mobile: fromSearchInput.mobile,
      whatsapp: fromSearchInput.whatsapp,
      email: fromSearchInput.email,
      saudiCity: fromSearchInput.saudiCity,
      notes: fromSearchInput.notes,
      primaryPlatform: fromSearchInput.primaryPlatform,
      sourceModule: ClientSourceModule.LeadSearch,
      sourcePlatform: fromSearchInput.sourcePlatform,
      sourceUrl: fromSearchInput.sourceUrl,
      links: fromSearchInput.links,
      forceCreateIfDuplicate: fromSearchInput.forceCreateIfDuplicate,
    });
  }
}

