import {
  DeleteClientAnalysisInput,
  GetClientAnalysisInput,
  GetTeamAnalysisOverviewInput,
  RunClientAnalysisCommand,
} from '../../domain/use-cases';

export type RunAnalysisCommand = RunClientAnalysisCommand;
export type GetAnalysisQuery = GetClientAnalysisInput;
export type DeleteAnalysisCommand = DeleteClientAnalysisInput;
export type GetTeamAnalysisOverviewQuery = GetTeamAnalysisOverviewInput;
