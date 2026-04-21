export const AnalysisTargetRules = {
  clientBoundOnly: true,
  directSearchResultAnalysisAllowed: false,
  freeLinkAnalysisAllowed: false,
} as const;

export const AutoPlatformSelectionRules = {
  analyzeAllSavedPlatformsAutomatically: true,
  manualPlatformSelectionInV1: false,
} as const;

export const ReplaceOnRerunRules = {
  oneAnalysisPerClient: true,
  rerunReplacesOldAnalysis: true,
} as const;

export const NoAnalysisWithoutLinksRules = {
  requiresAtLeastOneValidPlatformLink: true,
} as const;

export const OwnershipRules = {
  employeeCanAnalyzeOwnClientsOnly: true,
  managerCanAnalyzeAllClients: true,
  adminCanAnalyzeAllClients: true,
  viewerCanAnalyzeClients: false,
} as const;

export const ViewerRules = {
  uiPreviewOnly: true,
  canSeeRealAnalysisData: false,
  canRunAnalysis: false,
} as const;

export const OutputRules = {
  requiresSummary: true,
  requiresOverallScore: true,
  requiresPlatformScores: true,
  requiresStrengths: true,
  requiresWeaknesses: true,
  requiresRecommendations: true,
} as const;

export const ScrapingRules = {
  dataSourceIsSavedClientLinksOnly: true,
  reSearchDuringAnalysisAllowed: false,
} as const;
