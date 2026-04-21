export enum AnalysisStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
}

export enum AnalysisSourcePlatform {
  Website = 'website',
  Facebook = 'facebook',
  Instagram = 'instagram',
  Snapchat = 'snapchat',
  Linkedin = 'linkedin',
  X = 'x',
  Tiktok = 'tiktok',
}

export enum AnalysisMetricType {
  OverallScore = 'overall_score',
  PlatformScore = 'platform_score',
}

export enum AnalysisScreenshotStatus {
  Pending = 'pending',
  Captured = 'captured',
  Failed = 'failed',
}

export enum AuditAction {
  ClientAnalysisStarted = 'client.analysis.started',
  ClientAnalysisCompleted = 'client.analysis.completed',
  ClientAnalysisReplaced = 'client.analysis.replaced',
  ClientAnalysisFailed = 'client.analysis.failed',
  ClientAnalysisDeleted = 'client.analysis.deleted',
  ClientAnalysisScreenshotCaptured = 'client.analysis.screenshot.captured',
  ClientAnalysisScreenshotFailed = 'client.analysis.screenshot.failed',
  ClientAnalysisScreenshotDeleted = 'client.analysis.screenshot.deleted',
}
