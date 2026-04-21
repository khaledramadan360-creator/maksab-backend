import { AnalysisSourcePlatform, AuditAction, AnalysisStatus } from '../../domain/enums';
import {
  ClientAnalysisCreateRecord,
  ClientPlatformAnalysisCreateRecord,
  ClientsLookupRepository,
  AuditLogRepository,
} from '../../domain/repositories';
import { ClientAnalysisDetails } from '../../domain/entities';
import { RunClientAnalysisCommand } from '../../domain/use-cases';
import { NotFoundError, ValidationError } from '../errors';
import { ClientAnalysisOwnershipService } from '../services/client-analysis-ownership.service';
import { ClientAnalysisOrchestratorService } from '../services/client-analysis-orchestrator.service';
import { ClientAnalysisReplacementService } from '../services/client-analysis-replacement.service';

export class RunClientAnalysisUseCase {
  constructor(
    private readonly clientsLookupRepo: ClientsLookupRepository,
    private readonly ownershipService: ClientAnalysisOwnershipService,
    private readonly orchestratorService: ClientAnalysisOrchestratorService,
    private readonly replacementService: ClientAnalysisReplacementService,
    private readonly auditRepo: AuditLogRepository
  ) {}

  async execute(command: RunClientAnalysisCommand): Promise<ClientAnalysisDetails> {
    this.ownershipService.assertActorIdentity(command.actorUserId, command.actorUserRole);
    this.ownershipService.assertCanRunAnalysis(command.actorUserRole);

    const client = await this.clientsLookupRepo.findClientForAnalysis(command.clientId);
    if (!client) {
      throw new NotFoundError('Client not found');
    }

    this.ownershipService.assertCanAccessClient(
      command.actorUserRole,
      command.actorUserId,
      client.ownerUserId
    );

    const startedAt = new Date().toISOString();
    await this.safeAudit({
      actorUserId: command.actorUserId,
      action: AuditAction.ClientAnalysisStarted,
      entityType: 'client_analysis',
      entityId: command.clientId,
      metadata: {
        clientId: command.clientId,
        actorRole: command.actorUserRole,
        startedAt,
      },
    });

    try {
      const orchestration = await this.orchestratorService.execute(client);

      const analysisPayload = this.validateAndNormalizePayload(orchestration.analysisPayload);

      const analysisRecord: ClientAnalysisCreateRecord = {
        clientId: client.id,
        ownerUserId: client.ownerUserId,
        status: AnalysisStatus.Completed,
        summary: analysisPayload.summary,
        overallScore: analysisPayload.overallScore,
        strengths: analysisPayload.strengths,
        weaknesses: analysisPayload.weaknesses,
        recommendations: analysisPayload.recommendations,
        analyzedAt: new Date(),
      };

      const platformAnalysisRecords: ClientPlatformAnalysisCreateRecord[] = analysisPayload.platformAnalyses.map(item => ({
        platform: item.platform,
        platformUrl: item.platformUrl,
        platformScore: item.platformScore,
        summary: item.summary,
        strengths: item.strengths,
        weaknesses: item.weaknesses,
        recommendations: item.recommendations,
      }));

      if (platformAnalysisRecords.length === 0) {
        throw new ValidationError('Analysis output did not include valid platform analyses');
      }

      const replacement = await this.replacementService.replaceForClient({
        clientId: client.id,
        analysis: analysisRecord,
        platformAnalyses: platformAnalysisRecords,
        screenshots: orchestration.screenshots,
      });

      await this.safeAudit({
        actorUserId: command.actorUserId,
        action: AuditAction.ClientAnalysisCompleted,
        entityType: 'client_analysis',
        entityId: client.id,
        metadata: {
          clientId: client.id,
          actorRole: command.actorUserRole,
          completedAt: new Date().toISOString(),
          overallScore: replacement.details.analysis.overallScore,
          platformsAnalyzed: replacement.details.platformAnalyses.map(item => item.platform),
        },
      });

      if (replacement.replaced) {
        await this.safeAudit({
          actorUserId: command.actorUserId,
          action: AuditAction.ClientAnalysisReplaced,
          entityType: 'client_analysis',
          entityId: client.id,
          metadata: {
            clientId: client.id,
            actorRole: command.actorUserRole,
            replacedAt: new Date().toISOString(),
          },
        });
      }

      const capturedScreenshots = replacement.details.screenshots.filter(
        item => item.captureStatus === 'captured'
      );
      const failedScreenshots = replacement.details.screenshots.filter(
        item => item.captureStatus === 'failed'
      );

      if (capturedScreenshots.length > 0) {
        await this.safeAudit({
          actorUserId: command.actorUserId,
          action: AuditAction.ClientAnalysisScreenshotCaptured,
          entityType: 'client_analysis',
          entityId: client.id,
          metadata: {
            clientId: client.id,
            actorRole: command.actorUserRole,
            count: capturedScreenshots.length,
            platforms: capturedScreenshots.map(item => item.platform),
          },
        });
      }

      if (failedScreenshots.length > 0) {
        await this.safeAudit({
          actorUserId: command.actorUserId,
          action: AuditAction.ClientAnalysisScreenshotFailed,
          entityType: 'client_analysis',
          entityId: client.id,
          metadata: {
            clientId: client.id,
            actorRole: command.actorUserRole,
            count: failedScreenshots.length,
            platforms: failedScreenshots.map(item => item.platform),
          },
        });
      }

      return replacement.details;
    } catch (error: any) {
      await this.safeAudit({
        actorUserId: command.actorUserId,
        action: AuditAction.ClientAnalysisFailed,
        entityType: 'client_analysis',
        entityId: command.clientId,
        metadata: {
          clientId: command.clientId,
          actorRole: command.actorUserRole,
          failedAt: new Date().toISOString(),
          reason: error?.message || 'Unknown error',
        },
      });

      throw error;
    }
  }

  private validateAndNormalizePayload(payload: {
    summary: string;
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    platformAnalyses: Array<{
      platform: AnalysisSourcePlatform;
      platformUrl: string;
      platformScore: number;
      summary: string;
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
    }>;
  }) {
    const summary = typeof payload.summary === 'string' ? payload.summary.trim() : '';
    if (!summary) {
      throw new ValidationError('Analysis output is missing summary');
    }

    const overallScore = this.clampScore(payload.overallScore);
    if (!Number.isFinite(overallScore)) {
      throw new ValidationError('Analysis output overallScore is invalid');
    }

    const strengths = this.normalizeStringArray(payload.strengths);
    const weaknesses = this.normalizeStringArray(payload.weaknesses);
    const recommendations = this.normalizeStringArray(payload.recommendations);

    const platformAnalyses = (Array.isArray(payload.platformAnalyses) ? payload.platformAnalyses : [])
      .map(item => ({
        platform: this.toPlatform(item.platform),
        platformUrl: String(item.platformUrl || '').trim(),
        platformScore: this.clampScore(item.platformScore),
        summary: String(item.summary || '').trim(),
        strengths: this.normalizeStringArray(item.strengths),
        weaknesses: this.normalizeStringArray(item.weaknesses),
        recommendations: this.normalizeStringArray(item.recommendations),
      }))
      .filter(item => !!item.platform && item.platformUrl && item.summary) as Array<{
      platform: AnalysisSourcePlatform;
      platformUrl: string;
      platformScore: number;
      summary: string;
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
    }>;

    return {
      summary,
      overallScore,
      strengths,
      weaknesses,
      recommendations,
      platformAnalyses,
    };
  }

  private normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter(item => typeof item === 'string')
      .map(item => (item as string).trim())
      .filter(item => item.length > 0)
      .slice(0, 20);
  }

  private toPlatform(value: unknown): AnalysisSourcePlatform | null {
    const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
    switch (normalized) {
      case AnalysisSourcePlatform.Website:
        return AnalysisSourcePlatform.Website;
      case AnalysisSourcePlatform.Facebook:
        return AnalysisSourcePlatform.Facebook;
      case AnalysisSourcePlatform.Instagram:
        return AnalysisSourcePlatform.Instagram;
      case AnalysisSourcePlatform.Snapchat:
        return AnalysisSourcePlatform.Snapchat;
      case AnalysisSourcePlatform.Linkedin:
        return AnalysisSourcePlatform.Linkedin;
      case AnalysisSourcePlatform.X:
        return AnalysisSourcePlatform.X;
      case AnalysisSourcePlatform.Tiktok:
        return AnalysisSourcePlatform.Tiktok;
      default:
        return null;
    }
  }

  private clampScore(value: unknown): number {
    const score = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(score)) {
      throw new ValidationError('Analysis score is invalid');
    }
    return Math.max(0, Math.min(100, Number(score.toFixed(2))));
  }

  private async safeAudit(entry: Parameters<AuditLogRepository['createAuditLog']>[0]): Promise<void> {
    try {
      await this.auditRepo.createAuditLog(entry);
    } catch {
      // Intentionally ignore audit persistence failures to avoid breaking main flow.
    }
  }
}
