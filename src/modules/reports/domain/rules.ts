import {
  ReportFormat,
  ReportTemplateKey,
} from './enums';

export const ReportDataSourceRules = {
  sourceIsSavedClientData: true,
  sourceIsSavedAnalysisData: true,
  sourceIsSavedScreenshotsData: true,
  directSearchResultsAreNotDataSource: true,
  reScrapingDuringReportGenerationAllowed: false,
  reAnalysisDuringReportGenerationAllowed: false,
} as const;

export const OneReportPerClientRules = {
  singleReportPerClient: true,
  regenerateReplacesOldReportCompletely: true,
} as const;

export const NoReportWithoutAnalysisRules = {
  requiresSavedAnalysisBeforeGeneration: true,
} as const;

export const FixedTemplateRules = {
  templateSelectionByUserAllowed: false,
  layoutCustomizationByUserAllowed: false,
  fixedTemplateKey: ReportTemplateKey.DefaultClientReport,
} as const;

export const ViewerRules = {
  uiPreviewOnly: true,
  canSeeRealReportData: false,
  canDownloadRealReportFiles: false,
} as const;

export const OwnershipRules = {
  employeeOwnOnly: true,
  managerAndAdminAllClients: true,
  viewerCanGenerateReports: false,
  viewerCanReadReports: false,
} as const;

export const PdfStorageRules = {
  reportStoredAsPdf: true,
  defaultFormat: ReportFormat.Pdf,
  regenerateReplacesOldPdfFile: true,
} as const;

export const ReportRenderingRules = {
  developerControlledHtmlCssTemplate: true,
  userControlledRenderingSettings: false,
} as const;

