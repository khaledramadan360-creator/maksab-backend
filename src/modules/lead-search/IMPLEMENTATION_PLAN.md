# Lead Search Implementation Plan

تم تصميم هذه الخطة لتقسيم تنفيذ موديول `lead-search` إلى مراحل وخطوات واضحة، مع التركيز على بناء **Vertical Slice** يعمل بشكل كامل من البداية للنهاية قبل التوسع.

## 1. مراحل التنفيذ (Implementation Phases)
سيتم تنفيذ الموديول على 5 مراحل أساسية:
- **المرحلة 1: Core Infrastructure**: 
  - بناء Bright Data provider contracts wiring.
  - تنفيذ `SERP provider implementation`.
  - معالجات البيانات الأساسية: `url-normalizer`, `deduplicator`, `basic result filter`, `basic ranker`.
- **المرحلة 2: Query Building**:
  - قاموس الكلمات `bilingual query expansion dictionary`.
  - خدمة التوسيع `query expansion service`.
  - الـ Query builders لكل منصة.
- **المرحلة 3: Platform Services**:
  - إنشاء الـ Pipelines الفعلية (`website-search.service`, `facebook-search.service` ومثيلاتها).
- **المرحلة 4: Application Layer**:
  - بناء الـ Use case الأساسي `searchLeads`.
  - المنسق العام `platform orchestrator`.
  - محول المخرجات `output mapper`.
  - تجهيز الواجهة للعموم `facade wiring`.
- **المرحلة 5: Delivery Layer (مؤجلة)**:
  - ربط `API endpoint` والـ `request validation` وتجهيز `response mapping` لتشبك الموديول في التطبيق الأكبر.

## 2. أول Slice تنفيذي (First Vertical Slice)
تجنباً لتعقيد المعطيات دفعة واحدة، سنبدأ بتنفيذ شريحة رأسية كاملة على منصتين فقط:
- **Website**
- **LinkedIn**

**لماذا؟** 
Website يمثل البحث العام الأبسط، و LinkedIn يمثل البحث المتقدم المحكوم بقواعد الـ Profiles وهو الأهم تجارياً. تشغيل الشريحة عليهما يكفي لإثبات كفاءة (query builder, SERP fetch, normalize, dedupe, filter, ranking, final output).

## 3. ملفات التنفيذ الأولى (Starting Files)
هذه الملفات ستكون هدف الشريحة الرأسية الأولى:
- `infrastructure/providers/brightdata-serp.provider.ts`
- `infrastructure/query-builders/base-query-expansion.dictionary.ts`
- `infrastructure/query-builders/website-query-builder.ts`
- `infrastructure/query-builders/linkedin-query-builder.ts`
- `infrastructure/normalizers/url-normalizer.ts`
- `infrastructure/deduplicators/result-deduplicator.ts`
- `infrastructure/filters/platform-url.filter.ts`
- `infrastructure/filters/client-only-result.filter.ts`
- `infrastructure/filters/relevance-result.filter.ts`
- `infrastructure/rankers/relevance-ranker.ts`
- `infrastructure/platform-services/website-search.service.ts`
- `infrastructure/platform-services/linkedin-search.service.ts`
- `application/services/query-expansion.service.ts`
- `application/services/platform-selection.service.ts`
- `application/services/platform-search-orchestrator.service.ts`
- `application/services/candidate-selection.service.ts`
- `application/mappers/search-output.mapper.ts`
- `application/use-cases/search-leads/search-leads.use-case.ts`

## 4. تبعيات التنفيذ الأول (Actual Dependencies)
- `brightdata-serp.provider.ts`: يعتمد كلياً على `Bright Data API key`، عميل HTTP (مثل Axios أو Fetch)، و Response parser بسيط.
- `Query builders`: تعتمد على الـ `query expansion service`، قواعد المدن واللغات `city/language rules`، وأنماط الروابط للمنصات `platform pattern rules`.
- `Platform services`: تعتمد على الـ Query builder، مزود البحث (Search Provider)، أدوات التصفية والترتيب (normalizer, filters, deduplicator, ranker).
- `searchLeads`: تعتمد على `platform selection service`، المنسق `platform orchestrator`، و `output mapper`.

## 5. المؤجل عن مرحلة الإطلاق الأولى (Out of Scope for First Slice)
حفاظاً على التركيز وسرعة الإنجاز، يُؤجل العمل على الآتي حالياً:
- تنفيذ الـ Social Scraper والـ Web Unlocker.
- تطبيق جميع المنصات السبع (نكتفي بـ 2 فقط).
- التعامل مع Advanced Logging أو Caching للنتائج.
- آلية Retry/Backoff الفعلي أو Rate Limiting التلقائي.
- الحفظ والتخزين `Persistence` (Save to clients).
- الـ API endpoint و Auth integration.
- الـ Metrics, Monitoring.
*(سنبدأ بصيغة بسيطة تكتفي بالبحث المباشر عبر SERP واختبار التنقية والترتيب).*

## 6. معيار النجاح الأدنى (Minimal Working Output)
يُعتبر هذا الجزء مكتملاً عندما نتمكن من تشغيل `searchLeads` بكفاءة على:
- Website و LinkedIn
- إدخال مدخلات قياسية (Keyword, saudiCity, platforms=[website, linkedin], requestedCount).
- استلام كائن `LeadSearchOutput` ناجح وصحيح، يحتوي النتائج منظمة لكل منصة مفردة مع الأرقام (requestedCount, returnedCount) والتحذير `warning` عند حدوثه.

## 7. ترتيب التنفيذ الفعلي بدقة (Implementation Order)
لا يجوز القفز بين المراحل، الترتيب القطعي هو كالآتي:
- **المرحلة A**: (بناء الكلمات المساعدة)
  - `base-query-expansion.dictionary.ts`
  - `query-expansion.service.ts`
- **المرحلة B**: (المزود)
  - `brightdata-serp.provider.ts`
- **المرحلة C**: (التنظيف والتخلص من المكرر)
  - `url-normalizer.ts`
  - `result-deduplicator.ts`
- **المرحلة D**: (التنقية الصارمة)
  - `platform-url.filter.ts`
  - `client-only-result.filter.ts`
  - `relevance-result.filter.ts`
- **المرحلة E**: (الترتيب)
  - `relevance-ranker.ts`
- **المرحلة F**: (بناء الـ Queries الفعلية للشريحة الأولى)
  - `website-query-builder.ts`
  - `linkedin-query-builder.ts`
- **المرحلة G**: (الخدمات المنصية - تجميع المراحل السابقة)
  - `website-search.service.ts`
  - `linkedin-search.service.ts`
- **المرحلة H**: (طبقة الإدارة)
  - `platform-search-orchestrator.service.ts`
- **المرحلة I**: (إخراج النتائج)
  - `search-output.mapper.ts`
- **المرحلة J**: (تغليف الموديول)
  - `searchLeads` use case
  - public facade

## 8. خطة الاختبار لأول شريحة (First Slice Testing Plan)
سنختبر الحالات التالية للتأكد من الصلابة:
- إدخال Keyword باللغة العربية.
- إدخال Keyword باللغة الإنجليزية.
- تمرير مدينة افتراضية `Default` مقابل تمرير مدينة مخصصة `Custom`.
- طلب 10 نتائج `requestedCount = 10`.
- اختبار باختيار منصة واحدة، ثم منصتين في نفس الطلب.
- معالجة نقص النتائج (Zero / Insufficient results).
- التحقق من قيام الموديول بحذف الرابط المكرر آليًا.
- التحقق من استبعاد صفحات Content Pages بشكل كامل من المخرج.

## 9. إعدادات البيئة المؤجلة المطلوبة لاحقاً (Config Needed)
مستقبلاً سنضيف للمتغيرات `.env` القيم التالية (ليست مطلوبة في هذه اللحظة):
- `BRIGHTDATA_API_KEY`
- `BRIGHTDATA_SERP_ENDPOINT`
- `DEFAULT_COUNTRY=SA`
- `DEFAULT_SAUDI_CITY=Riyadh`
- `DEFAULT_LANGUAGE=ar`
- `OVERSAMPLING_SETTINGS`
- `PLATFORM_BATCH_SIZES`

## 10. حدود قاطعة في عمل الموديول (Strict Boundary: No Saving)
- الموديول يُرجِّع المخرجات بصيغة `save-ready output` لكن الموديول **لا ولن يقوم بأي عملية حفظ أو اتصال بقاعدة البيانات** للعملاء. عملية الحفظ متروكة كلياً للموديول الخاص بالعملاء في المستقبل.
