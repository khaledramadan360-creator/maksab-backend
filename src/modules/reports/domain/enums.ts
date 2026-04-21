export enum ReportStatus {
  Generating = 'generating',
  Ready = 'ready',
  Failed = 'failed',
}

export enum ReportFormat {
  Pdf = 'pdf',
}

export enum ReportTemplateKey {
  DefaultClientReport = 'default_client_report',
}

export enum AuditAction {
  ClientReportGenerated = 'client.report.generated',
  ClientReportRegenerated = 'client.report.regenerated',
  ClientReportDeleted = 'client.report.deleted',
  ClientReportDownloaded = 'client.report.downloaded',
}

