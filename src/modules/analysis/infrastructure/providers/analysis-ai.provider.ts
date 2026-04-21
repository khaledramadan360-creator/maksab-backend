import { AnalysisSourcePlatform } from '../../domain/enums';
import { AnalysisResultPayload, ScrapedPlatformInput } from '../../domain/entities';
import { AnalysisAiProviderContract, AnalyzeClientDataInput } from '../../domain/repositories';

export interface AnalysisAiSystemPromptSource {
  getAnalysisGeminiSystemPrompt(): Promise<string | null>;
}

interface RemoteAiResponsePayload {
  summary?: unknown;
  overallScore?: unknown;
  strengths?: unknown;
  weaknesses?: unknown;
  recommendations?: unknown;
  platformAnalyses?: unknown;
}

class GeminiRequestError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number | null = null,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'GeminiRequestError';
  }
}

export class AnalysisAiProvider implements AnalysisAiProviderContract {
  private readonly endpointBase: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly temperature: number;
  private readonly outputLanguage: 'ar' | 'en';
  private readonly retryMaxAttempts: number;
  private readonly retryBaseDelayMs: number;
  private readonly retryMaxDelayMs: number;
  private readonly fallbackModels: string[];

  constructor(private readonly systemPromptSource: AnalysisAiSystemPromptSource | null = null) {
    this.endpointBase =
      process.env.ANALYSIS_GEMINI_ENDPOINT ||
      process.env.GEMINI_API_BASE_URL ||
      process.env.ANALYSIS_AI_ENDPOINT ||
      'https://generativelanguage.googleapis.com/v1beta/models';
    this.apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.ANALYSIS_GEMINI_API_KEY ||
      process.env.ANALYSIS_AI_API_KEY ||
      '';
    this.model = this.normalizeModelName(
      process.env.GEMINI_MODEL || process.env.ANALYSIS_AI_MODEL || 'gemini-2.5-flash'
    );
    this.timeoutMs = this.resolvePositiveInt(process.env.ANALYSIS_AI_TIMEOUT_MS, 30000);
    this.temperature = this.resolveNumber(process.env.ANALYSIS_AI_TEMPERATURE, 0.2);
    this.outputLanguage = this.resolveOutputLanguage(process.env.ANALYSIS_OUTPUT_LANGUAGE);
    const retryCount = this.resolveNonNegativeInt(process.env.ANALYSIS_AI_MAX_RETRIES, 2);
    this.retryMaxAttempts = retryCount + 1;
    this.retryBaseDelayMs = this.resolvePositiveInt(process.env.ANALYSIS_AI_RETRY_BASE_DELAY_MS, 1000);
    this.retryMaxDelayMs = this.resolvePositiveInt(process.env.ANALYSIS_AI_RETRY_MAX_DELAY_MS, 8000);
    const defaultFallbackModels = ['gemini-2.0-flash', 'gemini-flash-latest'].filter(
      modelName => modelName !== this.model
    );
    this.fallbackModels = this.resolveModelList(
      process.env.ANALYSIS_AI_FALLBACK_MODELS,
      defaultFallbackModels
    );
  }

  async analyzeClientData(input: AnalyzeClientDataInput): Promise<AnalysisResultPayload> {
    const heuristic = this.buildHeuristicOutput(input);

    if (!this.apiKey) {
      return heuristic;
    }

    try {
      const remote = await this.callGemini(input);
      return this.mergeAndValidate(remote, input.scrapedPlatforms, heuristic);
    } catch (error) {
      console.warn(
        `[AnalysisAiProvider] Gemini unavailable. Falling back to heuristic output. reason="${this.getErrorMessage(
          error
        )}"`
      );
      return heuristic;
    }
  }

  private async callGemini(input: AnalyzeClientDataInput): Promise<RemoteAiResponsePayload> {
    const promptPayload = {
      clientId: input.clientId,
      clientName: input.clientName,
      saudiCity: input.saudiCity,
      platforms: input.scrapedPlatforms.map(item => ({
        platform: item.platform,
        platformUrl: item.platformUrl,
        scrapedText: item.scrapedText.slice(0, 3000),
        scrapedMetadata: item.scrapedMetadata,
      })),
    };
    const customSystemPrompt = await this.resolveCustomSystemPrompt();

    const modelCandidates = this.getModelCandidates();
    let lastError: unknown = null;

    for (const modelCandidate of modelCandidates) {
      for (let attempt = 1; attempt <= this.retryMaxAttempts; attempt++) {
        try {
          return await this.callGeminiOnce(promptPayload, modelCandidate, customSystemPrompt);
        } catch (error) {
          lastError = error;
          const retryable = this.isRetryableGeminiError(error);
          const hasMoreAttempts = attempt < this.retryMaxAttempts;

          if (!retryable || !hasMoreAttempts) {
            break;
          }

          const delayMs = this.computeBackoffDelayMs(attempt);
          await this.delay(delayMs);
        }
      }
    }

    throw lastError ?? new Error('Gemini request failed after exhausting retries');
  }

  private async callGeminiOnce(
    promptPayload: {
      clientId: string;
      clientName: string;
      saudiCity: string | null;
      platforms: Array<{
        platform: AnalysisSourcePlatform;
        platformUrl: string;
        scrapedText: string;
        scrapedMetadata: Record<string, unknown>;
      }>;
    },
    modelCandidate: string,
    customSystemPrompt: string | null
  ): Promise<RemoteAiResponsePayload> {
    const endpoint = `${this.endpointBase.replace(/\/$/, '')}/${encodeURIComponent(
      modelCandidate
    )}:generateContent`;

    let response: Response;
    try {
      response = await this.fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: this.buildPromptText(promptPayload, customSystemPrompt),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: this.temperature,
            responseMimeType: 'application/json',
            responseSchema: this.buildResponseSchema(),
          },
        }),
      });
    } catch (error) {
      if ((error as any)?.name === 'AbortError') {
        throw new GeminiRequestError('Gemini request timed out', null, true);
      }
      throw new GeminiRequestError(this.getErrorMessage(error), null, true);
    }

    const rawBody = await response.text();
    if (!response.ok) {
      const retryable = this.isRetryableStatusCode(response.status);
      throw new GeminiRequestError(
        `Gemini request failed with status ${response.status}. ${rawBody.slice(0, 220)}`,
        response.status,
        retryable
      );
    }

    let data: any = null;
    try {
      data = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      throw new GeminiRequestError('Gemini response is not valid JSON', response.status, true);
    }

    const parts = data?.candidates?.[0]?.content?.parts;
    const content = Array.isArray(parts)
      ? parts
          .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
          .join('\n')
          .trim()
      : '';

    if (!content) {
      throw new GeminiRequestError('Gemini response did not include JSON content', response.status, true);
    }

    const parsed = this.extractJson(content);
    if (!parsed || typeof parsed !== 'object') {
      throw new GeminiRequestError('Gemini response JSON parsing failed', response.status, true);
    }

    return parsed as RemoteAiResponsePayload;
  }

  private buildPromptText(
    promptPayload: {
      clientId: string;
      clientName: string;
      saudiCity: string | null;
      platforms: Array<{
        platform: AnalysisSourcePlatform;
        platformUrl: string;
        scrapedText: string;
        scrapedMetadata: Record<string, unknown>;
      }>;
    },
    customSystemPrompt: string | null
  ): string {
    const instructions = [
      'Analyze the provided client digital presence signals and return only JSON that matches the required schema.',
      'Do not include markdown, explanations, or extra text outside the JSON object.',
      'Base your conclusions only on the provided evidence. Stay concrete, concise, and internally consistent.',
      'If a platform includes scrape failure metadata such as scrapeStatus="failed" or scrapeFailureReason, do not omit that platform. Include it in platformAnalyses and explain the provider outcome in clear user-facing language based on the given failure reason.',
      this.languageInstruction(),
    ];

    if (customSystemPrompt) {
      instructions.push(`Additional system guidance:\n${customSystemPrompt}`);
    }

    return `${instructions.join('\n\n')}\n\nINPUT_JSON:\n${JSON.stringify(promptPayload)}`;
  }

  private async resolveCustomSystemPrompt(): Promise<string | null> {
    const envPrompt =
      this.normalizeOptionalText(process.env.ANALYSIS_GEMINI_SYSTEM_PROMPT) ??
      this.normalizeOptionalText(process.env.ANALYSIS_AI_SYSTEM_PROMPT);

    if (!this.systemPromptSource) {
      return envPrompt;
    }

    try {
      return (
        this.normalizeOptionalText(await this.systemPromptSource.getAnalysisGeminiSystemPrompt()) ??
        envPrompt
      );
    } catch (error) {
      console.warn(
        `[AnalysisAiProvider] Failed to load system prompt from settings. Using fallback prompt. reason="${this.getErrorMessage(
          error
        )}"`
      );
      return envPrompt;
    }
  }

  private languageInstruction(): string {
    if (this.isArabicOutput()) {
      return 'IMPORTANT: All human-readable text fields must be in Arabic (Modern Standard Arabic), including summary, strengths, weaknesses, recommendations, and each platform summary/strengths/weaknesses/recommendations. Keep platform enum values and URLs unchanged. IMPORTANT: overallScore and each platformScore MUST be numeric values in range 0..100 (not 0..10).';
    }
    return 'IMPORTANT: All human-readable text fields must be in English. IMPORTANT: overallScore and each platformScore MUST be numeric values in range 0..100 (not 0..10).';
  }

  private mergeAndValidate(
    remote: RemoteAiResponsePayload,
    scrapedPlatforms: ScrapedPlatformInput[],
    fallback: AnalysisResultPayload
  ): AnalysisResultPayload {
    const summary = this.toNonEmptyString(remote.summary) ?? fallback.summary;
    const strengths = this.toStringArray(remote.strengths, fallback.strengths);
    const weaknesses = this.toStringArray(remote.weaknesses, fallback.weaknesses);
    const recommendations = this.toStringArray(remote.recommendations, fallback.recommendations);

    const remoteOverallScore = this.toNumber(remote.overallScore);
    let overallScore = this.clampScore(remoteOverallScore ?? fallback.overallScore);
    let remotePlatformAnalyses = this.toPlatformAnalyses(remote.platformAnalyses, scrapedPlatforms);

    if (this.shouldUpscaleTenPointScores(remoteOverallScore, remotePlatformAnalyses, fallback)) {
      overallScore = this.clampScore((remoteOverallScore ?? overallScore) * 10);
      remotePlatformAnalyses = remotePlatformAnalyses.map(item => ({
        ...item,
        platformScore: this.clampScore(item.platformScore * 10),
      }));
    }

    const platformAnalyses =
      remotePlatformAnalyses.length > 0
        ? this.mergePlatformAnalyses(remotePlatformAnalyses, fallback.platformAnalyses)
        : fallback.platformAnalyses;

    return {
      summary,
      overallScore,
      strengths,
      weaknesses,
      recommendations,
      platformAnalyses,
    };
  }

  private shouldUpscaleTenPointScores(
    remoteOverallScore: number | null,
    remotePlatformAnalyses: AnalysisResultPayload['platformAnalyses'],
    fallback: AnalysisResultPayload
  ): boolean {
    const remoteScores: number[] = [];
    if (typeof remoteOverallScore === 'number' && Number.isFinite(remoteOverallScore)) {
      remoteScores.push(remoteOverallScore);
    }
    for (const item of remotePlatformAnalyses) {
      if (Number.isFinite(item.platformScore)) {
        remoteScores.push(item.platformScore);
      }
    }

    if (remoteScores.length === 0) {
      return false;
    }

    const hasPositive = remoteScores.some(score => score > 0);
    if (!hasPositive) {
      return false;
    }

    const maxRemoteScore = Math.max(...remoteScores);
    if (maxRemoteScore > 10) {
      return false;
    }

    const fallbackScores = [
      fallback.overallScore,
      ...fallback.platformAnalyses.map(item => item.platformScore),
    ].filter((score): score is number => Number.isFinite(score));

    if (fallbackScores.length === 0) {
      return false;
    }

    const maxFallbackScore = Math.max(...fallbackScores);
    return maxFallbackScore >= 20;
  }

  private mergePlatformAnalyses(
    primary: AnalysisResultPayload['platformAnalyses'],
    secondary: AnalysisResultPayload['platformAnalyses']
  ): AnalysisResultPayload['platformAnalyses'] {
    const merged: AnalysisResultPayload['platformAnalyses'] = [];
    const seen = new Set<string>();

    const pushUnique = (items: AnalysisResultPayload['platformAnalyses']) => {
      for (const item of items) {
        const key = this.platformAnalysisKey(item.platform, item.platformUrl);
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        merged.push(item);
      }
    };

    pushUnique(primary);
    pushUnique(secondary);

    return merged;
  }

  private platformAnalysisKey(platform: AnalysisSourcePlatform, platformUrl: string): string {
    return `${platform}|${platformUrl.trim().toLowerCase()}`;
  }

  private toPlatformAnalyses(
    value: unknown,
    scrapedPlatforms: ScrapedPlatformInput[]
  ): AnalysisResultPayload['platformAnalyses'] {
    if (!Array.isArray(value)) {
      return [];
    }

    const lookupByUrl = new Map<string, ScrapedPlatformInput>(
      scrapedPlatforms.map(item => [item.platformUrl, item])
    );

    const analyses: AnalysisResultPayload['platformAnalyses'] = [];
    const lookupByPlatform = new Map<AnalysisSourcePlatform, ScrapedPlatformInput>();
    for (const item of scrapedPlatforms) {
      if (!lookupByPlatform.has(item.platform)) {
        lookupByPlatform.set(item.platform, item);
      }
    }

    for (const item of value) {
      if (!item || typeof item !== 'object') {
        continue;
      }

      const raw = item as Record<string, unknown>;
      const platform = this.toPlatform(raw.platform);
      if (!platform) {
        continue;
      }

      const platformUrlFromPayload = this.toNonEmptyString(raw.platformUrl);
      const matchedByUrl = platformUrlFromPayload ? lookupByUrl.get(platformUrlFromPayload) : null;
      const matchedByPlatform = lookupByPlatform.get(platform);
      const platformUrl = platformUrlFromPayload || matchedByUrl?.platformUrl || matchedByPlatform?.platformUrl;
      if (!platformUrl) {
        continue;
      }

      const platformScore = this.clampScore(this.toNumber(raw.platformScore) ?? 50);
      const summary =
        this.toNonEmptyString(raw.summary) ?? this.msg('platformSummaryNotAvailable');

      analyses.push({
        platform,
        platformUrl,
        platformScore,
        summary,
        strengths: this.toStringArray(raw.strengths, [this.msg('defaultPlatformStrength')]),
        weaknesses: this.toStringArray(raw.weaknesses, [this.msg('defaultPlatformWeakness')]),
        recommendations: this.toStringArray(raw.recommendations, [this.msg('defaultPlatformRecommendation')]),
      });
    }

    return analyses;
  }

  private buildHeuristicOutput(input: AnalyzeClientDataInput): AnalysisResultPayload {
    const platformAnalyses = input.scrapedPlatforms.map(platform => {
      const scrapeFailureReason = this.getScrapeFailureReason(platform.scrapedMetadata);
      if (scrapeFailureReason) {
        return {
          platform: platform.platform,
          platformUrl: platform.platformUrl,
          platformScore: 0,
          summary: this.isArabicOutput()
            ? `تعذر جمع بيانات منصة ${this.platformLabel(
                platform.platform
              )} عبر مزود الـ scraping. السبب: ${scrapeFailureReason}.`
            : `Failed to scrape ${platform.platform} via provider. reason: ${scrapeFailureReason}.`,
          strengths: this.isArabicOutput()
            ? ['تم اكتشاف رابط المنصة ضمن بيانات العميل المحفوظة.']
            : ['Platform URL exists in the saved client profile.'],
          weaknesses: this.isArabicOutput()
            ? [`تعذر الوصول إلى محتوى المنصة للتحليل. السبب: ${scrapeFailureReason}.`]
            : [`Platform content could not be fetched. reason: ${scrapeFailureReason}.`],
          recommendations: this.isArabicOutput()
            ? [
                'راجع إعدادات Bright Data (zone/policy) أو حالة KYC ثم أعد التحليل.',
                'تأكد من أن الرابط عام وصالح وقابل للوصول بدون قيود إضافية.',
              ]
            : [
                'Review Bright Data zone/policy or KYC status, then rerun analysis.',
                'Ensure the URL is public, valid, and accessible.',
              ],
        };
      }

      const baseScore = this.heuristicPlatformScore(platform.scrapedText);
      const pageSpeedAggregate = this.extractPageSpeedAggregate(platform.scrapedMetadata);
      const score =
        platform.platform === AnalysisSourcePlatform.Website && pageSpeedAggregate
          ? this.deriveWebsiteScore(baseScore, pageSpeedAggregate)
          : baseScore;

      const preview = platform.scrapedText.slice(0, 220);
      const pageSpeedHint =
        platform.platform === AnalysisSourcePlatform.Website && pageSpeedAggregate
          ? this.isArabicOutput()
            ? ` مؤشرات PageSpeed: الأداء ${this.displayScore(
                pageSpeedAggregate.performance
              )}، إمكانية الوصول ${this.displayScore(
                pageSpeedAggregate.accessibility
              )}، أفضل الممارسات ${this.displayScore(
                pageSpeedAggregate.bestPractices
              )}، وSEO ${this.displayScore(pageSpeedAggregate.seo)}.`
            : ` PageSpeed aggregate -> performance ${this.displayScore(
                pageSpeedAggregate.performance
              )}, accessibility ${this.displayScore(
                pageSpeedAggregate.accessibility
              )}, best practices ${this.displayScore(pageSpeedAggregate.bestPractices)}, seo ${this.displayScore(
                pageSpeedAggregate.seo
              )}.`
          : '';

      return {
        platform: platform.platform,
        platformUrl: platform.platformUrl,
        platformScore: score,
        summary: this.isArabicOutput()
          ? `ملخص سريع للمنصة ${this.platformLabel(platform.platform)}: ${preview}${
              platform.scrapedText.length > 220 ? '...' : ''
            }.${pageSpeedHint}`
          : `Quick heuristic summary for ${platform.platform}: ${preview}${
              platform.scrapedText.length > 220 ? '...' : ''
            }.${pageSpeedHint}`,
        strengths: [this.msg('heuristicPlatformStrength')],
        weaknesses: [this.msg('heuristicPlatformWeakness')],
        recommendations: [this.msg('heuristicPlatformRecommendation')],
      };
    });

    const overallScore =
      platformAnalyses.length > 0
        ? this.clampScore(
            platformAnalyses.reduce((sum, item) => sum + item.platformScore, 0) / platformAnalyses.length
          )
        : 0;

    return {
      summary: this.isArabicOutput()
        ? `تم إنشاء التحليل للعميل ${input.clientName} بناءً على ${input.scrapedPlatforms.length} منصة محفوظة.`
        : `Analysis generated for ${input.clientName} based on ${input.scrapedPlatforms.length} saved platform(s).`,
      overallScore,
      strengths: [this.msg('heuristicGlobalStrength')],
      weaknesses: [this.msg('heuristicGlobalWeakness')],
      recommendations: this.isArabicOutput()
        ? ['توحيد رسالة العلامة التجارية عبر جميع المنصات.', 'إضافة إشارات تواصل وتحويل أكثر وضوحًا.']
        : ['Unify brand messaging across all platforms.', 'Add clearer contact and conversion signals.'],
      platformAnalyses,
    };
  }

  private heuristicPlatformScore(scrapedText: string): number {
    const lengthFactor = Math.min(35, Math.floor(scrapedText.length / 120));
    const hasContactSignal =
      /(contact|phone|whatsapp|email|call|اتصل|واتساب|هاتف)/i.test(scrapedText) ? 15 : 0;
    const hasServiceSignal =
      /(service|services|offer|clinic|company|agency|real estate|خدمة|خدمات|شركة|عيادة|عقارات)/i.test(
        scrapedText
      )
        ? 20
        : 0;
    return this.clampScore(30 + lengthFactor + hasContactSignal + hasServiceSignal);
  }

  private deriveWebsiteScore(
    contentScore: number,
    aggregate: {
      performance: number | null;
      accessibility: number | null;
      bestPractices: number | null;
      seo: number | null;
    }
  ): number {
    const weightedPageSpeed = this.computeWeightedPageSpeed(aggregate);
    if (weightedPageSpeed === null) {
      return contentScore;
    }

    // Website final score uses real measurement + content quality signals.
    return this.clampScore(weightedPageSpeed * 0.65 + contentScore * 0.35);
  }

  private computeWeightedPageSpeed(aggregate: {
    performance: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    seo: number | null;
  }): number | null {
    const components: Array<{ value: number | null; weight: number }> = [
      { value: aggregate.performance, weight: 0.4 },
      { value: aggregate.accessibility, weight: 0.2 },
      { value: aggregate.bestPractices, weight: 0.2 },
      { value: aggregate.seo, weight: 0.2 },
    ];

    let weightSum = 0;
    let weightedSum = 0;
    for (const item of components) {
      if (typeof item.value === 'number' && Number.isFinite(item.value)) {
        weightedSum += item.value * item.weight;
        weightSum += item.weight;
      }
    }

    if (weightSum === 0) {
      return null;
    }
    return weightedSum / weightSum;
  }

  private extractPageSpeedAggregate(metadata: Record<string, unknown>): {
    performance: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    seo: number | null;
  } | null {
    const pageSpeed = this.toRecord(metadata.pageSpeed);
    if (!pageSpeed) {
      return null;
    }

    const aggregate = this.toRecord(pageSpeed.aggregate);
    if (!aggregate) {
      return null;
    }

    return {
      performance: this.toNumber(aggregate.performance),
      accessibility: this.toNumber(aggregate.accessibility),
      bestPractices: this.toNumber(aggregate.bestPractices),
      seo: this.toNumber(aggregate.seo),
    };
  }

  private toNonEmptyString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private normalizeOptionalText(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private toRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private toStringArray(value: unknown, fallback: string[]): string[] {
    if (!Array.isArray(value)) {
      return fallback;
    }

    const normalized = value
      .filter(item => typeof item === 'string')
      .map(item => (item as string).trim())
      .filter(item => item.length > 0);

    return normalized.length > 0 ? normalized : fallback;
  }

  private clampScore(score: number): number {
    if (!Number.isFinite(score)) {
      return 0;
    }
    return Math.max(0, Math.min(100, Number(score.toFixed(2))));
  }

  private displayScore(score: number | null): string {
    if (score === null || !Number.isFinite(score)) {
      return this.isArabicOutput() ? 'غير متاح' : 'n/a';
    }
    return `${Number(score.toFixed(2))}/100`;
  }

  private getScrapeFailureReason(metadata: Record<string, unknown>): string | null {
    const status = this.toNonEmptyString(metadata.scrapeStatus);
    if (!status || status.toLowerCase() !== 'failed') {
      return null;
    }

    return this.toNonEmptyString(metadata.scrapeFailureReason) || 'unknown_scraping_failure';
  }

  private platformLabel(platform: AnalysisSourcePlatform): string {
    if (!this.isArabicOutput()) {
      return platform;
    }

    switch (platform) {
      case AnalysisSourcePlatform.Website:
        return 'الموقع الإلكتروني';
      case AnalysisSourcePlatform.Facebook:
        return 'فيسبوك';
      case AnalysisSourcePlatform.Instagram:
        return 'إنستغرام';
      case AnalysisSourcePlatform.Snapchat:
        return 'سناب شات';
      case AnalysisSourcePlatform.Linkedin:
        return 'لينكدإن';
      case AnalysisSourcePlatform.X:
        return 'إكس';
      case AnalysisSourcePlatform.Tiktok:
        return 'تيك توك';
      default:
        return platform;
    }
  }

  private msg(
    key:
      | 'platformSummaryNotAvailable'
      | 'defaultPlatformStrength'
      | 'defaultPlatformWeakness'
      | 'defaultPlatformRecommendation'
      | 'heuristicPlatformStrength'
      | 'heuristicPlatformWeakness'
      | 'heuristicPlatformRecommendation'
      | 'heuristicGlobalStrength'
      | 'heuristicGlobalWeakness'
  ): string {
    if (!this.isArabicOutput()) {
      switch (key) {
        case 'platformSummaryNotAvailable':
          return 'Platform analysis summary is not available yet.';
        case 'defaultPlatformStrength':
          return 'Consistent platform presence.';
        case 'defaultPlatformWeakness':
          return 'Limited measurable signals in scraped data.';
        case 'defaultPlatformRecommendation':
          return 'Improve profile clarity and service messaging.';
        case 'heuristicPlatformStrength':
          return 'Visible business content detected on the profile/page.';
        case 'heuristicPlatformWeakness':
          return 'Content structure may not clearly communicate value proposition.';
        case 'heuristicPlatformRecommendation':
          return 'Improve profile bio/about section with clear services and CTA.';
        case 'heuristicGlobalStrength':
          return 'Client has at least one accessible digital presence.';
        case 'heuristicGlobalWeakness':
          return 'Automated heuristic analysis has limited depth without provider completion.';
        default:
          return '';
      }
    }

    switch (key) {
      case 'platformSummaryNotAvailable':
        return 'ملخص تحليل المنصة غير متاح حاليًا.';
      case 'defaultPlatformStrength':
        return 'وجود رقمي واضح على المنصة.';
      case 'defaultPlatformWeakness':
        return 'الإشارات القابلة للقياس محدودة في البيانات المسحوبة.';
      case 'defaultPlatformRecommendation':
        return 'تحسين وضوح البروفايل والخدمات ورسالة التواصل.';
      case 'heuristicPlatformStrength':
        return 'تم رصد محتوى تجاري واضح في الصفحة أو الحساب.';
      case 'heuristicPlatformWeakness':
        return 'هيكل المحتوى لا يوضح عرض القيمة بشكل كافٍ.';
      case 'heuristicPlatformRecommendation':
        return 'تحسين نبذة الحساب/الصفحة مع خدمات واضحة ودعوة واضحة لاتخاذ إجراء.';
      case 'heuristicGlobalStrength':
        return 'العميل لديه حضور رقمي واحد على الأقل يمكن الوصول إليه.';
      case 'heuristicGlobalWeakness':
        return 'التحليل التقديري الآلي أقل عمقًا عند غياب استجابة المزود الكامل.';
      default:
        return '';
    }
  }

  private toPlatform(value: unknown): AnalysisSourcePlatform | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim().toLowerCase();
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

  private extractJson(content: string): Record<string, unknown> | null {
    const trimmed = content.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return null;
      }
    }

    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fencedMatch?.[1]) {
      try {
        return JSON.parse(fencedMatch[1]);
      } catch {
        return null;
      }
    }

    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const maybeJson = trimmed.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(maybeJson);
      } catch {
        return null;
      }
    }

    return null;
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private resolvePositiveInt(rawValue: string | undefined, fallback: number): number {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }
    return Math.floor(parsed);
  }

  private resolveNonNegativeInt(rawValue: string | undefined, fallback: number): number {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return fallback;
    }
    return Math.floor(parsed);
  }

  private resolveNumber(rawValue: string | undefined, fallback: number): number {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return parsed;
  }

  private resolveOutputLanguage(rawValue: string | undefined): 'ar' | 'en' {
    const normalized = (rawValue || '').trim().toLowerCase();
    return normalized === 'en' ? 'en' : 'ar';
  }

  private isArabicOutput(): boolean {
    return this.outputLanguage === 'ar';
  }

  private resolveModelList(rawValue: string | undefined, fallback: string[]): string[] {
    const rawList =
      typeof rawValue === 'string' && rawValue.trim() !== ''
        ? rawValue.split(',').map(item => this.normalizeModelName(item)).filter(Boolean)
        : fallback;

    const unique: string[] = [];
    for (const item of rawList) {
      if (!unique.includes(item)) {
        unique.push(item);
      }
    }

    return unique;
  }

  private normalizeModelName(rawValue: string): string {
    return String(rawValue || '')
      .trim()
      .replace(/^models\//i, '');
  }

  private getModelCandidates(): string[] {
    const unique: string[] = [];
    const add = (value: string) => {
      const normalized = value.trim();
      if (normalized && !unique.includes(normalized)) {
        unique.push(normalized);
      }
    };

    add(this.model);
    for (const fallbackModel of this.fallbackModels) {
      add(fallbackModel);
    }

    return unique;
  }

  private isRetryableGeminiError(error: unknown): boolean {
    if (error instanceof GeminiRequestError) {
      return error.retryable;
    }
    const name = (error as any)?.name;
    if (name === 'AbortError') {
      return true;
    }
    return true;
  }

  private isRetryableStatusCode(statusCode: number): boolean {
    return [408, 429, 500, 502, 503, 504].includes(statusCode);
  }

  private computeBackoffDelayMs(attempt: number): number {
    const base = this.retryBaseDelayMs;
    const exp = base * Math.pow(2, Math.max(0, attempt - 1));
    const jitter = Math.floor(Math.random() * 250);
    return Math.min(this.retryMaxDelayMs, exp + jitter);
  }

  private async delay(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    if (typeof error === 'string' && error.trim()) {
      return error;
    }
    return 'Unknown error';
  }

  private buildResponseSchema(): Record<string, unknown> {
    const analysisItemSchema: Record<string, unknown> = {
      type: 'OBJECT',
      properties: {
        platform: {
          type: 'STRING',
          enum: [
            AnalysisSourcePlatform.Website,
            AnalysisSourcePlatform.Facebook,
            AnalysisSourcePlatform.Instagram,
            AnalysisSourcePlatform.Snapchat,
            AnalysisSourcePlatform.Linkedin,
            AnalysisSourcePlatform.X,
            AnalysisSourcePlatform.Tiktok,
          ],
        },
        platformUrl: { type: 'STRING' },
        platformScore: { type: 'NUMBER' },
        summary: { type: 'STRING' },
        strengths: {
          type: 'ARRAY',
          items: { type: 'STRING' },
        },
        weaknesses: {
          type: 'ARRAY',
          items: { type: 'STRING' },
        },
        recommendations: {
          type: 'ARRAY',
          items: { type: 'STRING' },
        },
      },
      required: [
        'platform',
        'platformUrl',
        'platformScore',
        'summary',
        'strengths',
        'weaknesses',
        'recommendations',
      ],
    };

    return {
      type: 'OBJECT',
      properties: {
        summary: { type: 'STRING' },
        overallScore: { type: 'NUMBER' },
        strengths: {
          type: 'ARRAY',
          items: { type: 'STRING' },
        },
        weaknesses: {
          type: 'ARRAY',
          items: { type: 'STRING' },
        },
        recommendations: {
          type: 'ARRAY',
          items: { type: 'STRING' },
        },
        platformAnalyses: {
          type: 'ARRAY',
          items: analysisItemSchema,
        },
      },
      required: [
        'summary',
        'overallScore',
        'strengths',
        'weaknesses',
        'recommendations',
        'platformAnalyses',
      ],
    };
  }
}
