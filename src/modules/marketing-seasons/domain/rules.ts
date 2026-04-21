import { MarketingSeasonStatus } from './enums';

export const SingleActiveSeasonRule = {
  oneActiveSeasonOnly: true,
} as const;

export const DefaultStatusRule = {
  defaultStatusOnCreate: MarketingSeasonStatus.Inactive,
} as const;

export const ReportsConsumptionRule = {
  reportsConsumeActiveSeasonOnly: true,
  inactiveSeasonsExcludedFromPdf: true,
} as const;

export const EmployeeScopeRule = {
  employeeCanCreateSeasons: true,
  employeeCanUpdateOwnSeasonsOnly: true,
  employeeCanDeleteOwnSeasonsOnly: true,
  employeeCanViewSeasons: true,
} as const;

export const ManagerAdminScopeRule = {
  managerCanManageAllSeasons: true,
  adminCanManageAllSeasons: true,
} as const;

export const ViewerRule = {
  uiPreviewOnly: true,
  canSeeRealData: false,
  canExecuteActions: false,
} as const;

export const ActivationReplaceRule = {
  deactivateCurrentActiveBeforeActivation: true,
  activateRequestedSeasonAfterDeactivation: true,
} as const;
