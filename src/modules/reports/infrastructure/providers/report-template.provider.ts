import { ReportTemplateDefinition } from '../../domain/entities';
import { ReportTemplateKey } from '../../domain/enums';
import { ReportTemplateRepositoryContract } from '../../domain/repositories';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const COVER_LOGO_CANDIDATE_PATHS = [
    path.resolve(process.cwd(), 'logo.png'),
    path.resolve(process.cwd(), '..', 'logo.png'),
    path.resolve(__dirname, '../../../../../logo.png'),
];
const loadCoverLogoDataUri = () => {
    for (const logoPath of COVER_LOGO_CANDIDATE_PATHS) {
        if (!existsSync(logoPath)) {
            continue;
        }
        try {
            const logoBuffer = readFileSync(logoPath);
            return `data:image/png;base64,${logoBuffer.toString('base64')}`;
        }
        catch {
            // Try next path if current file cannot be read.
        }
    }
    return '';
};
const COVER_LOGO_DATA_URI = loadCoverLogoDataUri();
const REPORTS_TEMPLATE_VARIANT = String(process.env.REPORTS_TEMPLATE_VARIANT || 'legacy-full')
    .trim()
    .toLowerCase();
const LEGACY_REPORT_ADDITIONAL_PAGES = `
  <!-- PAGE 2 - MAKSAB INTRO -->
  <section class="report-page maksab-intro-page">
    <div class="report-page-inner intro-v3-page-inner">
      <header class="intro-v3-topbar">
        <div class="intro-v3-date-block">
          <span class="intro-v3-date-label">تاريخ الإصدار</span>
          <strong class="intro-v3-date-value">{{report_generated_date}}</strong>
          <span class="intro-v3-priority-pill">{{intro_priority_level}}</span>
        </div>
        <div class="intro-v3-brand-block">
          <div class="intro-v3-brand-copy">
            <h2>مكسب لخدمات الاعمال</h2>
            <p>وكالة تسويق رقمي متخصصة - المملكة العربية السعودية</p>
          </div>
          <div class="intro-v3-brand-logo">
            ${COVER_LOGO_DATA_URI
    ? `<img class="intro-v3-brand-logo-image" src="${COVER_LOGO_DATA_URI}" alt="Maksab logo" />`
    : `<span class="intro-v3-brand-logo-word">&#1605;&#1603;&#1587;&#1576;</span>`}
          </div>
        </div>
      </header>

      <section class="intro-v3-hero">
        <p class="intro-v3-kicker">تقرير تنفيذي مخصص لعناية</p>
        <h1 class="intro-v3-client-name">{{client_name}}</h1>
        <p class="intro-v3-client-meta">جميع المدن - السعودية &nbsp; • &nbsp; عام</p>
        <span class="intro-v3-analysis-chip">
          تحليل رقمي شامل • 9 صفحة تحليلية
          <span class="intro-v3-chip-dot"></span>
        </span>
      </section>

      <section class="intro-v3-metrics-section">
        <p class="intro-v3-section-title">المؤشرات الرئيسية</p>
        <div class="intro-v3-metrics-grid">
          <article class="intro-v3-metric-card accent-violet">
            <strong>{{intro_digital_engagement_score}}</strong>
            <span>التفاعل الرقمي</span>
            <small>من 10</small>
          </article>
          <article class="intro-v3-metric-card accent-blue">
            <strong>{{intro_website_score}}</strong>
            <span>تقييم الموقع</span>
            <small>من 10</small>
          </article>
          <article class="intro-v3-metric-card accent-green">
            <strong>{{intro_data_quality_pct}}</strong>
            <span>جودة البيانات</span>
            <small>دقة التحليل</small>
          </article>
          <article class="intro-v3-metric-card accent-teal">
            <strong>{{intro_priority_score}}</strong>
            <span>درجة الأولوية</span>
            <small>من 10</small>
          </article>
        </div>
      </section>

      <section class="intro-v3-platforms-row">
        {{intro_platform_chips}}
      </section>

      <section class="intro-v3-focus-card">
        <span class="intro-v3-focus-kicker">أبرز فرصة تحسين 🎯</span>
        <h3>{{intro_focus_title}}</h3>
        <p>{{intro_focus_description}}</p>
        <div class="intro-v3-focus-tags">
          <span class="intro-v3-tag-good">{{intro_focus_primary_tag}}</span>
          <span class="intro-v3-tag-warn">{{intro_focus_warning_tag}}</span>
        </div>
      </section>
    </div>
  </section>

  <!-- PAGE 3 - WEBSITE -->
  <section class="report-page website-page">
    <div class="report-page-inner">
            <header class="analysis-page-header">
        <div class="analysis-page-header-right">
          <div class="analysis-page-header-title-wrap">
            <span class="analysis-page-header-accent"></span>
            <div class="analysis-page-header-copy">
              <h2>تحليل الموقع الإلكتروني</h2>
              <p>تقييم أداء الموقع وجودة التجربة الرقمية والمحتوى</p>
            </div>
          </div>
        </div>
        <div class="analysis-page-header-left">
          <div class="analysis-page-header-client">
            <strong>{{client_name}}</strong>
            <span>مكسب - صفحة تحليلية</span>
          </div>
          <div class="analysis-page-header-logo">
            ${COVER_LOGO_DATA_URI
    ? `<img class="analysis-page-header-logo-image" src="${COVER_LOGO_DATA_URI}" alt="Maksab logo" />`
    : `<span class="analysis-page-header-logo-word">&#1605;&#1603;&#1587;&#1576;</span>`}
          </div>
        </div>
      </header>

      <div class="website-screenshot-wrap">
        <div class="website-screenshot-frame">
          {{website_screenshot_img}}
          <div class="website-screenshot-url-bar">
            <span class="url-dot r"></span><span class="url-dot y"></span><span class="url-dot g"></span>
            <span class="url-text ltr">{{website_url}}</span>
          </div>
        </div>
      </div>

      <div class="website-summary-box">
        <span class="section-chip">ملخص التحليل</span>
        <p class="website-summary-text">{{website_summary}}</p>
      </div>

      <div class="website-analysis-cols">
        <div class="wa-col strengths-col">
          <h3 class="wa-col-title"><span class="wa-icon">OK</span> نقاط القوة</h3>
          <ul class="wa-list">{{website_strengths_items}}</ul>
        </div>
        <div class="wa-col weaknesses-col">
          <h3 class="wa-col-title"><span class="wa-icon">!</span> نقاط الضعف</h3>
          <ul class="wa-list">{{website_weaknesses_items}}</ul>
        </div>
        <div class="wa-col recommendations-col">
          <h3 class="wa-col-title"><span class="wa-icon">GO</span> التوصيات</h3>
          <ul class="wa-list">{{website_recommendations_items}}</ul>
        </div>
      </div>
    </div>
  </section>

  <!-- PAGE 3 — ALL SOCIAL MEDIA (compact 3×2 grid) -->
  <section class="report-page social-all-page">
    <div class="report-page-inner">
            <header class="analysis-page-header">
        <div class="analysis-page-header-right">
          <div class="analysis-page-header-title-wrap">
            <span class="analysis-page-header-accent"></span>
            <div class="analysis-page-header-copy">
              <h2>التحليل العميق</h2>
              <p>مقارنة الأداء بمعايير السوق وتحليل المنصات</p>
            </div>
          </div>
        </div>
        <div class="analysis-page-header-left">
          <div class="analysis-page-header-client">
            <strong>{{client_name}}</strong>
            <span>مكسب - صفحة تحليلية</span>
          </div>
          <div class="analysis-page-header-logo">
            ${COVER_LOGO_DATA_URI
    ? `<img class="analysis-page-header-logo-image" src="${COVER_LOGO_DATA_URI}" alt="Maksab logo" />`
    : `<span class="analysis-page-header-logo-word">&#1605;&#1603;&#1587;&#1576;</span>`}
          </div>
        </div>
      </header>

      <div class="social-all-grid">

        <!-- ── FACEBOOK ── -->
        <div class="soc-card">
          <div class="soc-card-hd facebook-header">
            <span class="social-icon">🟦</span>
            <span class="soc-card-name">فيسبوك</span>
            <span class="social-score-badge">{{facebook_score}}</span>
          </div>
          <div class="soc-card-shot">
            {{facebook_screenshot_img}}
            <div class="soc-url-bar">
              <span class="url-dot r"></span><span class="url-dot y"></span><span class="url-dot g"></span>
              <span class="url-text ltr">{{facebook_url}}</span>
            </div>
          </div>
          <div class="soc-card-body">
            {{facebook_insight_points}}
          </div>
        </div>

        <!-- ── INSTAGRAM ── -->
        <div class="soc-card">
          <div class="soc-card-hd instagram-header">
            <span class="social-icon">🟣</span>
            <span class="soc-card-name">إنستجرام</span>
            <span class="social-score-badge">{{instagram_score}}</span>
          </div>
          <div class="soc-card-shot">
            {{instagram_screenshot_img}}
            <div class="soc-url-bar">
              <span class="url-dot r"></span><span class="url-dot y"></span><span class="url-dot g"></span>
              <span class="url-text ltr">{{instagram_url}}</span>
            </div>
          </div>
          <div class="soc-card-body">
            {{instagram_insight_points}}
          </div>
        </div>

        <!-- ── X (Twitter) ── -->
        <div class="soc-card">
          <div class="soc-card-hd x-header">
            <span class="social-icon">𝕏</span>
            <span class="soc-card-name">X (تويتر)</span>
            <span class="social-score-badge">{{x_score}}</span>
          </div>
          <div class="soc-card-shot">
            {{x_screenshot_img}}
            <div class="soc-url-bar">
              <span class="url-dot r"></span><span class="url-dot y"></span><span class="url-dot g"></span>
              <span class="url-text ltr">{{x_url}}</span>
            </div>
          </div>
          <div class="soc-card-body">
            {{x_insight_points}}
          </div>
        </div>

        <!-- ── SNAPCHAT ── -->
        <div class="soc-card">
          <div class="soc-card-hd snapchat-header">
            <span class="social-icon">👻</span>
            <span class="soc-card-name">سناب شات</span>
            <span class="social-score-badge">{{snapchat_score}}</span>
          </div>
          <div class="soc-card-shot">
            {{snapchat_screenshot_img}}
            <div class="soc-url-bar">
              <span class="url-dot r"></span><span class="url-dot y"></span><span class="url-dot g"></span>
              <span class="url-text ltr">{{snapchat_url}}</span>
            </div>
          </div>
          <div class="soc-card-body">
            {{snapchat_insight_points}}
          </div>
        </div>

        <!-- ── TIKTOK ── -->
        <div class="soc-card">
          <div class="soc-card-hd tiktok-header">
            <span class="social-icon">🎵</span>
            <span class="soc-card-name">تيك توك</span>
            <span class="social-score-badge">{{tiktok_score}}</span>
          </div>
          <div class="soc-card-shot">
            {{tiktok_screenshot_img}}
            <div class="soc-url-bar">
              <span class="url-dot r"></span><span class="url-dot y"></span><span class="url-dot g"></span>
              <span class="url-text ltr">{{tiktok_url}}</span>
            </div>
          </div>
          <div class="soc-card-body">
            {{tiktok_insight_points}}
          </div>
        </div>

        <!-- ── LINKEDIN ── -->
        <div class="soc-card">
          <div class="soc-card-hd linkedin-header">
            <span class="social-icon">💼</span>
            <span class="soc-card-name">لينكد إن</span>
            <span class="social-score-badge">{{linkedin_score}}</span>
          </div>
          <div class="soc-card-shot">
            {{linkedin_screenshot_img}}
            <div class="soc-url-bar">
              <span class="url-dot r"></span><span class="url-dot y"></span><span class="url-dot g"></span>
              <span class="url-text ltr">{{linkedin_url}}</span>
            </div>
          </div>
          <div class="soc-card-body">
            {{linkedin_insight_points}}
          </div>
        </div>


      </div><!-- /social-all-grid -->
    </div>
  </section>

  <!-- PAGE 5 - PERFORMANCE + RADAR -->
  <section class="report-page p5-overview-page">
    <div class="report-page-inner">
      <header class="analysis-page-header">
        <div class="analysis-page-header-right">
          <div class="analysis-page-header-title-wrap">
            <span class="analysis-page-header-accent"></span>
            <div class="analysis-page-header-copy">
              <h2>التحليل العميق</h2>
              <p>مقارنة الأداء بمعيار السوق وتحليل المنصات</p>
            </div>
          </div>
        </div>
        <div class="analysis-page-header-left">
          <div class="analysis-page-header-client">
            <strong>{{client_name}}</strong>
            <span>مكسب - صفحة تحليلية</span>
          </div>
          <div class="analysis-page-header-logo">
            ${COVER_LOGO_DATA_URI
    ? `<img class="analysis-page-header-logo-image" src="${COVER_LOGO_DATA_URI}" alt="Maksab logo" />`
    : `<span class="analysis-page-header-logo-word">&#1605;&#1603;&#1587;&#1576;</span>`}
          </div>
        </div>
      </header>

      <div class="p5-cols modified">
        <section class="p5-tiktok-col p5-nobg">
          <div class="radar-header no-border">
            <span class="radar-icon">📊</span>
            <span class="radar-title">أداء المنصات الرقمية</span>
          </div>

          <div class="radar-platform-list p5-nobg">
            <div class="rpl-grid modified">
              
              <div class="rpl-item border-web">
                <div class="rpl-score-box">
                  <span class="score-val">{{website_score}}</span>
                </div>
                <div class="rpl-bar-col">
                  <span class="rpl-bar-wrap"><span class="rpl-bar web" style="width: {{website_score_pct}}%;"></span></span>
                </div>
                <div class="rpl-info-box">
                  <div class="rpl-text-stack">
                    <span class="rpl-label">الموقع الإلكتروني</span>
                    <span class="rpl-sub ltr">{{website_url}}</span>
                  </div>
                  <span class="rpl-item-icon">🌐</span>
                </div>
              </div>

              <div class="rpl-item border-fb">
                <div class="rpl-score-box">
                  <span class="score-val">{{facebook_score}}</span>
                </div>
                <div class="rpl-bar-col">
                  <span class="rpl-bar-wrap"><span class="rpl-bar fb" style="width: {{facebook_score_pct}}%;"></span></span>
                </div>
                <div class="rpl-info-box">
                  <div class="rpl-text-stack">
                    <span class="rpl-label">فيسبوك</span>
                    <span class="rpl-sub ltr">{{facebook_url}}</span>
                  </div>
                  <span class="rpl-item-icon">🟦</span>
                </div>
              </div>

              <div class="rpl-item border-ig">
                <div class="rpl-score-box">
                  <span class="score-val">{{instagram_score}}</span>
                </div>
                <div class="rpl-bar-col">
                  <span class="rpl-bar-wrap"><span class="rpl-bar ig" style="width: {{instagram_score_pct}}%;"></span></span>
                </div>
                <div class="rpl-info-box">
                  <div class="rpl-text-stack">
                    <span class="rpl-label">إنستقرام</span>
                    <span class="rpl-sub ltr">{{instagram_url}}</span>
                  </div>
                  <span class="rpl-item-icon">📷</span>
                </div>
              </div>

              <div class="rpl-item border-tt">
                <div class="rpl-score-box">
                  <span class="score-val">{{tiktok_score}}</span>
                </div>
                <div class="rpl-bar-col">
                  <span class="rpl-bar-wrap"><span class="rpl-bar tt" style="width: {{tiktok_score_pct}}%;"></span></span>
                </div>
                <div class="rpl-info-box">
                  <div class="rpl-text-stack">
                    <span class="rpl-label">تيك توك</span>
                    <span class="rpl-sub ltr">{{tiktok_url}}</span>
                  </div>
                  <span class="rpl-item-icon">🎵</span>
                </div>
              </div>

              <div class="rpl-item border-sc">
                <div class="rpl-score-box">
                  <span class="score-val">{{snapchat_score}}</span>
                </div>
                <div class="rpl-bar-col">
                  <span class="rpl-bar-wrap"><span class="rpl-bar sc" style="width: {{snapchat_score_pct}}%;"></span></span>
                </div>
                <div class="rpl-info-box">
                  <div class="rpl-text-stack">
                    <span class="rpl-label">سناب شات</span>
                    <span class="rpl-sub ltr">{{snapchat_url}}</span>
                  </div>
                  <span class="rpl-item-icon">👻</span>
                </div>
              </div>

              <div class="rpl-item border-x">
                <div class="rpl-score-box">
                  <span class="score-val">{{x_score}}</span>
                </div>
                <div class="rpl-bar-col">
                  <span class="rpl-bar-wrap"><span class="rpl-bar x-bar" style="width: {{x_score_pct}}%;"></span></span>
                </div>
                <div class="rpl-info-box">
                  <div class="rpl-text-stack">
                    <span class="rpl-label">تويتر / X</span>
                    <span class="rpl-sub ltr">{{x_url}}</span>
                  </div>
                  <span class="rpl-item-icon">𝕏</span>
                </div>
              </div>

              <div class="rpl-item border-li">
                <div class="rpl-score-box">
                  <span class="score-val">{{linkedin_score}}</span>
                </div>
                <div class="rpl-bar-col">
                  <span class="rpl-bar-wrap"><span class="rpl-bar li" style="width: {{linkedin_score_pct}}%;"></span></span>
                </div>
                <div class="rpl-info-box">
                  <div class="rpl-text-stack">
                    <span class="rpl-label">لينكد إن</span>
                    <span class="rpl-sub ltr">{{linkedin_url}}</span>
                  </div>
                  <span class="rpl-item-icon">💼</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section class="p5-radar-col">
          <div class="radar-header">
            <span class="radar-icon">📈</span>
            <span class="radar-title">مقارنة الأداء بمعيار السوق</span>
          </div>
          <div class="radar-chart-wrap">
            {{radar_chart_svg}}
          </div>
        </section>
      </div>

      <!-- MARKETING SEASON (BOTTOM 48%) -->
      <div class="p5-mseason">
        <!-- TOP CARD -->
        <div class="ms-card">
          <div class="ms-card-bg-icon">📅</div>
          <div class="ms-header-flex">
            <div class="ms-hero-icon">📅</div>
            <div class="ms-hero-text">
              <div class="ms-hero-meta">
                <span class="ms-date-pill">الموسم التسويقي الحالي 📅</span>
                <span class="ms-info-pill">وقت مثالي لبناء الأساس الرقمي 📊</span>
              </div>
              <h1 class="ms-season-title">{{ms_season_title}}</h1>
            </div>
          </div>
          <div class="ms-invest-box">
            <p>{{ms_season_description}}</p>
          </div>
          <div class="ms-3cols">
            <div class="ms-mini-box">
              <span class="ms-mc-title ms-title-cyan">فرصة الموسم 📈</span>
              <p class="ms-mc-desc">الطلب يرتفع في هذا الموسم - التوقيت مثالي للتسويق</p>
            </div>
            <div class="ms-mini-box">
              <span class="ms-mc-title ms-title-orange">القنوات المثلى 🎯</span>
              <p class="ms-mc-desc">سناب شات + إنستغرام + جوجل للوصول للعميل السعودي</p>
            </div>
            <div class="ms-mini-box">
              <span class="ms-mc-title ms-title-yellow">الإجراء الفوري ⚡</span>
              <p class="ms-mc-desc">ابدأ بالتسويق الآن لاستثمار الموسم قبل انتهائه</p>
            </div>
          </div>
        </div>

        <!-- MID SECTION -->
        <div class="ms-section-header">التوصيات المرتبة حسب الأولوية 🎯</div>
        <div class="ms-empty-box">
          <p>لم يتم تحديد توصيات بعد – قم بتشغيل التحليل الذكي أولاً</p>
        </div>

        <!-- BOTTOM CARD -->
        <div class="ms-plan">
          <div class="ms-section-header-inline">الخطة المبدئية المقترحة 📋</div>
          <div class="ms-3cols ms-plan-months">
            <div class="ms-month border-green">
              <span class="ms-month-title">الشهر الأول 📅</span>
              <p class="ms-month-desc">تأسيس الحضور الرقمي: تحسين الملف التجاري + إنشاء أو تحديث حسابات السوشيال</p>
            </div>
            <div class="ms-month border-cyan">
              <span class="ms-month-title">الشهر الثاني 📅</span>
              <p class="ms-month-desc">تفعيل المحتوى: حملة موسمية + إعلانات مدفوعة مستهدفة للجمهور المحلي</p>
            </div>
            <div class="ms-month border-purple">
              <span class="ms-month-title">الشهر الثالث 📅</span>
              <p class="ms-month-desc">قياس النتائج: تحليل الأداء + تحسين الحملات + رفع العائد على الاستثمار</p>
            </div>
          </div>
          <div class="ms-priority-banner">
            <span class="ms-pb-icon">⚡</span>
            <div class="ms-pb-text">
              <strong>الأولوية الآن: تحسين وضوح النشاط ودعم قرار الشراء</strong> – هذه الخطوة ستحقق أكبر أثر في أقل وقت ممكن. مستوى الإلحاح: <span class="ms-yellow-txt">🟡 إلحاح متوسط</span>
            </div>
          </div>
        </div>

        <!-- CTA ROW -->
        <div class="ms-cta-row">
          <div class="ms-cta-text">
            <h3>هذه التوصيات قابلة للتنفيذ فوراً 🚀</h3>
            <p>فريق مكسب جاهز لتحويل هذه التوصيات إلى نتائج حقيقية خلال 90 يوماً</p>
          </div>
          <div class="ms-cta-btn">
            <span class="ms-cta-title">ابدأ الآن 💬</span>
            <span class="ms-cta-sub">واتساب - رد فوري</span>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- PAGE 6 - FINAL CTA PAGE -->
  <section class="report-page cta-final-page">
    <div class="report-page-inner cta-page-inner">
      <header class="analysis-page-header">
        <div class="analysis-page-header-right">
          <div class="analysis-page-header-title-wrap">
            <span class="analysis-page-header-accent" style="background:#10b981"></span>
            <div class="analysis-page-header-copy">
              <h2>الخطوة التالية</h2>
              <p>ابدأ خطتك الرقمية اليوم مع مكسب</p>
            </div>
          </div>
        </div>
        <div class="analysis-page-header-left">
          <div class="analysis-page-header-client">
            <strong>{{client_name}}</strong>
            <span>مكسب - صفحة 9/9</span>
          </div>
          <div class="analysis-page-header-logo">
            ${COVER_LOGO_DATA_URI
    ? `<img class="analysis-page-header-logo-image" src="${COVER_LOGO_DATA_URI}" alt="Maksab logo" />`
    : `<span class="analysis-page-header-logo-word">&#1605;&#1603;&#1587;&#1576;</span>`}
          </div>
        </div>
      </header>

      <!-- Badge Area -->
      <div class="cta-badge-card">
        <div class="cta-badge-icon" style="background:transparent; border:none"><span style="font-size: 2rem">🏅</span></div>
        <div class="cta-badge-content">
          <h3>تقرير معتمد من مكسب لخدمات الأعمال</h3>
          <span>تحليل ذكاء اصطناعي + مراجعة بشرية متخصصة</span>
        </div>
        <div class="cta-badge-meta">
          <div class="cta-meta-item">
            <span class="lbl">رقم التقرير</span>
            <span class="val" style="color:#22c55e">RPT-1140001-2026</span>
          </div>
          <div class="cta-meta-divider"></div>
          <div class="cta-meta-item">
            <span class="lbl">تاريخ الإصدار</span>
            <span class="val">{{report_generated_date}}</span>
          </div>
          <div class="cta-meta-divider"></div>
          <div class="cta-meta-item" style="align-items:flex-end">
            <span class="lbl">السجل التجاري</span>
            <span class="val">7040860202</span>
          </div>
        </div>
      </div>

      <!-- Action Hero Area -->
      <div class="cta-hero-card">
        <div class="cta-hero-glow"></div>
        <h2 class="cta-hero-title">هذا التقرير هو البداية - الخطة الكاملة تنتظرك</h2>
        <p class="cta-hero-desc">الفرصة موجودة. والفرق يكون في البدء من المكان الصح. وإذا حبيت، ننتقل معكم لمرحلة أعمق نحدد فيها الأولوية اللي تستحق التنفيذ أولاً بشكل واضح وعملي.</p>
        
        <div class="cta-steps-row">
          <div class="cta-step">
            <div class="cta-step-circle" style="color:#a78bfa; border-color: rgba(167, 139, 250, 0.4); background: rgba(167, 139, 250, 0.1)">3</div>
            <span class="cta-step-title">ابدأ النمو</span>
            <p class="cta-step-desc">تنفيذ فوري بفريق متخصص ونتائج قابلة للقياس</p>
          </div>
          <div class="cta-step">
            <div class="cta-step-circle" style="color:#38bdf8; border-color: rgba(56, 189, 248, 0.4); background: rgba(56, 189, 248, 0.1)">2</div>
            <span class="cta-step-title">جلسة تحليل</span>
            <p class="cta-step-desc">30 دقيقة نبني فيها خطتك المخصصة</p>
          </div>
          <div class="cta-step">
            <div class="cta-step-circle">1</div>
            <span class="cta-step-title">تواصل معنا</span>
            <p class="cta-step-desc">أرسل لنا عبر واتساب وسنرد خلال ساعات</p>
          </div>
        </div>

        <div class="cta-btn-wrap">
          <div class="cta-pulse-btn">
            <div><span class="cta-btn-icon">💬</span> تواصل معنا الآن عبر واتساب</div>
            <small>رد فوري • استشارة مجانية • بدون التزام</small>
          </div>
        </div>
      </div>

      <!-- Footer Contact Area (2 Columns) -->
      <div class="cta-footer-grid-2col">
        <div class="cta-ft2-col">
          <div class="cta-ft2-header">
            <span class="cta-ft2-icon">📞</span> قنوات التواصل
          </div>
          <div class="cta-ft2-line"><strong>واتساب:</strong> <span class="ltr" style="color:#22c55e">+966 11 500 4605</span></div>
          <div class="cta-ft2-line"><strong>إيميل:</strong> <span class="ltr" style="color:#38bdf8">info@maksab-ksa.com</span></div>
          <div class="cta-ft2-line"><strong>الموقع:</strong> <span class="ltr">maksab-ksa.com</span></div>
        </div>

        <div class="cta-ft2-col border-right">
          <div class="cta-ft2-header">
            <span class="cta-ft2-icon" style="color:#fbbf24">⚡</span> لماذا الآن؟
          </div>
          <div class="cta-ft2-line">• منافسوك يتحركون الآن في السوق</div>
          <div class="cta-ft2-line">• كل يوم تأخير = فرص ضائعة</div>
          <div class="cta-ft2-line">• الاستشارة الأولى مجانية تماماً</div>
        </div>
      </div>

      <!-- Disclaimer Block -->
      <div class="cta-disclaimer">
        هذا التقرير سري ومخصص حصرياً لعناية <strong>{{client_name}}</strong> ويحظر توزيعه أو نسخه دون إذن كتابي. جميع التحليلات آراء مهنية مبنية على أرقام متاحة ولا تمثل ضماناً لنتائج محددة. <span class="r-text" style="color:#22c55e; margin-right: 4px;">رقم التقرير: RPT-1140001-2026</span>
      </div>
      
    </div>
  </section>
`;
const DEFAULT_TEMPLATE: ReportTemplateDefinition = {
    templateKey: ReportTemplateKey.DefaultClientReport,
    templateName: 'Default Client Report',
    htmlTemplate: `
<main class="report {{report_direction_class}}" dir="rtl">
  <section class="cover-page">
    <section class="report-cover" aria-label="غلاف التقرير الثابت">

      <!-- ─ Cover Page Header (same bar as inner pages) ─ -->
      <header class="page-header cover-page-header">
        <div class="cover-header-date">{{report_generated_date}}</div>
        <div class="page-header-meta cover-header-meta">
          <span class="page-header-client">MAKSAB</span>
          <span class="page-header-label">&#1608;&#1603;&#1575;&#1604;&#1577; &#1578;&#1587;&#1608;&#1610;&#1602; &#1585;&#1602;&#1605;&#1610; &#183; &#1575;&#1604;&#1605;&#1605;&#1604;&#1603;&#1577; &#1575;&#1604;&#1593;&#1585;&#1576;&#1610;&#1577; &#1575;&#1604;&#1587;&#1593;&#1608;&#1583;&#1610;&#1577;</span>
        </div>
        <div class="cover-header-dots">
          <span class="cover-dot dot-blue"></span>
          <span class="cover-dot dot-cyan"></span>
          <span class="cover-dot dot-green"></span>
        </div>
      </header>
      <header class="report-cover-top">
        <div class="report-cover-logo cover-logo-mark">
          ${COVER_LOGO_DATA_URI
        ? `<img class="cover-logo-image" src="${COVER_LOGO_DATA_URI}" alt="Maksab logo" />`
        : `<span class="cover-logo-word">&#1605;&#1603;&#1587;&#1576;</span>`}
        </div>
      </header>
      <div class="cover-watermark">&#1605;&#1603;&#1587;&#1576; &#1604;&#1582;&#1583;&#1605;&#1575;&#1578; &#1575;&#1604;&#1575;&#1593;&#1605;&#1575;&#1604;</div>

      <h1 class="report-cover-title">مكسب لخدمات الاعمال</h1>
      <p class="report-cover-subtitle">وكالة التسويق الرقمي المتخصصة</p>
      <p class="report-cover-meta">المملكة العربية السعودية - خبرة أكثر من 5 سنوات في السوق السعودي</p>

      <span class="section-chip">من نحن وماذا نقدم</span>

      <div class="report-cover-main">
        <section class="report-cover-intro">
          <strong>مكسب</strong> هي وكالة تسويق رقمي سعودية متخصصة في مساعدة الأنشطة التجارية على بناء حضور رقمي قوي،
          تحقيق نمو مستدام، وتحويل الزوار إلى عملاء حقيقيين. نعمل مع أصحاب الأعمال في جميع مناطق المملكة
          لتقديم حلول تسويقية مخصصة مبنية على بيانات حقيقية.
        </section>

        <section class="report-services">
          <article class="service-card">
            <h3><span class="icon">⚙️</span> إدارة السوشيال ميديا</h3>
            <p>نزيد تفاعل جمهورك بشكل مستمر، ونحوّل المتابعين إلى عملاء محتملين.</p>
          </article>
          <article class="service-card">
            <h3><span class="icon">🌐</span> تصميم المواقع</h3>
            <p>مواقع سريعة واحترافية تعكس هوية نشاطك وتدعم التحويل.</p>
          </article>
          <article class="service-card">
            <h3><span class="icon">🎯</span> الإعلانات المدفوعة</h3>
            <p>حملات ممولة على منصات متعددة بأفضل استثمار للميزانية.</p>
          </article>
          <article class="service-card">
            <h3><span class="icon">📊</span> استراتيجية التسويق</h3>
            <p>خطط تسويقية مخصصة لكل نشاط تجاري في السعودية.</p>
          </article>
          <article class="service-card">
            <h3><span class="icon">🤖</span> تحليل البيانات الذكي</h3>
            <p>قرارات تسويقية مبنية على تقارير دقيقة ونتائج قابلة للقياس.</p>
          </article>
          <article class="service-card">
            <h3><span class="icon">🔎</span> تحسين محركات البحث</h3>
            <p>تحسين ظهور نشاطك محليًا في نتائج البحث السعودية.</p>
          </article>
        </section>

        <section class="report-stats">
          <div class="stat-card">
            <strong class="amber">24/7</strong>
            <span>دعم متواصل</span>
          </div>
          <div class="stat-card">
            <strong class="violet">20+</strong>
            <span>مدينة سعودية</span>
          </div>
          <div class="stat-card">
            <strong class="blue">5+</strong>
            <span>سنوات خبرة</span>
          </div>
          <div class="stat-card">
            <strong class="green">500+</strong>
            <span>عميل راضٍ</span>
          </div>
        </section>

        <section class="report-welcome">
          <h2>أهلاً وسهلاً بك في مكسب <span>🤝</span></h2>
          <p>
            يسعدنا تقديم هذا التقرير التحليلي المتخصص لنشاطك التجاري. نبدأ بخطة واضحة للتحول الرقمي
            ومقارنة بالسوق والمنافسين، ثم ننتقل إلى خارطة طريق واقعية لتحقيق نمو ملموس في السوق السعودي.
          </p>
        </section>

        <span class="section-chip secondary">لماذا تختار مكسب؟</span>

        <section class="report-benefits">
          <article class="benefit-card">
            <h3><span>🎯</span> تخصيص 100% للسوق السعودي</h3>
            <p>نركز على سلوك العملاء المحليين واحتياجات كل مدينة داخل المملكة.</p>
          </article>
          <article class="benefit-card">
            <h3><span>📚</span> تقارير مبنية على بيانات حقيقية</h3>
            <p>كل قرار تسويقي يعتمد على أرقام واضحة ومؤشرات أداء دقيقة.</p>
          </article>
          <article class="benefit-card">
            <h3><span>⚡</span> نتائج قابلة للقياس خلال 90 يومًا</h3>
            <p>تنفيذ سريع مع متابعة أسبوعية وتحسين مستمر للحملات.</p>
          </article>
          <article class="benefit-card">
            <h3><span>🤝</span> شراكة طويلة الأمد مع فريقك</h3>
            <p>نعمل كامتداد لفريقك الداخلي لتحقيق أهداف نمو مستدامة.</p>
          </article>
        </section>

        <span class="section-chip tertiary">كيف نعمل معك؟</span>
      </div>

      <section class="report-steps">
        <div class="report-steps-line"></div>
        <div class="report-steps-grid">
          <article class="report-step">
            <span class="step-no">1</span>
            <h3>تشخيص رقمي</h3>
            <p>فهم الوضع الحالي</p>
          </article>
          <article class="report-step">
            <span class="step-no">2</span>
            <h3>خطة تنفيذية</h3>
            <p>أهداف واضحة</p>
          </article>
          <article class="report-step">
            <span class="step-no">3</span>
            <h3>تشغيل الحملات</h3>
            <p>تنفيذ ومتابعة</p>
          </article>
          <article class="report-step">
            <span class="step-no">4</span>
            <h3>قياس وتطوير</h3>
            <p>تحسين مستمر</p>
          </article>
        </div>
      </section>
    </section>
  </section>

  <!-- ═══════════════════════════════════════════════════════════ PAGE 2 — WEBSITE -->
${REPORTS_TEMPLATE_VARIANT === 'cover-only' ? '' : LEGACY_REPORT_ADDITIONAL_PAGES}
</main>
  `,
    cssTemplate: `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&family=Cairo:wght@400;600;700;800;900&family=Manrope:wght@500;700;800&display=swap');

:root {
  --report-font-family: "ReportArabicFallback", "Noto Naskh Arabic", "Noto Sans Arabic", "Tajawal", "Segoe UI", Tahoma, Arial, sans-serif;
  --report-font-family-display-ar: "ReportArabicFallback", "Noto Naskh Arabic", "Cairo", "Tajawal", "Noto Sans Arabic", "Segoe UI", Tahoma, Arial, sans-serif;
  --report-font-family-display-mix: "ReportArabicFallback", "Noto Naskh Arabic", "Manrope", "Cairo", "Tajawal", "Noto Sans Arabic", "Segoe UI", Tahoma, Arial, sans-serif;
}

* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
}
body {
  font-family: var(--report-font-family);
  color: #dbeafe;
  background: #020617;
}

.report {
  width: 190mm;
  max-width: 190mm;
  margin: 0 auto;
  padding: 0;
  direction: rtl;
}

.cover-page {
  width: 190mm;
  height: 277mm;
  overflow: hidden;
  break-inside: avoid;
  page-break-inside: avoid;
  display: flex;
  flex-direction: column;
}

.report-cover {
  position: relative;
  width: 100%;
  height: 100%;
  border: 1px solid #11355b;
  border-radius: 14px;
  padding: 0.92rem 0.95rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  color: #dbeafe;
  background:
    radial-gradient(1200px 600px at 10% 95%, rgba(0, 190, 180, 0.17), transparent 45%),
    radial-gradient(780px 420px at 95% 5%, rgba(0, 140, 255, 0.2), transparent 40%),
    linear-gradient(180deg, #031222 0%, #041327 38%, #031429 100%);
}

.report-cover::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px),
    linear-gradient(180deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px);
  background-size: 26px 26px;
  opacity: 0.2;
}

.report-cover > * {
  position: relative;
  z-index: 1;
}

.report-cover-top {
  display: flex;
  justify-content: center;
  margin-bottom: 0.52rem;
}
.report-cover-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 94px;
  height: 94px;
  padding: 0.72rem;
  border: 1px solid rgba(76, 129, 214, 0.34);
  border-radius: 20px;
  background:
    radial-gradient(80px 56px at 34% 22%, rgba(16, 66, 150, 0.24), transparent 60%),
    linear-gradient(180deg, rgba(6, 24, 50, 0.94), rgba(5, 18, 38, 0.92));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 14px 26px rgba(2, 10, 24, 0.58);
}
.cover-logo-word {
  font-size: 1.92rem;
  line-height: 1;
  font-weight: 800;
  color: #f1f5f9;
  letter-spacing: 0.02em;
}
.cover-logo-image {
  width: 74px;
  height: auto;
  object-fit: contain;
  filter: brightness(0) invert(1) drop-shadow(0 2px 5px rgba(7, 12, 24, 0.35));
}
.cover-watermark {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  font-size: 4.6rem;
  font-weight: 700;
  color: rgba(46, 152, 255, 0.055);
  transform: rotate(-30deg) translateY(14mm);
  letter-spacing: 0.2rem;
  white-space: nowrap;
}

.logo-badge {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.92rem;
  font-weight: 800;
  color: #032018;
  background: linear-gradient(180deg, #22d3ee, #10b981);
}

.logo-word {
  font-size: 2.1rem;
  line-height: 1;
  font-weight: 800;
  color: #f8fafc;
}

.report-cover-title {
  margin: 0.28rem 0 0;
  text-align: center;
  color: #f8fafc;
  font-size: 3rem;
  line-height: 1.06;
  font-weight: 800;
}

.report-cover-subtitle {
  margin: 0.08rem 0 0;
  text-align: center;
  color: #22d3a6;
  font-size: 1rem;
  font-weight: 700;
}

.report-cover-meta {
  margin: 0.08rem 0 0;
  text-align: center;
  color: #7ea9d9;
  font-size: 0.66rem;
  font-weight: 500;
}

.section-chip {
  display: table;
  margin: 0.36rem auto 0;
  padding: 0.16rem 0.72rem;
  border-radius: 999px;
  border: 1px solid rgba(34, 197, 94, 0.52);
  color: #56f3b1;
  background: rgba(10, 90, 62, 0.34);
  font-size: 0.66rem;
  font-weight: 700;
}

.section-chip.secondary {
  margin-top: 0.34rem;
  border-color: rgba(129, 140, 248, 0.55);
  color: #d7d4ff;
  background: rgba(70, 61, 146, 0.26);
}

.section-chip.tertiary {
  margin-top: 0.28rem;
}

.report-cover-main {
  margin-top: 0.28rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.report-cover-intro {
  border: 1px solid rgba(56, 189, 248, 0.32);
  border-radius: 10px;
  padding: 0.72rem 0.82rem;
  text-align: center;
  color: #e2e8f0;
  font-size: 0.82rem;
  line-height: 1.6;
  background: rgba(4, 20, 42, 0.6);
}

.report-services {
  margin-top: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.service-card {
  border: 1px solid rgba(58, 130, 246, 0.28);
  border-radius: 9px;
  padding: 0.62rem 0.65rem;
  background: rgba(3, 19, 40, 0.54);
}

.service-card h3 {
  margin: 0 0 0.18rem;
  color: #e3eeff;
  font-size: 0.88rem;
  font-weight: 700;
}

.service-card .icon {
  font-size: 0.72rem;
  vertical-align: middle;
}

.service-card p {
  margin: 0;
  color: #9ac3ee;
  font-size: 0.72rem;
  line-height: 1.48;
}

.report-stats {
  margin-top: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
}

.stat-card {
  border: 1px solid rgba(56, 189, 248, 0.26);
  border-radius: 9px;
  padding: 0.65rem 0.3rem 0.6rem;
  text-align: center;
  background: rgba(4, 21, 43, 0.56);
}

.stat-card strong {
  display: block;
  font-size: 2.2rem;
  line-height: 1;
  font-weight: 800;
}

.stat-card span {
  display: block;
  margin-top: 0.07rem;
  font-size: 0.6rem;
  color: #b8d2f0;
}

.green { color: #22c55e; }
.blue { color: #38bdf8; }
.violet { color: #a78bfa; }
.amber { color: #f59e0b; }

.report-welcome {
  margin-top: 0;
  border: 1px solid rgba(56, 189, 248, 0.31);
  border-radius: 10px;
  padding: 0.75rem 0.82rem;
  background: rgba(4, 24, 46, 0.58);
}

.report-welcome h2 {
  margin: 0 0 0.2rem;
  color: #7de7ff;
  font-size: 1.08rem;
  font-weight: 800;
}

.report-welcome p {
  margin: 0;
  color: #d3e4f8;
  font-size: 0.8rem;
  line-height: 1.55;
}

.report-benefits {
  margin-top: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}

.benefit-card {
  border: 1px solid rgba(56, 189, 248, 0.24);
  border-radius: 9px;
  padding: 0.65rem 0.72rem;
  background: rgba(4, 20, 42, 0.53);
}

.benefit-card h3 {
  margin: 0 0 0.18rem;
  color: #e1f0ff;
  font-size: 0.86rem;
  font-weight: 700;
}

.benefit-card p {
  margin: 0;
  color: #9dc0e3;
  font-size: 0.72rem;
  line-height: 1.5;
}

.report-steps {
  margin-top: 0.3rem;
  padding-top: 0.3rem;
}

.report-steps-line {
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, #22c55e, #38bdf8, #a78bfa, #f59e0b);
}

.report-steps-grid {
  margin-top: 0.3rem;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.34rem;
}

.report-step {
  text-align: center;
}

.step-no {
  width: 1.38rem;
  height: 1.38rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  margin: 0 auto 0.2rem;
  color: #0f172a;
  font-size: 0.74rem;
  font-weight: 800;
  background: #67e8f9;
}

.report-step h3 {
  margin: 0;
  color: #eff7ff;
  font-size: 0.8rem;
  font-weight: 700;
}

.report-step p {
  margin: 0.08rem 0 0;
  color: #9ec1e7;
  font-size: 0.68rem;
}

/* ═══════════════════════════════════════════════════════════════ PAGE 2 */

.report-page {
  width: 190mm;
  min-height: 277mm;
  height: 277mm;
  overflow: hidden;
  break-before: page;
  page-break-before: always;
  break-inside: avoid;
  page-break-inside: avoid;
}

.report-page-inner {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid #11355b;
  border-radius: 14px;
  padding: 0.85rem 0.95rem;
  overflow: hidden;
  color: #dbeafe;
  background:
    radial-gradient(900px 500px at 5% 10%, rgba(0, 140, 255, 0.14), transparent 50%),
    radial-gradient(700px 400px at 95% 90%, rgba(0, 190, 180, 0.12), transparent 50%),
    linear-gradient(180deg, #031222 0%, #041327 50%, #031429 100%);
  position: relative;
}

.report-page-inner::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px),
    linear-gradient(180deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px);
  background-size: 26px 26px;
  opacity: 0.18;
  border-radius: 14px;
}

.report-page-inner > * { position: relative; z-index: 1; }

/* — Page Header — */
.page-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid rgba(56, 189, 248, 0.2);
  margin-bottom: 0.7rem;
}

/* Unified analysis header from page 3 onward */
.analysis-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  direction: rtl;
  gap: 0.7rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(56, 189, 248, 0.22);
  margin-bottom: 0.6rem;
}

.analysis-page-header-right {
  flex: 1;
  min-width: 0;
}

.analysis-page-header-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.analysis-page-header-accent {
  width: 0.18rem;
  height: 2rem;
  border-radius: 999px;
  background: linear-gradient(180deg, #c4b5fd 0%, #8b5cf6 100%);
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.55);
  flex-shrink: 0;
}

.analysis-page-header-copy h2 {
  margin: 0;
  color: #f4f8ff;
  font-size: 1.22rem;
  line-height: 1.12;
  font-weight: 900;
  font-family: var(--report-font-family-display-ar);
}

.analysis-page-header-copy p {
  margin: 0.12rem 0 0;
  color: #82abd7;
  font-size: 0.66rem;
  font-weight: 500;
  font-family: var(--report-font-family);
}

.analysis-page-header-left {
  display: flex;
  align-items: center;
  gap: 0.42rem;
  direction: ltr;
  flex-shrink: 0;
}

.analysis-page-header-client {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.08rem;
  text-align: left;
}

.analysis-page-header-client strong {
  margin: 0;
  color: #ecf6ff;
  font-size: 0.88rem;
  font-weight: 800;
  line-height: 1.1;
  font-family: var(--report-font-family-display-mix);
}

.analysis-page-header-client span {
  color: #628bb8;
  font-size: 0.56rem;
  font-weight: 500;
  font-family: var(--report-font-family);
}

.analysis-page-header-logo {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(74, 124, 208, 0.38);
  display: grid;
  place-items: center;
  background:
    radial-gradient(30px 20px at 30% 20%, rgba(16, 66, 150, 0.24), transparent 60%),
    linear-gradient(180deg, rgba(9, 28, 54, 0.96), rgba(7, 22, 42, 0.94));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 6px 11px rgba(2, 10, 24, 0.44);
}

.analysis-page-header-logo-image {
  width: 23px;
  height: auto;
  object-fit: contain;
  filter: brightness(0) invert(1) drop-shadow(0 2px 4px rgba(7, 12, 24, 0.35));
}

.analysis-page-header-logo-word {
  color: #f8fafc;
  font-size: 0.84rem;
  font-weight: 800;
  font-family: var(--report-font-family-display-ar);
}

/* Cover page header overrides */
.cover-page-header {
  margin-bottom: 0.5rem;
  border-bottom-color: rgba(56, 189, 248, 0.15);
  justify-content: space-between;
  align-items: center;
  direction: ltr;
}
.cover-header-date {
  min-width: 5.6rem;
  color: #80a9d8;
  font-size: 0.7rem;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}
.cover-header-meta {
  direction: rtl;
}
.cover-header-dots {
  display: flex;
  align-items: center;
  gap: 0.38rem;
  flex-shrink: 0;
  direction: ltr;
}
.cover-dot {
  width: 0.58rem;
  height: 0.58rem;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.45);
}
.dot-blue  { background: #3b82f6; }
.dot-cyan  { background: #22d3ee; }
.dot-green { background: #22c55e; }

.page-header-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid rgba(46, 114, 214, 0.45);
  border-radius: 10px;
  padding: 0.3rem 0.65rem;
  background: rgba(8, 26, 54, 0.72);
  flex-shrink: 0;
}

.page-header-logo .logo-word {
  font-size: 1.2rem;
  line-height: 1;
  font-weight: 800;
  color: #f8fafc;
}

.page-header-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
}

.page-header-client {
  color: #f1f5f9;
  font-size: 0.98rem;
  font-weight: 700;
}

.page-header-label {
  color: #7ea9d9;
  font-size: 0.68rem;
  font-weight: 500;
}

.page-score-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid rgba(34, 211, 238, 0.4);
  border-radius: 10px;
  padding: 0.3rem 0.7rem;
  background: rgba(4, 26, 52, 0.7);
  flex-shrink: 0;
}

.page-score-value {
  color: #22d3ee;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
}

.page-score-label {
  color: #7ea9d9;
  font-size: 0.55rem;
  margin-top: 0.1rem;
}

/* Intro Page - Exact Replica */
.intro-v3-page-inner {
  padding: 0;
  position: relative;
  overflow: hidden;
  font-family: var(--report-font-family-display-ar);
}

.intro-v3-page-inner::after {
  content: "مكسب لخدمات الاعمال";
  position: absolute;
  right: 15%;
  bottom: 0.7rem;
  transform: rotate(-31deg);
  color: rgba(20, 130, 120, 0.14);
  font-size: 3.3rem;
  font-weight: 800;
  letter-spacing: 0.08rem;
  pointer-events: none;
  z-index: 0;
}

.intro-v3-page-inner > * {
  position: relative;
  z-index: 1;
}

.intro-v3-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  direction: ltr;
  gap: 0.68rem;
  padding: 0.64rem 1rem 0.56rem;
  border-bottom: 1px solid rgba(56, 189, 248, 0.18);
}

.intro-v3-date-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.22rem;
  min-width: 8.2rem;
}

.intro-v3-date-label {
  color: #6fa0d1;
  font-size: 0.55rem;
  font-weight: 600;
}

.intro-v3-date-value {
  color: #eaf3ff;
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1.1;
  font-family: var(--report-font-family-display-mix);
}

.intro-v3-priority-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.18rem 0.48rem;
  color: #22c55e;
  font-size: 0.55rem;
  font-weight: 700;
  border: 1px solid rgba(34, 197, 94, 0.6);
  background: rgba(7, 42, 33, 0.82);
}

.intro-v3-brand-block {
  display: flex;
  align-items: center;
  gap: 0.48rem;
  direction: ltr;
  margin-left: auto;
}

.intro-v3-brand-copy {
  text-align: right;
  order: 1;
}

.intro-v3-brand-copy h2 {
  margin: 0;
  color: #f6fbff;
  font-size: 1.05rem;
  font-weight: 900;
  line-height: 1.12;
  font-family: var(--report-font-family-display-ar);
}

.intro-v3-brand-copy p {
  margin: 0.1rem 0 0;
  color: #7da5d2;
  font-size: 0.55rem;
  font-family: var(--report-font-family);
}

.intro-v3-brand-logo {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(74, 124, 208, 0.34);
  display: grid;
  place-items: center;
  order: 2;
  background:
    radial-gradient(40px 28px at 30% 20%, rgba(16, 66, 150, 0.22), transparent 60%),
    linear-gradient(180deg, rgba(9, 28, 54, 0.95), rgba(7, 22, 42, 0.94));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 8px 14px rgba(2, 10, 24, 0.48);
}

.intro-v3-brand-logo-image {
  width: 31px;
  height: auto;
  object-fit: contain;
  filter: brightness(0) invert(1) drop-shadow(0 2px 4px rgba(7, 12, 24, 0.35));
}

.intro-v3-brand-logo-word {
  color: #f8fafc;
  font-size: 0.8rem;
  font-weight: 800;
  font-family: var(--report-font-family-display-ar);
}

.intro-v3-hero {
  text-align: center;
  padding: 0.72rem 1rem 0.45rem;
}

.intro-v3-kicker {
  margin: 0;
  color: #6d95bf;
  font-size: 0.65rem;
  font-weight: 700;
  font-family: var(--report-font-family);
}

.intro-v3-client-name {
  margin: 0.34rem 0 0.2rem;
  color: #f7fbff;
  font-size: 1.8rem;
  font-weight: 800;
  line-height: 1.1;
  font-family: var(--report-font-family-display-mix);
  letter-spacing: 0.01em;
}

.intro-v3-client-meta {
  margin: 0;
  color: #7ea5d0;
  font-size: 0.7rem;
  font-family: var(--report-font-family-display-mix);
}

.intro-v3-analysis-chip {
  margin-top: 0.52rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  border: 1px solid rgba(34, 197, 94, 0.4);
  background: rgba(6, 45, 35, 0.72);
  color: #22c55e;
  font-size: 0.62rem;
  font-weight: 700;
  padding: 0.28rem 0.65rem;
  font-family: var(--report-font-family-display-ar);
}

.intro-v3-chip-dot {
  width: 0.44rem;
  height: 0.44rem;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 7px rgba(34, 197, 94, 0.55);
}

.intro-v3-metrics-section {
  padding: 0.18rem 1rem 0.38rem;
}

.intro-v3-section-title {
  margin: 0 0 0.4rem;
  text-align: center;
  color: #5f89b7;
  font-size: 0.65rem;
  font-weight: 700;
  font-family: var(--report-font-family);
}

.intro-v3-metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.46rem;
}

.intro-v3-metric-card {
  border: 1px solid rgba(62, 95, 146, 0.45);
  border-radius: 12px;
  background: rgba(7, 21, 43, 0.66);
  padding: 0.5rem 0.35rem 0.45rem;
  text-align: center;
  min-height: 58px;
  position: relative;
}

.intro-v3-metric-card::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0.1rem;
  left: 0.1rem;
  height: 2px;
  border-radius: 999px;
}

.intro-v3-metric-card strong {
  display: block;
  font-size: 1.35rem;
  line-height: 1;
  font-weight: 800;
  font-family: var(--report-font-family-display-mix);
}

.intro-v3-metric-card span {
  display: block;
  margin-top: 0.22rem;
  color: #dbeafe;
  font-size: 0.62rem;
  font-weight: 700;
  font-family: var(--report-font-family-display-ar);
}

.intro-v3-metric-card small {
  display: block;
  margin-top: 0.11rem;
  color: #5e84ad;
  font-size: 0.5rem;
  font-family: var(--report-font-family-display-mix);
}

.intro-v3-metric-card.accent-violet strong { color: #a78bfa; }
.intro-v3-metric-card.accent-violet::before { background: linear-gradient(90deg, #a78bfa, #8b5cf6); }
.intro-v3-metric-card.accent-blue strong { color: #0ea5e9; }
.intro-v3-metric-card.accent-blue::before { background: linear-gradient(90deg, #06b6d4, #3b82f6); }
.intro-v3-metric-card.accent-green strong { color: #22c55e; }
.intro-v3-metric-card.accent-green::before { background: linear-gradient(90deg, #22c55e, #10b981); }
.intro-v3-metric-card.accent-teal strong { color: #22c55e; }
.intro-v3-metric-card.accent-teal::before { background: linear-gradient(90deg, #10b981, #22d3ee); }

.intro-v3-platforms-row {
  padding: 0.26rem 1rem 0.54rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  justify-content: center;
}

.intro-v3-platform-chip {
  border-radius: 999px;
  padding: 0.18rem 0.45rem;
  font-size: 0.56rem;
  font-weight: 700;
  border: 1px solid transparent;
  font-family: var(--report-font-family-display-ar);
}

.intro-v3-platform-chip.ok {
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.48);
  background: rgba(6, 42, 33, 0.8);
}

.intro-v3-platform-chip.bad {
  color: #f43f5e;
  border-color: rgba(244, 63, 94, 0.55);
  background: rgba(52, 10, 24, 0.8);
}

.intro-v3-focus-card {
  margin: 0 1rem 0.95rem;
  border: 1px solid rgba(16, 185, 129, 0.45);
  border-radius: 16px;
  padding: 0.8rem 0.95rem 0.78rem;
  background:
    radial-gradient(520px 220px at 90% 10%, rgba(16, 185, 129, 0.12), transparent 70%),
    rgba(4, 26, 44, 0.76);
  text-align: right;
}

.intro-v3-focus-kicker {
  color: #34d399;
  font-size: 0.65rem;
  font-weight: 700;
  font-family: var(--report-font-family-display-ar);
}

.intro-v3-focus-card h3 {
  margin: 0.2rem 0 0.12rem;
  color: #f0f9ff;
  font-size: 1.05rem;
  font-weight: 800;
  font-family: var(--report-font-family-display-ar);
}

.intro-v3-focus-card p {
  margin: 0;
  color: #8eb1d9;
  font-size: 0.62rem;
  font-family: var(--report-font-family);
}

.intro-v3-focus-tags {
  margin-top: 0.52rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.38rem;
}

.intro-v3-tag-good,
.intro-v3-tag-warn {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.18rem 0.48rem;
  font-size: 0.56rem;
  font-weight: 700;
  font-family: var(--report-font-family-display-ar);
}

.intro-v3-tag-good {
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.42);
  background: rgba(6, 42, 33, 0.8);
}

.intro-v3-tag-warn {
  color: #fca5a5;
  border: 1px solid rgba(251, 113, 133, 0.45);
  background: rgba(66, 20, 28, 0.72);
}

/* — Screenshot Frame — */
.website-screenshot-wrap {
  flex-shrink: 0;
  margin-bottom: 0.7rem;
}

.website-screenshot-frame {
  position: relative;
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 10px;
  overflow: hidden;
  background: #060e1c;
}

.website-screenshot-url-bar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.32rem 0.6rem;
  background: rgba(4, 18, 38, 0.92);
  border-bottom: 1px solid rgba(56, 189, 248, 0.18);
}

.url-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  flex-shrink: 0;
}
.url-dot.r { background: #ef4444; }
.url-dot.y { background: #f59e0b; }
.url-dot.g { background: #22c55e; }

.url-text {
  color: #7ea9d9;
  font-size: 0.62rem;
  font-family: monospace;
  margin-right: auto;
  direction: ltr;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.website-screenshot-img {
  display: block;
  width: 100%;
  height: 90mm;
  object-fit: cover;
  object-position: top;
}

.website-screenshot-placeholder {
  width: 100%;
  height: 90mm;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(4, 18, 40, 0.8);
  color: #4b6a8a;
  font-size: 0.78rem;
}

/* — Summary Box — */
.website-summary-box {
  margin-bottom: 0.65rem;
  border: 1px solid rgba(56, 189, 248, 0.28);
  border-radius: 10px;
  padding: 0.6rem 0.75rem;
  background: rgba(4, 20, 42, 0.58);
  flex-shrink: 0;
}

.website-summary-text {
  margin: 0.35rem 0 0;
  color: #d3e4f8;
  font-size: 0.76rem;
  line-height: 1.6;
}

/* — Three Analysis Columns — */
.website-analysis-cols {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem;
  flex: 1;
  min-height: 0;
}

.wa-col {
  border-radius: 10px;
  padding: 0.6rem 0.65rem;
  border: 1px solid rgba(56, 189, 248, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.strengths-col   { background: rgba(6, 40, 24, 0.55); border-color: rgba(34, 197, 94, 0.25); }
.weaknesses-col  { background: rgba(40, 22, 6, 0.55); border-color: rgba(245, 158, 11, 0.28); }
.recommendations-col { background: rgba(8, 26, 54, 0.55); border-color: rgba(99, 102, 241, 0.28); }

.wa-col-title {
  margin: 0 0 0.45rem;
  font-size: 0.82rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: #e2eeff;
}

.strengths-col   .wa-col-title { color: #4ade80; }
.weaknesses-col  .wa-col-title { color: #fbbf24; }
.recommendations-col .wa-col-title { color: #a5b4fc; }

.wa-icon { font-size: 0.82rem; }

.wa-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  overflow: hidden;
}

.wa-list li {
  font-size: 0.7rem;
  line-height: 1.45;
  color: #c8ddf7;
  padding-right: 0.7rem;
  position: relative;
}

.wa-list li::before {
  content: "•";
  position: absolute;
  right: 0;
  top: 0;
  color: #56a9d9;
}

.strengths-col   .wa-list li::before { color: #4ade80; }
.weaknesses-col  .wa-list li::before { color: #fbbf24; }
.recommendations-col .wa-list li::before { color: #818cf8; }

.ltr { direction: ltr; }

/* ═══════════════════════════════════════════════════════════════ PAGE 3 — SOCIAL */

.social-cols {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.social-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow: hidden;
  border: 1px solid rgba(56, 189, 248, 0.18);
  border-radius: 12px;
  padding: 0.6rem;
  background: rgba(4, 18, 40, 0.38);
}

/* — Platform col header — */
.social-col-header {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.6rem;
  border-radius: 9px;
  flex-shrink: 0;
}

.facebook-header  { background: rgba(24, 58, 148, 0.35); border: 1px solid rgba(59, 89, 240, 0.35); }
.instagram-header { background: rgba(90, 30, 90, 0.35);  border: 1px solid rgba(200, 80, 200, 0.35); }

.social-icon { font-size: 0.95rem; }

.social-name {
  font-size: 0.92rem;
  font-weight: 700;
  color: #e8f0ff;
  flex: 1;
}

.social-score-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: #22d3ee;
  border: 1px solid rgba(34, 211, 238, 0.4);
  border-radius: 6px;
  padding: 0.1rem 0.45rem;
  background: rgba(4, 26, 52, 0.7);
  white-space: nowrap;
}

/* — Screenshot — */
.social-screenshot-frame {
  border: 1px solid rgba(56, 189, 248, 0.28);
  border-radius: 8px;
  overflow: hidden;
  background: #060e1c;
  flex-shrink: 0;
}

.social-screenshot-url-bar {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.5rem;
  background: rgba(4, 18, 38, 0.92);
  border-bottom: 1px solid rgba(56, 189, 248, 0.15);
}

.social-screenshot-frame .website-screenshot-img,
.social-screenshot-frame img {
  display: block;
  width: 100%;
  height: 52mm;
  object-fit: cover;
  object-position: top;
}

.social-screenshot-frame .website-screenshot-placeholder {
  height: 52mm;
}

/* — Summary — */
.social-summary-box {
  border: 1px solid rgba(56, 189, 248, 0.22);
  border-radius: 8px;
  padding: 0.45rem 0.55rem;
  background: rgba(4, 18, 40, 0.55);
  flex-shrink: 0;
}

.social-summary-text {
  margin: 0;
  color: #cddff5;
  font-size: 0.67rem;
  line-height: 1.55;
}

/* — Analysis blocks — */
.social-analysis {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.sa-block {
  border-radius: 8px;
  padding: 0.42rem 0.5rem;
  border: 1px solid rgba(56, 189, 248, 0.18);
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.sa-title {
  margin: 0 0 0.3rem;
  font-size: 0.72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.28rem;
  color: #e2eeff;
}

.strengths-col   .sa-title { color: #4ade80; }
.weaknesses-col  .sa-title { color: #fbbf24; }
.recommendations-col .sa-title { color: #a5b4fc; }

/* X & Snapchat header colors */
.x-header        { background: rgba(15, 15, 20, 0.55); border: 1px solid rgba(180, 180, 200, 0.28); }
.snapchat-header { background: rgba(60, 50, 0, 0.45);  border: 1px solid rgba(255, 220, 0, 0.35); }

/* ═══════════════════════════════════════════════════════════════ PAGE 5 */

.tiktok-header { background: rgba(15, 10, 25, 0.55); border: 1px solid rgba(255, 0, 88, 0.35); }

.p5-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.p5-cols.modified {
  grid-template-columns: 10fr 9fr;
  gap: 1.2rem;
  flex: 0 0 52%; /* Fix height to about half the page */
}

.p5-tiktok-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow: hidden;
  border: 1px solid rgba(56, 189, 248, 0.18);
  border-radius: 12px;
  padding: 0.6rem;
  background: rgba(4, 18, 40, 0.38);
}

.p5-nobg {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
}

.radar-header.no-border {
  border-bottom: none;
  padding-bottom: 0.2rem;
}

/* — Radar column — */
.p5-radar-col {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  overflow: hidden;
  border: 1px solid rgba(99, 102, 241, 0.28);
  border-radius: 12px;
  padding: 0.6rem;
  background: rgba(8, 12, 30, 0.5);
}

.radar-header {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding-bottom: 0.45rem;
  border-bottom: 1px solid rgba(99, 102, 241, 0.2);
  flex-shrink: 0;
}

.radar-icon { font-size: 0.95rem; }

.radar-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: #c7d2fe;
}

.radar-chart-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 2rem;
  overflow: hidden;
}

/* — Platform bars — */
.radar-platform-list {
  flex-shrink: 0;
  border: 1px solid rgba(56, 189, 248, 0.18);
  border-radius: 9px;
  padding: 0.55rem 0.65rem;
  background: rgba(4, 14, 34, 0.55);
}

.rpl-title {
  font-size: 0.72rem;
  font-weight: 700;
  color: #7ea9d9;
  margin-bottom: 0.4rem;
}

.rpl-grid {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.rpl-grid.modified {
  gap: 0.4rem;
}

.rpl-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.48rem 0.65rem;
  border-radius: 10px;
  background: rgba(4, 18, 40, 0.45);
}

.rpl-item.border-web { border: 1px solid rgba(16, 185, 129, 0.35); box-shadow: inset 0 0 10px rgba(16, 185, 129, 0.05); } 
.rpl-item.border-fb  { border: 1px solid rgba(59, 89, 240, 0.35); box-shadow: inset 0 0 10px rgba(59, 89, 240, 0.05); }
.rpl-item.border-ig  { border: 1px solid rgba(236, 72, 153, 0.35); box-shadow: inset 0 0 10px rgba(236, 72, 153, 0.05); } 
.rpl-item.border-tt  { border: 1px solid rgba(244, 63, 94, 0.35); box-shadow: inset 0 0 10px rgba(244, 63, 94, 0.05); }
.rpl-item.border-sc  { border: 1px solid rgba(234, 179, 8, 0.35); box-shadow: inset 0 0 10px rgba(234, 179, 8, 0.05); }
.rpl-item.border-x   { border: 1px solid rgba(56, 189, 248, 0.35); box-shadow: inset 0 0 10px rgba(56, 189, 248, 0.05); }
.rpl-item.border-li  { border: 1px solid rgba(10, 102, 194, 0.35); box-shadow: inset 0 0 10px rgba(10, 102, 194, 0.05); }

.border-web .rpl-score-box { color: #10b981; }
.border-fb .rpl-score-box { color: #60a5fa; }
.border-ig .rpl-score-box { color: #f59e0b; }
.border-tt .rpl-score-box { color: #f43f5e; }
.border-sc .rpl-score-box { color: #facc15; }
.border-x .rpl-score-box { color: #38bdf8; }
.border-li .rpl-score-box { color: #3b82f6; }

.rpl-score-box {
  display: flex;
  align-items: center;
  font-weight: 800;
  min-width: 3.5rem;
  direction: ltr;
  justify-content: flex-start;
}
.score-val { font-size: 0.82rem; text-align: center; width: 100%; white-space: nowrap; }
.score-max { display: none; }

.rpl-bar-col {
  flex: 1;
  display: flex;
  align-items: center;
}

.rpl-bar-wrap {
  flex: 1;
  height: 0.26rem;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 999px;
  overflow: hidden;
}

.rpl-bar {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: #22c55e;
  min-width: 2px;
}

.rpl-bar.web { background: #10b981; }
.rpl-bar.fb { background: #3b82f6; }
.rpl-bar.ig { background: linear-gradient(90deg, #f59e0b, #ec4899); }
.rpl-bar.x-bar { background: #38bdf8; }
.rpl-bar.sc { background: #facc15; }
.rpl-bar.tt { background: linear-gradient(90deg, #ff0058, #00f2ea); }
.rpl-bar.li { background: #0a66c2; }

.rpl-info-box {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: 5.5rem;
  justify-content: flex-end;
}
.rpl-text-stack {
  display: flex;
  flex-direction: column;
  text-align: right;
  flex: 1;
  min-width: 0;
}
.rpl-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #f1f5f9;
  white-space: nowrap;
}
.rpl-sub {
  font-size: 0.5rem;
  color: #64748b;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  direction: ltr;
  text-align: right;
}
.rpl-item-icon {
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.8rem;
  height: 1.8rem;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  flex-shrink: 0;
}

.rpl-score {
  font-size: 0.62rem;
  font-weight: 700;
  color: #64748b;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 3rem;
  text-align: left;
}

/* ═══════════════════════════════════════════════════════════════ PAGE 3 — ALL-SOCIAL GRID */

.social-all-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 0.42rem;
  flex: 1;
  min-height: 0;
}

.soc-card {
  border-radius: 9px;
  border: 1px solid rgba(56, 189, 248, 0.2);
  background: rgba(4, 18, 40, 0.38);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.soc-card-hd {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.28rem 0.42rem;
  flex-shrink: 0;
  border-radius: 9px 9px 0 0;
}

.soc-card-name {
  flex: 1;
  font-size: 0.74rem;
  font-weight: 700;
  color: #e8f0ff;
}

/* Screenshot area inside soc-card */
.soc-card-shot {
  flex-shrink: 0;
  position: relative;
  background: #060e1c;
  border-top: 1px solid rgba(56, 189, 248, 0.15);
  border-bottom: 1px solid rgba(56, 189, 248, 0.15);
  overflow: hidden;
}

.soc-card-shot .website-screenshot-img {
  display: block;
  width: 100%;
  height: 52mm;
  object-fit: cover;
  object-position: top;
}

.soc-card-shot .website-screenshot-placeholder {
  height: 52mm;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(4, 18, 40, 0.8);
  color: #4b6a8a;
  font-size: 0.65rem;
}

.soc-url-bar {
  display: flex;
  align-items: center;
  gap: 0.28rem;
  padding: 0.16rem 0.38rem;
  background: rgba(4, 18, 38, 0.95);
  border-top: 1px solid rgba(56, 189, 248, 0.12);
}

.soc-card-body {
  flex: 1;
  overflow: hidden;
  padding: 0.3rem 0.38rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.soc-summary {
  margin: 0;
  color: #9ec3e8;
  font-size: 0.64rem;
  line-height: 1.5;
  flex-shrink: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.soc-point-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.soc-point-item {
  margin: 0;
  padding: 0.26rem 0.34rem;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(7, 22, 44, 0.55);
  color: #d9e8f8;
  font-size: 0.58rem;
  line-height: 1.5;
}

.soc-point-label {
  display: inline-block;
  margin-inline-end: 0.22rem;
  font-weight: 700;
}

.soc-point-item.strengths .soc-point-label {
  color: #4ade80;
}

.soc-point-item.weaknesses .soc-point-label {
  color: #fbbf24;
}

.soc-point-item.recommendations .soc-point-label {
  color: #a5b4fc;
}

.soc-mini-cols {
  display: flex;
  gap: 0.22rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.soc-mini-block {
  flex: 1;
  border-radius: 5px;
  padding: 0.22rem 0.28rem;
  overflow: hidden;
}

.soc-mini-title {
  margin: 0 0 0.15rem;
  font-size: 0.54rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.15rem;
}

.soc-mini-block.strengths-col .soc-mini-title      { color: #4ade80; }
.soc-mini-block.weaknesses-col .soc-mini-title     { color: #fbbf24; }
.soc-mini-block.recommendations-col .soc-mini-title { color: #a5b4fc; }

.soc-mini-block .wa-list li { font-size: 0.54rem; line-height: 1.38; }

/* Platform-specific header colors */
.linkedin-header { background: rgba(10, 50, 100, 0.45); border: 1px solid rgba(10, 102, 194, 0.4); }

/* ═══════════════════════════════════════════════════════════════ PAGE 5 MARKETING SEASON */
.p5-mseason {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem; /* tight gap */
  margin-top: 0.2rem;
  overflow: hidden;
}

.ms-card {
  position: relative;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  padding: 0.4rem 0.6rem;
  background: rgba(4, 18, 40, 0.4);
  overflow: hidden;
}
.ms-card-bg-icon {
  position: absolute;
  top: 10%;
  left: 5%;
  font-size: 5rem;
  opacity: 0.04;
  pointer-events: none;
}
.ms-header-flex {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.4rem;
}
.ms-hero-icon {
  font-size: 1.8rem;
  background: #e0e7ff;
  border-radius: 8px;
  width: 2.8rem;
  height: 2.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}
.ms-hero-text {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.ms-hero-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.15rem;
}
.ms-date-pill {
  font-size: 0.55rem;
  color: #94a3b8;
  display: inline-flex;
}
.ms-info-pill {
  font-size: 0.5rem;
  color: #e2e8f0;
  background: rgba(255,255,255, 0.08);
  padding: 0.15rem 0.35rem;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255, 0.1);
}
.ms-season-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #ffffff;
}
.ms-invest-box {
  background: rgba(0, 0, 0, 0.25);
  border-right: 2px solid rgba(255, 255, 255, 0.2);
  padding: 0.3rem 0.4rem;
  margin-bottom: 0.4rem;
  border-radius: 4px 0 0 4px;
}
.ms-invest-box p {
  margin: 0;
  font-size: 0.55rem;
  color: #cbd5e1;
}

.ms-3cols {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.4rem;
}
.ms-mini-box {
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
  padding: 0.35rem 0.4rem;
  background: rgba(255, 255, 255, 0.02);
}
.ms-mc-title {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.2rem;
  font-size: 0.55rem;
  font-weight: 700;
  margin-bottom: 0.15rem;
}
.ms-title-cyan { color: #93c5fd; }
.ms-title-orange { color: #fdba74; }
.ms-title-yellow { color: #facc15; }
.ms-mc-desc {
  margin: 0;
  font-size: 0.45rem;
  color: #94a3b8;
  line-height: 1.4;
}

/* MID SECTION */
.ms-section-header {
  font-size: 0.6rem;
  font-weight: 700;
  color: #fb923c;
  margin: 0 0.4rem;
}
.ms-empty-box {
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 0.4rem;
  text-align: center;
  background: rgba(4, 18, 40, 0.3);
}
.ms-empty-box p {
  margin: 0;
  font-size: 0.55rem;
  color: #64748b;
}

/* BOTTOM SECTION */
.ms-plan {
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 12px;
  padding: 0.45rem 0.5rem;
  background: rgba(4, 18, 40, 0.4);
}
.ms-section-header-inline {
  font-size: 0.6rem;
  font-weight: 700;
  color: #7dd3fc;
  margin-bottom: 0.4rem;
}
.ms-month {
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 0.4rem;
  background: rgba(255,255,255,0.02);
  border-top-width: 2px;
}

.ms-month-title {
  font-size: 0.55rem;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 0.15rem;
  display: block;
}
.ms-month-desc {
  margin: 0;
  font-size: 0.45rem;
  color: #94a3b8;
  line-height: 1.45;
}
.ms-priority-banner {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.4rem;
  padding: 0.35rem 0.5rem;
  border-radius: 8px;
  background: rgba(250, 204, 21, 0.05);
  border: 1px solid rgba(250, 204, 21, 0.15);
}
.ms-pb-icon { font-size: 0.7rem; }
.ms-pb-text { font-size: 0.48rem; color: #cbd5e1; }
.ms-pb-text strong { color: #facc15; }
.ms-yellow-txt { color: #fef08a; font-weight: 600; }

/* CTA ROW */
.ms-cta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 12px;
  padding: 0.4rem 0.6rem;
  background: rgba(4, 18, 40, 0.4);
}
.ms-cta-text h3 {
  margin: 0 0 0.15rem 0;
  font-size: 0.65rem;
  color: #f1f5f9;
}
.ms-cta-text p {
  margin: 0;
  font-size: 0.48rem;
  color: #94a3b8;
}
.ms-cta-btn {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(90deg, #10b981, #34d399);
  padding: 0.3rem 0.9rem;
  border-radius: 999px;
  color: #022c22;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
}
.ms-cta-title { font-size: 0.65rem; font-weight: 800; }
.ms-cta-sub { font-size: 0.42rem; font-weight: 600; opacity: 0.9; }

/* ═══════════════════════════════════════════════════════════════ PAGE 6 CTA PAGE */
.cta-final-page {
  display: flex;
  flex-direction: column;
}
.cta-page-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0.9rem;
}
.cta-badge-card {
  display: flex;
  align-items: center;
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 12px;
  padding: 0.6rem 0.9rem;
  background: rgba(4, 18, 40, 0.5);
  margin-top: 0.2rem;
}
.cta-badge-icon {
  font-size: 1.6rem;
  background: rgba(251, 191, 36, 0.12);
  padding: 0.35rem;
  border-radius: 10px;
  border: 1px solid rgba(251, 191, 36, 0.3);
  margin-left: 0.8rem;
}
.cta-badge-content {
  flex: 1;
}
.cta-badge-content h3 {
  margin: 0;
  font-size: 0.88rem;
  color: #f8fafc;
  font-weight: 800;
  font-family: var(--report-font-family-display-ar);
}
.cta-badge-content span {
  font-size: 0.58rem;
  color: #94a3b8;
  font-family: var(--report-font-family-display-mix);
}
.cta-badge-meta {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  direction: ltr; /* keep left-to-right for dividers */
}
.cta-meta-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* since direction is ltr */
}
.cta-meta-item .lbl {
  font-size: 0.5rem;
  color: #94a3b8;
  font-family: var(--report-font-family-display-ar);
}
.cta-meta-item .val {
  font-size: 0.68rem;
  color: #e2e8f0;
  font-weight: 700;
  font-family: var(--report-font-family-display-mix);
  white-space: nowrap;
}
.cta-meta-divider {
  width: 1px;
  height: 1.6rem;
  background: rgba(255,255,255,0.12);
}

.cta-hero-card {
  position: relative;
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 12px;
  padding: 1.8rem 1.4rem 1.6rem;
  background: rgba(4, 18, 40, 0.6);
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  box-shadow: 0 10px 40px rgba(16, 185, 129, 0.05);
  overflow: hidden;
}
.cta-hero-glow {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.6), rgba(16, 185, 129, 0.8), rgba(99, 102, 241, 0.6));
  border-radius: 10px 10px 0 0;
}
.cta-hero-title {
  margin: 0 0 0.5rem;
  font-size: 1.35rem;
  font-weight: 900;
  color: #f8fafc;
  font-family: var(--report-font-family-display-ar);
}
.cta-hero-desc {
  margin: 0;
  font-size: 0.72rem;
  color: #cbd5e1;
  max-width: 82%;
  line-height: 1.6;
}

.cta-steps-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  width: 95%;
  margin-top: 2rem;
}
.cta-step {
  background: rgba(255,255,255, 0.03);
  border: 1px solid rgba(255,255,255, 0.06);
  border-radius: 10px;
  padding: 1.1rem 0.6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cta-step-circle {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #10b981;
  font-size: 0.95rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  font-family: var(--report-font-family-display-mix);
  line-height: 1;
}
.cta-step-title {
  font-size: 0.78rem;
  font-weight: 800;
  color: #e2e8f0;
  margin-bottom: 0.25rem;
  font-family: var(--report-font-family-display-ar);
}
.cta-step-desc {
  margin: 0;
  font-size: 0.58rem;
  color: #94a3b8;
}

.cta-btn-wrap {
  margin-top: 2.8rem;
}
.cta-pulse-btn {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(90deg, #10b981, #059669);
  padding: 0.75rem 2.5rem;
  border-radius: 999px;
  color: #f0fdf4;
  font-size: 0.95rem;
  font-weight: 800;
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  font-family: var(--report-font-family-display-ar);
}
.cta-btn-icon {
  font-size: 1.25rem;
  margin-left: 0.2rem;
}
.cta-pulse-btn small {
  font-size: 0.55rem;
  font-weight: 500;
  opacity: 0.85;
  margin-top: 0.15rem;
}

.cta-footer-grid-2col {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border: 1px solid rgba(56, 189, 248, 0.15);
  border-radius: 12px;
  background: rgba(4, 18, 40, 0.4);
  margin-top: 1rem;
}
.cta-ft2-col {
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.cta-ft2-col.border-right {
  border-right: 1px solid rgba(255,255,255, 0.05); /* Right border for RTL */
}
.cta-ft2-header {
  display: flex;
  align-items: center;
  font-size: 0.65rem;
  color: #94a3b8;
  margin-bottom: 0.15rem;
  font-weight: 700;
  font-family: var(--report-font-family-display-ar);
}
.cta-ft2-icon {
  font-size: 0.95rem;
  margin-left: 0.35rem;
  color: #e879f9; /* Phone icon color fallback if not emoji */
}
.cta-ft2-line {
  font-size: 0.55rem;
  color: #cbd5e1;
  display: flex;
  align-items: center;
  font-family: var(--report-font-family-display-mix);
}
.cta-ft2-line strong {
  color: #94a3b8;
  font-weight: 700;
  margin-left: 0.35rem;
  min-width: 2.4rem;
}
.cta-disclaimer {
  margin-top: 0.5rem;
  padding: 0.5rem 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  font-size: 0.45rem;
  color: #475569;
  text-align: center;
  font-family: var(--report-font-family-display-ar);
  line-height: 1.5;
}
.cta-disclaimer strong {
  color: #64748b;
}
.ltr { direction: ltr; display: inline-block; font-family: var(--report-font-family-display-mix) !important; }
  `,
};

export class ReportTemplateProvider implements ReportTemplateRepositoryContract {
  async getTemplateByKey(templateKey: ReportTemplateKey): Promise<ReportTemplateDefinition | null> {
    if (templateKey !== ReportTemplateKey.DefaultClientReport) {
      return null;
    }

    return DEFAULT_TEMPLATE;
  }
}
