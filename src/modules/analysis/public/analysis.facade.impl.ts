import { AnalysisFacade } from './analysis.facade';
import {
  ClientAnalysisDto,
  DeleteClientAnalysisRequestDto,
  GetClientAnalysisRequestDto,
  GetTeamAnalysisOverviewRequestDto,
  RunClientAnalysisRequestDto,
  TeamAnalysisOverviewResponseDto,
} from './analysis.types';
import { AnalysisMapperService } from '../application/services/analysis-mapper.service';
import { RunClientAnalysisUseCase } from '../application/use-cases/run-client-analysis.use-case';
import { GetClientAnalysisUseCase } from '../application/use-cases/get-client-analysis.use-case';
import { DeleteClientAnalysisUseCase } from '../application/use-cases/delete-client-analysis.use-case';
import { GetTeamAnalysisOverviewUseCase } from '../application/use-cases/get-team-analysis-overview.use-case';

export class AnalysisFacadeImpl implements AnalysisFacade {
  constructor(
    private readonly mapper: AnalysisMapperService,
    private readonly runClientAnalysisUseCase: RunClientAnalysisUseCase,
    private readonly getClientAnalysisUseCase: GetClientAnalysisUseCase,
    private readonly deleteClientAnalysisUseCase: DeleteClientAnalysisUseCase,
    private readonly getTeamAnalysisOverviewUseCase: GetTeamAnalysisOverviewUseCase
  ) {}

  async runClientAnalysis(input: RunClientAnalysisRequestDto): Promise<ClientAnalysisDto> {
    const details = await this.runClientAnalysisUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      clientId: input.clientId,
    });

    return this.mapper.toClientAnalysisDto(details);
  }

  async getClientAnalysis(input: GetClientAnalysisRequestDto): Promise<ClientAnalysisDto | null> {
    const details = await this.getClientAnalysisUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      clientId: input.clientId,
    });

    return details ? this.mapper.toClientAnalysisDto(details) : null;
  }

  async deleteClientAnalysis(input: DeleteClientAnalysisRequestDto): Promise<void> {
    await this.deleteClientAnalysisUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      clientId: input.clientId,
    });
  }

  async getTeamAnalysisOverview(
    input: GetTeamAnalysisOverviewRequestDto
  ): Promise<TeamAnalysisOverviewResponseDto> {
    const result = await this.getTeamAnalysisOverviewUseCase.execute({
      actorUserId: input.actorUserId,
      actorUserRole: input.actorUserRole,
      filters: {
        keyword: input.keyword,
        ownerUserId: input.ownerUserId,
        hasAnalysis: input.hasAnalysis,
      },
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
      },
    });

    return this.mapper.toTeamOverviewResponseDto(result);
  }
}
