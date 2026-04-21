import {
  ClientAnalysisDetails,
  RunClientAnalysisInput,
  TeamAnalysisOverviewItem,
} from './entities';
import { PaginatedResult, PaginationParams, TeamAnalysisOverviewFilters } from './repositories';

export interface AnalysisActorContext {
  actorUserId: string;
  actorUserRole: string;
}

export interface RunClientAnalysisCommand extends RunClientAnalysisInput {
  actorUserRole: string;
}

export interface GetClientAnalysisInput extends AnalysisActorContext {
  clientId: string;
}

export interface DeleteClientAnalysisInput extends AnalysisActorContext {
  clientId: string;
}

export interface GetTeamAnalysisOverviewInput extends AnalysisActorContext {
  filters: TeamAnalysisOverviewFilters;
  pagination: PaginationParams;
}

export interface IAnalysisUseCases {
  runClientAnalysis(input: RunClientAnalysisCommand): Promise<ClientAnalysisDetails>;
  getClientAnalysis(input: GetClientAnalysisInput): Promise<ClientAnalysisDetails | null>;
  deleteClientAnalysis(input: DeleteClientAnalysisInput): Promise<void>;
  getTeamAnalysisOverview(
    input: GetTeamAnalysisOverviewInput
  ): Promise<PaginatedResult<TeamAnalysisOverviewItem>>;
}
