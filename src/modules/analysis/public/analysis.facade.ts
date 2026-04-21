import {
  ClientAnalysisDto,
  DeleteClientAnalysisRequestDto,
  GetClientAnalysisRequestDto,
  GetTeamAnalysisOverviewRequestDto,
  RunClientAnalysisRequestDto,
  TeamAnalysisOverviewResponseDto,
} from './analysis.types';

/**
 * Public gateway for the analysis module.
 * This is the only contract external consumers should use.
 */
export interface AnalysisFacade {
  runClientAnalysis(input: RunClientAnalysisRequestDto): Promise<ClientAnalysisDto>;
  getClientAnalysis(input: GetClientAnalysisRequestDto): Promise<ClientAnalysisDto | null>;
  deleteClientAnalysis(input: DeleteClientAnalysisRequestDto): Promise<void>;
  getTeamAnalysisOverview(input: GetTeamAnalysisOverviewRequestDto): Promise<TeamAnalysisOverviewResponseDto>;
}
