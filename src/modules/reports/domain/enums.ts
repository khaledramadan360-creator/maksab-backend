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

export enum DeliveryStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Failed = 'failed',
}

export enum DeliveryProvider {
  WhatChimp = 'whatchimp',
}

export enum AuditAction {
  ClientReportGenerated = 'client.report.generated',
  ClientReportRegenerated = 'client.report.regenerated',
  ClientReportDeleted = 'client.report.deleted',
  ClientReportDownloaded = 'client.report.downloaded',
  ClientReportDeliveryRequested = 'client.report.delivery.requested',
  ClientReportDeliveryAccepted = 'client.report.delivery.accepted',
  ClientReportDeliveryFailed = 'client.report.delivery.failed',
}
