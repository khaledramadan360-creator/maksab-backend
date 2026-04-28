import { existsSync, readFileSync } from 'node:fs';
import { RenderHtmlInput, ReportRendererContract } from '../../domain/repositories';

export class ReportRendererProvider implements ReportRendererContract {
  private readonly embeddedFontFaceCss: string;
  private readonly screenshotMaxBytes: number;
  private readonly screenshotFetchTimeoutMs: number;
  private readonly genericInsightPhrases = new Set([
    'platform analysis summary is not available yet.',
    'consistent platform presence.',
    'limited measurable signals in scraped data.',
    'improve profile clarity and service messaging.',
    'visible business content detected on the profile/page.',
    'content structure may not clearly communicate value proposition.',
    'improve profile bio/about section with clear services and cta.',
    'there are not enough details available for this platform right now.',
    'ملخص تحليل المنصة غير متاح حاليا.',
    'ملخص تحليل المنصة غير متاح حالياً.',
    'وجود رقمي واضح على المنصة.',
    'الإشارات القابلة للقياس محدودة في البيانات المسحوبة.',
    'تحسين وضوح البروفايل والخدمات ورسالة التواصل.',
    'تم رصد محتوى تجاري واضح في الصفحة أو الحساب.',
    'هيكل المحتوى لا يوضح عرض القيمة بشكل كاف.',
    'تحسين نبذة الحساب/الصفحة مع خدمات واضحة ودعوة واضحة لاتخاذ إجراء.',
    'لا توجد تفاصيل كافية متاحة حاليا لهذه المنصة.',
    'لا توجد تفاصيل كافية متاحة حالياً لهذه المنصة.',
  ]);

  constructor() {
    this.embeddedFontFaceCss = this.buildEmbeddedFontFaceCss();
    this.screenshotMaxBytes = this.resolvePositiveInt(process.env.REPORTS_PDF_SCREENSHOT_MAX_BYTES, 4_000_000);
    this.screenshotFetchTimeoutMs = this.resolveNonNegativeInt(
      process.env.REPORTS_PDF_SCREENSHOT_FETCH_TIMEOUT_MS,
      12000
    );
  }

  async renderHtml(input: RenderHtmlInput): Promise<string> {
    const payload = input.payload;
    const template = input.template;
    const htmlTemplate = template.htmlTemplate;
    const needsScreenshotCards = htmlTemplate.includes('{{screenshot_cards}}');
    const needsWebsitePage = htmlTemplate.includes('{{website_screenshot_img}}');
    const needsSocialPage = htmlTemplate.includes('{{facebook_screenshot_img}}');
    const needsSocialPage2 = htmlTemplate.includes('{{x_screenshot_img}}');
    const needsTiktokPage = htmlTemplate.includes('{{tiktok_screenshot_img}}');
    const needsLinkedinPage = htmlTemplate.includes('{{linkedin_screenshot_img}}');
    const generatedAt = new Date().toISOString();
    const textDirection = this.resolveTextDirection(payload);
    const reportDirection = textDirection === 'rtl' ? 'rtl' : 'ltr';
    const reportLanguage = textDirection === 'rtl' ? 'ar' : 'en';
    const coverDate = payload.analysis.analyzedAt
      ? new Date(payload.analysis.analyzedAt)
      : new Date(generatedAt);

    // ─── Website platform data ───────────────────────────────────────────────
    const websitePlatform = payload.analysis.platformAnalyses.find(
      p => p.platform === 'website'
    ) ?? null;
    const websiteScreenshot = payload.screenshots.find(
      s => s.platform === 'website' && s.captureStatus === 'captured'
    ) ?? null;

    const websiteScreenshotPromise = needsWebsitePage
      ? this.resolveScreenshotAsImgTag(
          websiteScreenshot?.publicUrl ?? null,
          'لقطة شاشة الموقع'
        )
      : Promise.resolve('');

    // ─── Facebook platform data ──────────────────────────────────────────────
    const facebookPlatform = payload.analysis.platformAnalyses.find(
      p => p.platform === 'facebook'
    ) ?? null;
    const facebookScreenshot = payload.screenshots.find(
      s => s.platform === 'facebook' && s.captureStatus === 'captured'
    ) ?? null;

    const facebookScreenshotPromise = needsSocialPage
      ? this.resolveScreenshotAsImgTag(
          facebookScreenshot?.publicUrl ?? null,
          'لقطة شاشة فيسبوك'
        )
      : Promise.resolve('');

    // ─── Instagram platform data ─────────────────────────────────────────────
    const instagramPlatform = payload.analysis.platformAnalyses.find(
      p => p.platform === 'instagram'
    ) ?? null;
    const instagramScreenshot = payload.screenshots.find(
      s => s.platform === 'instagram' && s.captureStatus === 'captured'
    ) ?? null;

    const instagramScreenshotPromise = needsSocialPage
      ? this.resolveScreenshotAsImgTag(
          instagramScreenshot?.publicUrl ?? null,
          'لقطة شاشة إنستجرام'
        )
      : Promise.resolve('');

    // ─── X (Twitter) platform data ────────────────────────────────────────────
    const xPlatform = payload.analysis.platformAnalyses.find(
      p => p.platform === 'x' || p.platform === 'twitter'
    ) ?? null;
    const xScreenshot = payload.screenshots.find(
      s => (s.platform === 'x' || s.platform === 'twitter') && s.captureStatus === 'captured'
    ) ?? null;

    const xScreenshotPromise = needsSocialPage2
      ? this.resolveScreenshotAsImgTag(
          xScreenshot?.publicUrl ?? null,
          'لقطة شاشة X'
        )
      : Promise.resolve('');

    // ─── Snapchat platform data ────────────────────────────────────────────
    const snapchatPlatform = payload.analysis.platformAnalyses.find(
      p => p.platform === 'snapchat'
    ) ?? null;
    const snapchatScreenshot = payload.screenshots.find(
      s => s.platform === 'snapchat' && s.captureStatus === 'captured'
    ) ?? null;

    const snapchatScreenshotPromise = needsSocialPage2
      ? this.resolveScreenshotAsImgTag(
          snapchatScreenshot?.publicUrl ?? null,
          'لقطة شاشة سنابشات'
        )
      : Promise.resolve('');

    // ─── TikTok platform data ──────────────────────────────────────────────
    const tiktokPlatform = payload.analysis.platformAnalyses.find(
      p => p.platform === 'tiktok'
    ) ?? null;
    const tiktokScreenshot = payload.screenshots.find(
      s => s.platform === 'tiktok' && s.captureStatus === 'captured'
    ) ?? null;

    const tiktokScreenshotPromise = needsTiktokPage
      ? this.resolveScreenshotAsImgTag(
          tiktokScreenshot?.publicUrl ?? null,
          'لقطة شاشة تيك توك'
        )
      : Promise.resolve('');

    // ─── LinkedIn platform data ────────────────────────────────────────────────
    const linkedinPlatform = payload.analysis.platformAnalyses.find(
      p => p.platform === 'linkedin'
    ) ?? null;
    const linkedinScreenshot = payload.screenshots.find(
      s => s.platform === 'linkedin' && s.captureStatus === 'captured'
    ) ?? null;

    const linkedinScreenshotPromise = needsLinkedinPage
      ? this.resolveScreenshotAsImgTag(
          linkedinScreenshot?.publicUrl ?? null,
          'لقطة شاشة لينكد إين'
        )
      : Promise.resolve('');

    const [
      websiteScreenshotImg,
      facebookScreenshotImg,
      instagramScreenshotImg,
      xScreenshotImg,
      snapchatScreenshotImg,
      tiktokScreenshotImg,
      linkedinScreenshotImg,
    ] = await Promise.all([
      websiteScreenshotPromise,
      facebookScreenshotPromise,
      instagramScreenshotPromise,
      xScreenshotPromise,
      snapchatScreenshotPromise,
      tiktokScreenshotPromise,
      linkedinScreenshotPromise,
    ]);

    // ─── Radar chart SVG ────────────────────────────────────────────────
    const radarChartSvg = needsTiktokPage
      ? this.renderRadarChartSvg([
        { label: 'الموقع', value: websitePlatform?.platformScore ?? null },
        { label: 'فيسبوك', value: facebookPlatform?.platformScore ?? null },
        { label: 'إنستجرام', value: instagramPlatform?.platformScore ?? null },
        { label: 'X', value: xPlatform?.platformScore ?? null },
        { label: 'سناب شات', value: snapchatPlatform?.platformScore ?? null },
        { label: 'تيك توك', value: tiktokPlatform?.platformScore ?? null },
      ])
      : '';
    const introHighlights = this.buildIntroHighlights(payload);

    const replacements: Record<string, string> = {
      generated_at: this.escapeHtml(generatedAt),
      report_generated_date: this.escapeHtml(this.formatCoverDate(coverDate, reportLanguage)),
      intro_priority_level: this.escapeHtml(introHighlights.priorityLevelText),
      client_name: this.escapeHtml(payload.client.name),
      client_city: this.escapeHtml(payload.client.saudiCity || 'N/A'),
      owner_name: this.escapeHtml(payload.client.ownerName || 'Unassigned'),
      intro_digital_engagement_score: this.escapeHtml(introHighlights.digitalEngagementScore),
      intro_website_score: this.escapeHtml(introHighlights.websiteScore),
      intro_data_quality_pct: this.escapeHtml(introHighlights.dataQualityPercent),
      intro_priority_score: this.escapeHtml(introHighlights.priorityScore),
      intro_focus_title: this.escapeHtml(introHighlights.focusTitle),
      intro_focus_description: this.escapeHtml(introHighlights.focusDescription),
      intro_focus_primary_tag: this.escapeHtml(introHighlights.focusPrimaryTag),
      intro_focus_warning_tag: this.escapeHtml(introHighlights.focusWarningTag),
      overall_score: this.escapeHtml(this.formatScore(payload.analysis.overallScore)),
      analysis_summary: this.escapeHtml(payload.analysis.summary || 'No summary available'),
      analysis_summary_cover: this.escapeHtml(
        this.trimForCover(payload.analysis.summary || 'No summary available')
      ),
      analyzed_at: this.escapeHtml(
        payload.analysis.analyzedAt ? payload.analysis.analyzedAt.toISOString() : 'N/A'
      ),
      intro_platform_chips: this.renderIntroPlatformChips(payload),
      strengths_items: this.renderListItems(payload.analysis.strengths),
      weaknesses_items: this.renderListItems(payload.analysis.weaknesses),
      recommendations_items: this.renderListItems(payload.analysis.recommendations),
      platform_rows: this.renderPlatformRows(payload.analysis.platformAnalyses),
      screenshot_cards: needsScreenshotCards
        ? await this.renderScreenshotCards(payload.screenshots)
        : '',
      // ─── website page tokens ──────────────────────────────────────────────
      website_screenshot_img: websiteScreenshotImg,
      website_url: this.escapeHtml(websitePlatform?.platformUrl || ''),
      website_score: this.escapeHtml(this.formatScore(websitePlatform?.platformScore ?? null)),
      website_summary: this.escapeHtml(websitePlatform?.summary || 'لا يوجد ملخص متاح'),
      website_strengths_items: this.renderListItems(websitePlatform?.strengths ?? []),
      website_weaknesses_items: this.renderListItems(websitePlatform?.weaknesses ?? []),
      website_recommendations_items: this.renderListItems(websitePlatform?.recommendations ?? []),
      // ─── facebook page tokens ─────────────────────────────────────────────
      facebook_screenshot_img: facebookScreenshotImg,
      facebook_url: this.escapeHtml(facebookPlatform?.platformUrl || ''),
      facebook_score: this.escapeHtml(this.formatScore(facebookPlatform?.platformScore ?? null)),
      facebook_summary: this.escapeHtml(facebookPlatform?.summary || 'لا يوجد ملخص متاح'),
      facebook_insight_points: this.renderSocialInsightPoints(
        facebookPlatform?.strengths ?? [],
        facebookPlatform?.weaknesses ?? [],
        facebookPlatform?.recommendations ?? [],
        facebookPlatform?.summary ?? null,
        reportLanguage
      ),
      facebook_strengths_items: this.renderListItems(facebookPlatform?.strengths ?? []),
      facebook_weaknesses_items: this.renderListItems(facebookPlatform?.weaknesses ?? []),
      facebook_recommendations_items: this.renderListItems(facebookPlatform?.recommendations ?? []),
      // ─── instagram page tokens ────────────────────────────────────────────
      instagram_screenshot_img: instagramScreenshotImg,
      instagram_url: this.escapeHtml(instagramPlatform?.platformUrl || ''),
      instagram_score: this.escapeHtml(this.formatScore(instagramPlatform?.platformScore ?? null)),
      instagram_summary: this.escapeHtml(instagramPlatform?.summary || 'لا يوجد ملخص متاح'),
      instagram_insight_points: this.renderSocialInsightPoints(
        instagramPlatform?.strengths ?? [],
        instagramPlatform?.weaknesses ?? [],
        instagramPlatform?.recommendations ?? [],
        instagramPlatform?.summary ?? null,
        reportLanguage
      ),
      instagram_strengths_items: this.renderListItems(instagramPlatform?.strengths ?? []),
      instagram_weaknesses_items: this.renderListItems(instagramPlatform?.weaknesses ?? []),
      instagram_recommendations_items: this.renderListItems(instagramPlatform?.recommendations ?? []),
      // ─── x (twitter) page tokens ────────────────────────────────────────────
      x_screenshot_img: xScreenshotImg,
      x_url: this.escapeHtml(xPlatform?.platformUrl || ''),
      x_score: this.escapeHtml(this.formatScore(xPlatform?.platformScore ?? null)),
      x_summary: this.escapeHtml(xPlatform?.summary || 'لا يوجد ملخص متاح'),
      x_insight_points: this.renderSocialInsightPoints(
        xPlatform?.strengths ?? [],
        xPlatform?.weaknesses ?? [],
        xPlatform?.recommendations ?? [],
        xPlatform?.summary ?? null,
        reportLanguage
      ),
      x_strengths_items: this.renderListItems(xPlatform?.strengths ?? []),
      x_weaknesses_items: this.renderListItems(xPlatform?.weaknesses ?? []),
      x_recommendations_items: this.renderListItems(xPlatform?.recommendations ?? []),
      // ─── snapchat page tokens ────────────────────────────────────────────
      snapchat_screenshot_img: snapchatScreenshotImg,
      snapchat_url: this.escapeHtml(snapchatPlatform?.platformUrl || ''),
      snapchat_score: this.escapeHtml(this.formatScore(snapchatPlatform?.platformScore ?? null)),
      snapchat_summary: this.escapeHtml(snapchatPlatform?.summary || 'لا يوجد ملخص متاح'),
      snapchat_insight_points: this.renderSocialInsightPoints(
        snapchatPlatform?.strengths ?? [],
        snapchatPlatform?.weaknesses ?? [],
        snapchatPlatform?.recommendations ?? [],
        snapchatPlatform?.summary ?? null,
        reportLanguage
      ),
      snapchat_strengths_items: this.renderListItems(snapchatPlatform?.strengths ?? []),
      snapchat_weaknesses_items: this.renderListItems(snapchatPlatform?.weaknesses ?? []),
      snapchat_recommendations_items: this.renderListItems(snapchatPlatform?.recommendations ?? []),
      // ─── tiktok page tokens ──────────────────────────────────────────────
      tiktok_screenshot_img: tiktokScreenshotImg,
      tiktok_url: this.escapeHtml(tiktokPlatform?.platformUrl || ''),
      tiktok_score: this.escapeHtml(this.formatScore(tiktokPlatform?.platformScore ?? null)),
      tiktok_summary: this.escapeHtml(tiktokPlatform?.summary || 'لا يوجد ملخص متاح'),
      tiktok_insight_points: this.renderSocialInsightPoints(
        tiktokPlatform?.strengths ?? [],
        tiktokPlatform?.weaknesses ?? [],
        tiktokPlatform?.recommendations ?? [],
        tiktokPlatform?.summary ?? null,
        reportLanguage
      ),
      tiktok_strengths_items: this.renderListItems(tiktokPlatform?.strengths ?? []),
      tiktok_weaknesses_items: this.renderListItems(tiktokPlatform?.weaknesses ?? []),
      tiktok_recommendations_items: this.renderListItems(tiktokPlatform?.recommendations ?? []),
      // ─── linkedin page tokens ────────────────────────────────────────────
      linkedin_screenshot_img: linkedinScreenshotImg,
      linkedin_url: this.escapeHtml(linkedinPlatform?.platformUrl || ''),
      linkedin_score: this.escapeHtml(this.formatScore(linkedinPlatform?.platformScore ?? null)),
      linkedin_summary: this.escapeHtml(linkedinPlatform?.summary || 'لا يوجد ملخص متاح'),
      linkedin_insight_points: this.renderSocialInsightPoints(
        linkedinPlatform?.strengths ?? [],
        linkedinPlatform?.weaknesses ?? [],
        linkedinPlatform?.recommendations ?? [],
        linkedinPlatform?.summary ?? null,
        reportLanguage
      ),
      linkedin_strengths_items: this.renderListItems(linkedinPlatform?.strengths ?? []),
      linkedin_weaknesses_items: this.renderListItems(linkedinPlatform?.weaknesses ?? []),
      linkedin_recommendations_items: this.renderListItems(linkedinPlatform?.recommendations ?? []),
      // ─── radar chart token ──────────────────────────────────────────────
      radar_chart_svg: radarChartSvg,
      // ─── score percentage tokens (0–100 for bar widths) ────────────────────────
      website_score_pct: String(Math.round(websitePlatform?.platformScore ?? 0)),
      facebook_score_pct: String(Math.round(facebookPlatform?.platformScore ?? 0)),
      instagram_score_pct: String(Math.round(instagramPlatform?.platformScore ?? 0)),
      x_score_pct: String(Math.round(xPlatform?.platformScore ?? 0)),
      snapchat_score_pct: String(Math.round(snapchatPlatform?.platformScore ?? 0)),
      tiktok_score_pct: String(Math.round(tiktokPlatform?.platformScore ?? 0)),
      linkedin_score_pct: String(Math.round(linkedinPlatform?.platformScore ?? 0)),
      report_direction: reportDirection,
      report_direction_class: reportDirection,
      ms_season_title: this.escapeHtml(payload.marketingSeason?.title || 'الموسم العادي'),
      ms_season_description: this.escapeHtml(
        payload.marketingSeason?.description || 'استثمر هذا الوقت في تحسين الموقع والمحتوى قبل المواسم القادمة'
      ),
    };


    let bodyHtml = htmlTemplate;
    for (const [key, value] of Object.entries(replacements)) {
      bodyHtml = this.replaceToken(bodyHtml, key, value);
    }

    return [
      '<!doctype html>',
      `<html lang="${reportLanguage}" dir="${reportDirection}">`,
      '<head>',
      '  <meta charset="utf-8" />',
      '  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      `  <title>${this.escapeHtml(template.templateName)}</title>`,
      `  <style>${this.embeddedFontFaceCss}\n${template.cssTemplate}</style>`,
      '</head>',
      '<body>',
      bodyHtml,
      '</body>',
      '</html>',
    ].join('\n');
  }

  private replaceToken(source: string, token: string, value: string): string {
    const marker = `{{${token}}}`;
    return source.split(marker).join(value);
  }

  private buildIntroHighlights(payload: RenderHtmlInput['payload']): {
    digitalEngagementScore: string;
    websiteScore: string;
    dataQualityPercent: string;
    priorityScore: string;
    priorityLevelText: string;
    focusTitle: string;
    focusDescription: string;
    focusPrimaryTag: string;
    focusWarningTag: string;
  } {
    const analyses = payload.analysis.platformAnalyses.map(item => ({
      ...item,
      platform: this.normalizePlatformAlias(item.platform),
      score: this.toScoreOrNull(item.platformScore),
    }));
    const allScores = analyses
      .map(item => item.score)
      .filter((value): value is number => typeof value === 'number');
    const overallScore = this.toScoreOrNull(payload.analysis.overallScore) ?? this.average(allScores);
    const websiteScore = analyses.find(item => item.platform === 'website')?.score ?? null;
    const socialScores = analyses
      .filter(item => this.isSocialPlatform(item.platform) && item.score !== null)
      .map(item => item.score as number);

    const weaknessesCount =
      payload.analysis.weaknesses.length +
      analyses.reduce((total, item) => total + item.weaknesses.length, 0);
    const recommendationsCount =
      payload.analysis.recommendations.length +
      analyses.reduce((total, item) => total + item.recommendations.length, 0);
    const priorityScoreValue = this.computePriorityScore(
      overallScore,
      weaknessesCount,
      recommendationsCount
    );
    const weakestPlatform = analyses
      .filter(item => item.score !== null)
      .sort((a, b) => (a.score as number) - (b.score as number))[0];

    const focusTitle = this.pickFirstNonEmpty([
      weakestPlatform?.recommendations[0] || '',
      payload.analysis.recommendations[0] || '',
      weakestPlatform
        ? `تحسين أداء ${this.getArabicPlatformLabel(weakestPlatform.platform)} ورفع التفاعل`
        : '',
      'تعزيز الظهور الرقمي ودعم قرار الشراء',
    ]);
    const focusDescription = this.pickFirstNonEmpty([
      payload.analysis.summary || '',
      weakestPlatform?.summary || '',
      'نتيجة التحليل تشير إلى فرصة واضحة لتحسين العرض الرقمي ورفع ثقة العميل.',
    ]);
    const focusWarningTag = weakestPlatform && weakestPlatform.score !== null
      ? `أضعف نقطة حالياً: ${this.getArabicPlatformLabel(weakestPlatform.platform)} (${Math.round(
        weakestPlatform.score
      )}%)`
      : 'استمرار الوضع الحالي قد يقلل فرص التحويل والنمو.';
    const focusPrimaryTag = `الأولوية الآن: ${this.trimText(focusTitle, 78)}`;

    return {
      digitalEngagementScore: this.formatScoreOutOfTen(
        this.average(socialScores) ?? overallScore ?? websiteScore
      ),
      websiteScore: this.formatScoreOutOfTen(websiteScore ?? overallScore),
      dataQualityPercent: this.formatScorePercent(overallScore ?? this.average(allScores)),
      priorityScore: String(priorityScoreValue),
      priorityLevelText: this.toPriorityLevelText(priorityScoreValue),
      focusTitle: this.trimText(focusTitle, 92),
      focusDescription: this.trimText(focusDescription, 170),
      focusPrimaryTag,
      focusWarningTag: this.trimText(focusWarningTag, 96),
    };
  }

  private normalizePlatformAlias(value: string): string {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'twitter') {
      return 'x';
    }
    return normalized;
  }

  private isSocialPlatform(platform: string): boolean {
    return ['facebook', 'instagram', 'x', 'snapchat', 'tiktok', 'linkedin'].includes(platform);
  }

  private toScoreOrNull(value: number | null): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return null;
    }

    return Math.max(0, Math.min(100, value));
  }

  private average(values: number[]): number | null {
    if (!Array.isArray(values) || values.length === 0) {
      return null;
    }

    const sum = values.reduce((total, item) => total + item, 0);
    return sum / values.length;
  }

  private formatScoreOutOfTen(scoreOutOfHundred: number | null): string {
    if (typeof scoreOutOfHundred !== 'number' || !Number.isFinite(scoreOutOfHundred)) {
      return '0';
    }

    const scaled = Math.max(0, Math.min(10, scoreOutOfHundred / 10));
    return Number.isInteger(scaled) ? String(scaled) : String(Number(scaled.toFixed(1)));
  }

  private formatScorePercent(scoreOutOfHundred: number | null): string {
    if (typeof scoreOutOfHundred !== 'number' || !Number.isFinite(scoreOutOfHundred)) {
      return '0%';
    }

    return `${Math.round(Math.max(0, Math.min(100, scoreOutOfHundred)))}%`;
  }

  private computePriorityScore(
    overallScore: number | null,
    weaknessesCount: number,
    recommendationsCount: number
  ): number {
    const qualityGap = overallScore === null ? 40 : Math.max(0, 100 - overallScore);
    const weaknessImpact = Math.min(4, Math.max(0, weaknessesCount) * 0.35);
    const recommendationImpact = Math.min(3, Math.max(0, recommendationsCount) * 0.25);
    const raw = qualityGap / 14 + weaknessImpact + recommendationImpact;

    return Math.max(1, Math.min(10, Math.round(raw)));
  }

  private toPriorityLevelText(priorityScore: number): string {
    if (priorityScore >= 7) {
      return 'أولوية عالية';
    }
    if (priorityScore >= 4) {
      return 'أولوية متوسطة';
    }
    return 'أولوية منخفضة';
  }

  private getArabicPlatformLabel(platform: string): string {
    const key = this.normalizePlatformAlias(platform);
    const labels: Record<string, string> = {
      website: 'الموقع',
      facebook: 'فيسبوك',
      instagram: 'إنستقرام',
      x: 'تويتر',
      snapchat: 'سناب شات',
      tiktok: 'تيك توك',
      linkedin: 'لينكدإن',
    };

    return labels[key] || 'القنوات الرقمية';
  }

  private pickFirstNonEmpty(values: string[]): string {
    for (const value of values) {
      const normalized = String(value || '').trim();
      if (normalized) {
        return normalized;
      }
    }

    return '';
  }

  private trimText(value: string, maxLength: number): string {
    const normalized = String(value || '').replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return '';
    }

    if (normalized.length <= maxLength) {
      return normalized;
    }

    return `${normalized.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
  }

  private renderIntroPlatformChips(payload: RenderHtmlInput['payload']): string {
    const platforms: Array<{
      aliases: string[];
      label: string;
      icon: string;
    }> = [
      { aliases: ['website'], label: 'الموقع', icon: '🌐' },
      { aliases: ['facebook'], label: 'فيسبوك', icon: '📘' },
      { aliases: ['instagram'], label: 'إنستقرام', icon: '📸' },
      { aliases: ['tiktok'], label: 'تيك توك', icon: '🎵' },
      { aliases: ['snapchat'], label: 'سناب شات', icon: '👻' },
      { aliases: ['x', 'twitter'], label: 'تويتر', icon: '🐦' },
      { aliases: ['linkedin'], label: 'لينكدإن', icon: '💼' },
    ];

    const hasPlatform = (aliases: string[]): boolean => {
      const byAnalysis = payload.analysis.platformAnalyses.some(item => {
        const platform = String(item.platform || '').trim().toLowerCase();
        if (!aliases.includes(platform)) {
          return false;
        }

        const hasScore = typeof item.platformScore === 'number' && Number.isFinite(item.platformScore);
        const hasText =
          this.hasAnyNonEmptyValue([item.platformUrl, item.summary]) ||
          item.strengths.length > 0 ||
          item.weaknesses.length > 0 ||
          item.recommendations.length > 0;
        return hasScore || hasText;
      });

      if (byAnalysis) {
        return true;
      }

      return payload.screenshots.some(item => {
        const platform = String(item.platform || '').trim().toLowerCase();
        if (!aliases.includes(platform)) {
          return false;
        }

        return (
          this.hasAnyNonEmptyValue([item.platformUrl, item.publicUrl]) ||
          item.captureStatus === 'captured'
        );
      });
    };

    return platforms
      .map(platform => {
        const exists = hasPlatform(platform.aliases);
        const chipClass = exists ? 'ok' : 'bad';
        const marker = exists ? '✓' : '✕';
        return `<span class="intro-v3-platform-chip ${chipClass}">${marker} ${platform.label} ${platform.icon}</span>`;
      })
      .join('\n        ');
  }

  private hasAnyNonEmptyValue(values: Array<string | null | undefined>): boolean {
    return values.some(value => String(value || '').trim() !== '');
  }

  private renderListItems(values: string[]): string {
    const items = Array.isArray(values)
      ? values
        .map(item => item.trim())
        .filter(item => item !== '')
      : [];

    if (items.length === 0) {
      return '<li class="muted">No data</li>';
    }

    return items.map(item => `<li>${this.escapeHtml(item)}</li>`).join('');
  }

  private renderPlatformRows(
    values: Array<{
      platform: string;
      platformUrl: string;
      platformScore: number | null;
      summary: string | null;
    }>
  ): string {
    if (!Array.isArray(values) || values.length === 0) {
      return '<tr><td colspan="4" class="muted">No platform analysis available</td></tr>';
    }

    return values
      .map(item => {
        const platform = this.escapeHtml(item.platform);
        const score = this.escapeHtml(this.formatScore(item.platformScore));
        const summary = this.escapeHtml(item.summary || 'N/A');
        const url = this.escapeHtml(item.platformUrl || '');
        const urlCell = url
          ? `<a class="ltr" href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
          : '<span class="muted">N/A</span>';

        return [
          '<tr>',
          `  <td>${platform}</td>`,
          `  <td>${score}</td>`,
          `  <td>${summary}</td>`,
          `  <td>${urlCell}</td>`,
          '</tr>',
        ].join('\n');
      })
      .join('\n');
  }

  private renderSocialInsightPoints(
    strengths: string[],
    weaknesses: string[],
    recommendations: string[],
    summary: string | null,
    reportLanguage: 'ar' | 'en'
  ): string {
    const summaryInsights = this.extractSummaryInsightParts(summary);
    const usedValues = new Set<string>();

    const strengthText = this.pickInsightText(
      strengths,
      summaryInsights,
      usedValues,
      reportLanguage
    );
    const weaknessText = this.pickInsightText(
      weaknesses,
      summaryInsights,
      usedValues,
      reportLanguage
    );
    const recommendationText = this.pickInsightText(
      recommendations,
      summaryInsights,
      usedValues,
      reportLanguage
    );

    const labels =
      reportLanguage === 'ar'
        ? {
            strengths: 'الميزة:',
            weaknesses: 'العيب:',
            recommendations: 'التحسين:',
          }
        : {
            strengths: 'Strength:',
            weaknesses: 'Weakness:',
            recommendations: 'Improvement:',
          };

    const items = [
      { key: 'strengths', label: labels.strengths, value: strengthText },
      { key: 'weaknesses', label: labels.weaknesses, value: weaknessText },
      { key: 'recommendations', label: labels.recommendations, value: recommendationText },
    ];

    return [
      '<ul class="soc-point-list">',
      ...items.map(
        item =>
          `  <li class="soc-point-item ${item.key}"><span class="soc-point-label">${this.escapeHtml(item.label)}</span>${this.escapeHtml(item.value)}</li>`
      ),
      '</ul>',
    ].join('\n');
  }

  private firstNonEmptyListItem(values: string[]): string | null {
    if (!Array.isArray(values)) {
      return null;
    }

    for (const value of values) {
      const normalized = this.normalizeInsightText(value);
      if (normalized) {
        return normalized;
      }
    }

    return null;
  }

  private pickInsightText(
    values: string[],
    summaryInsights: string[],
    usedValues: Set<string>,
    reportLanguage: 'ar' | 'en'
  ): string {
    const directText = this.firstMeaningfulListItem(values, usedValues);
    if (directText) {
      usedValues.add(directText);
      return directText;
    }

    for (const part of summaryInsights) {
      if (!usedValues.has(part)) {
        usedValues.add(part);
        return part;
      }
    }

    return reportLanguage === 'ar'
      ? 'غير مذكور صراحة في التحليل الحالي.'
      : 'Not explicitly mentioned in the current analysis.';
  }

  private firstMeaningfulListItem(values: string[], usedValues: Set<string>): string | null {
    if (!Array.isArray(values)) {
      return null;
    }

    for (const value of values) {
      const normalized = this.normalizeInsightText(value);
      if (!normalized || usedValues.has(normalized) || this.isGenericInsightText(normalized)) {
        continue;
      }

      return normalized;
    }

    return null;
  }

  private extractSummaryInsightParts(summary: string | null): string[] {
    const normalizedSummary = this.normalizeInsightText(summary);
    if (!normalizedSummary || this.isGenericInsightText(normalizedSummary)) {
      return [];
    }

    return normalizedSummary
      .split(/[\n\r]+|[.!؟؛]+/)
      .map(value => this.normalizeInsightText(value))
      .filter((value, index, array) => !!value && !this.isGenericInsightText(value) && array.indexOf(value) === index);
  }

  private isGenericInsightText(value: string): boolean {
    const normalized = this.normalizeInsightText(value).toLowerCase();
    if (!normalized) {
      return true;
    }

    if (this.genericInsightPhrases.has(normalized)) {
      return true;
    }

    return (
      normalized.includes('لا توجد تفاصيل كافية') ||
      normalized.includes('غير متاح حاليا') ||
      normalized.includes('غير متاح حالياً') ||
      normalized.includes('not enough details available') ||
      normalized.includes('not available yet')
    );
  }

  private normalizeInsightText(value: unknown): string {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async renderScreenshotCards(
    values: Array<{
      platform: string;
      platformUrl: string;
      publicUrl: string | null;
      captureStatus: string;
      capturedAt: Date | null;
    }>
  ): Promise<string> {
    if (!Array.isArray(values) || values.length === 0) {
      return '<div class="shot muted">No screenshots available</div>';
    }

    const cards = await Promise.all(
      values.map(async item => {
        const platform = this.escapeHtml(item.platform);
        const url = this.escapeHtml(item.platformUrl);
        const status = this.escapeHtml(item.captureStatus);
        const capturedAt = this.escapeHtml(item.capturedAt ? item.capturedAt.toISOString() : 'N/A');
        const embeddedImageSrc =
          item.captureStatus === 'captured'
            ? await this.resolveScreenshotSource(item.publicUrl)
            : null;

        const imageHtml = embeddedImageSrc
          ? `<img src="${embeddedImageSrc}" alt="${platform} screenshot" />`
          : '<div class="muted">Screenshot unavailable</div>';

        return [
          '<article class="shot">',
          `  <h3>${platform}</h3>`,
          `  <p><strong>Status:</strong> ${status}</p>`,
          `  <p><strong>Captured At:</strong> ${capturedAt}</p>`,
          `  <p><strong>URL:</strong> ${url ? `<span class="ltr">${url}</span>` : 'N/A'}</p>`,
          `  ${imageHtml}`,
          '</article>',
        ].join('\n');
      })
    );

    return cards.join('\n');
  }

  private async resolveScreenshotSource(publicUrl: string | null): Promise<string | null> {
    const normalizedUrl = String(publicUrl || '').trim();
    if (!normalizedUrl) {
      return null;
    }

    if (normalizedUrl.startsWith('data:image/')) {
      return this.escapeHtml(normalizedUrl);
    }

    const fetchableUrl = this.resolveFetchableScreenshotUrl(normalizedUrl);
    if (!fetchableUrl) {
      return null;
    }

    try {
      const response = await this.fetchWithTimeout(fetchableUrl, {
        method: 'GET',
        redirect: 'follow',
      });
      if (!response.ok) {
        return null;
      }

      const contentType = (response.headers.get('content-type') || 'image/png').toLowerCase();
      if (!contentType.startsWith('image/')) {
        return null;
      }

      const bytes = await response.arrayBuffer();
      if (bytes.byteLength === 0 || bytes.byteLength > this.screenshotMaxBytes) {
        return null;
      }

      const base64 = Buffer.from(bytes).toString('base64');
      return `data:${contentType};base64,${base64}`;
    } catch {
      return null;
    }
  }

  private resolveFetchableScreenshotUrl(urlValue: string): string | null {
    if (/^https?:\/\//i.test(urlValue)) {
      return urlValue;
    }

    const normalizedPath = urlValue.startsWith('/') ? urlValue : `/${urlValue}`;
    const origin = this.resolveInternalServerOrigin();
    return `${origin}${normalizedPath}`;
  }

  private resolveInternalServerOrigin(): string {
    const configured = String(process.env.REPORTS_SCREENSHOT_INTERNAL_ORIGIN || '').trim();
    if (configured) {
      return configured.replace(/\/+$/g, '');
    }

    const parsedPort = Number(process.env.PORT);
    const port = Number.isFinite(parsedPort) && parsedPort > 0 ? Math.floor(parsedPort) : 3000;
    return `http://127.0.0.1:${port}`;
  }

  /** Returns a ready <img> tag with embedded base64, or a placeholder div */
  private async resolveScreenshotAsImgTag(
    publicUrl: string | null,
    altText: string
  ): Promise<string> {
    const src = await this.resolveScreenshotSource(publicUrl);
    if (!src) {
      return '<div class="website-screenshot-placeholder"><span>لا تتوفر لقطة شاشة</span></div>';
    }
    return `<img class="website-screenshot-img" src="${src}" alt="${this.escapeHtml(altText)}" />`;
  }

  /** Generates a radar/spider chart as inline SVG for the 6 platforms */
  private renderRadarChartSvg(
    scores: Array<{ label: string; value: number | null }>,
    marketAvg = 65
  ): string {
    const cx = 145, cy = 150, r = 105;
    const n = scores.length;

    const angleOf = (i: number) => (i * 2 * Math.PI / n) - Math.PI / 2;
    const ptOf = (i: number, dist: number) => {
      const a = angleOf(i);
      return { x: cx + dist * Math.cos(a), y: cy + dist * Math.sin(a) };
    };
    const pts = (distFn: (i: number) => number) =>
      scores.map((_, i) => { const p = ptOf(i, distFn(i)); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ');

    // Grid levels
    const gridLines = [20, 40, 60, 80, 100].map(level =>
      `<polygon points="${pts(() => r * level / 100)}" fill="none" stroke="rgba(148,163,184,0.12)" stroke-width="0.6"/>`
    ).join('');

    // Axis lines
    const axes = scores.map((_, i) => {
      const p = ptOf(i, r);
      return `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="rgba(148,163,184,0.18)" stroke-width="0.8"/>`;
    }).join('');

    // Axis labels
    const labels = scores.map((s, i) => {
      const p = ptOf(i, r + 20);
      return `<text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="#94a3b8" font-size="10" font-family="Tajawal,Arial,sans-serif">${s.label}</text>`;
    }).join('');

    // Value dots labels (show score near each point)
    const valueDots = scores.map((s, i) => {
      const val = Math.max(0, Math.min(100, s.value ?? 0));
      const p = ptOf(i, r * val / 100);
      return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="#22c55e" stroke="#031222" stroke-width="1"/>`;
    }).join('');

    // Market avg polygon
    const avgPoly = `<polygon points="${pts(() => r * marketAvg / 100)}" fill="rgba(99,102,241,0.1)" stroke="rgba(99,102,241,0.55)" stroke-width="1.5" stroke-dasharray="4 2"/>`;

    // Client polygon
    const clientPoly = `<polygon points="${pts(i => r * Math.max(0, Math.min(100, scores[i].value ?? 0)) / 100)}" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="2"/>`;

    return [
      '<svg viewBox="0 0 290 300" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">',
      gridLines,
      axes,
      avgPoly,
      clientPoly,
      valueDots,
      labels,
      // Legend
      '<rect x="10" y="270" width="14" height="3" rx="1" fill="#22c55e"/>',
      '<text x="28" y="273" dominant-baseline="middle" fill="#94a3b8" font-size="9" font-family="Tajawal,Arial,sans-serif">أداء العميل</text>',
      '<rect x="120" y="270" width="14" height="3" rx="1" fill="rgba(99,102,241,0.7)" stroke-dasharray="4 2"/>',
      '<text x="138" y="273" dominant-baseline="middle" fill="#94a3b8" font-size="9" font-family="Tajawal,Arial,sans-serif">متوسط السوق</text>',
      '</svg>',
    ].join('');
  }

  private resolveTextDirection(payload: RenderHtmlInput['payload']): 'ltr' | 'rtl' {
    const allTextValues: string[] = [
      payload.client.name,
      payload.client.saudiCity || '',
      payload.client.ownerName || '',
      payload.analysis.summary || '',
      ...payload.analysis.strengths,
      ...payload.analysis.weaknesses,
      ...payload.analysis.recommendations,
      ...payload.analysis.platformAnalyses.flatMap(item => [
        item.platform,
        item.platformUrl,
        item.summary || '',
        ...item.strengths,
        ...item.weaknesses,
        ...item.recommendations,
      ]),
      ...payload.screenshots.flatMap(item => [item.platform, item.platformUrl]),
    ];

    return allTextValues.some(item => this.containsArabic(item)) ? 'rtl' : 'ltr';
  }

  private containsArabic(value: string): boolean {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(value);
  }

  private buildEmbeddedFontFaceCss(): string {
    const fontPath = this.resolveArabicFontPath();
    if (!fontPath) {
      return '';
    }

    try {
      const fileBuffer = readFileSync(fontPath);
      const { mimeType, format } = this.resolveFontFormat(fontPath);
      const base64 = fileBuffer.toString('base64');

      return [
        '@font-face {',
        "  font-family: 'ReportArabicFallback';",
        `  src: url(data:${mimeType};base64,${base64}) format('${format}');`,
        '  font-style: normal;',
        '  font-weight: 400;',
        '  font-display: swap;',
        '}',
      ].join('\n');
    } catch {
      return '';
    }
  }

  private resolveArabicFontPath(): string | null {
    const envPath = String(process.env.REPORTS_PDF_ARABIC_FONT_PATH || '').trim();
    const candidates = [
      envPath,
      '/usr/share/fonts/truetype/noto/NotoNaskhArabic-Regular.ttf',
      '/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf',
      '/usr/share/fonts/opentype/noto/NotoNaskhArabic-Regular.ttf',
      '/usr/share/fonts/opentype/noto/NotoSansArabic-Regular.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
      'C:\\Windows\\Fonts\\segoeui.ttf',
      'C:\\Windows\\Fonts\\arial.ttf',
      '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
      '/System/Library/Fonts/Supplemental/Geeza Pro.ttf',
    ];

    for (const candidate of candidates) {
      if (!candidate) {
        continue;
      }
      if (existsSync(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  private resolveFontFormat(fontPath: string): {
    mimeType: string;
    format: 'truetype' | 'opentype' | 'woff' | 'woff2';
  } {
    const normalized = fontPath.toLowerCase();
    if (normalized.endsWith('.woff2')) {
      return { mimeType: 'font/woff2', format: 'woff2' };
    }
    if (normalized.endsWith('.woff')) {
      return { mimeType: 'font/woff', format: 'woff' };
    }
    if (normalized.endsWith('.otf')) {
      return { mimeType: 'font/otf', format: 'opentype' };
    }
    return { mimeType: 'font/ttf', format: 'truetype' };
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

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    if (this.screenshotFetchTimeoutMs <= 0) {
      return fetch(url, init);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.screenshotFetchTimeoutMs);

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private formatScore(value: number | null): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 'N/A';
    }

    return `${Number(value.toFixed(2))} / 100`;
  }

  private formatCoverDate(value: Date, reportLanguage: 'ar' | 'en'): string {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      return 'N/A';
    }

    const locale = reportLanguage === 'ar' ? 'ar-SA' : 'en-US';
    try {
      return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(value);
    } catch {
      return value.toISOString().slice(0, 10);
    }
  }

  private trimForCover(value: string): string {
    const normalized = String(value || '').replace(/\s+/g, ' ').trim();
    if (normalized.length <= 260) {
      return normalized;
    }

    return `${normalized.slice(0, 257).trim()}...`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
