# Lead Search Module Architecture

## 1. مسؤولية كل طبقة (Layer Responsibilities)

### public/
- الواجهة الوحيدة التي يمكن لباقي الموديولات استخدامها.
- طبقة Minimal جدًا تحتوي فقط على الـ Facade والـ Types المطلوبة. لا يُسمح بكشف المكونات الداخلية.

### application/
- مسؤول عن:
  - Orchestration (تنسيق العمليات).
  - تنفيذ Use cases الأساسية كـ `searchLeads`.
  - تعريف Input/Output DTOs لمعالجة البيانات.
  - تطبيق الـ Flow العام للموديول بين المنصات وتنسيق العمليات.

### domain/
- مسؤول عن:
  - اللغة الأساسية للموديول (Ubiquitous Language).
  - القواعد العامة (Search Rules).
  - الأنواع والهياكل (Entities & Enums).
  - العقود المجردة (Contracts/Repositories interfaces).
  - Business decisions العامة التي لا تتأثر بجهة خارجية.

### infrastructure/
- مسؤول عن:
  - التنفيذ الفعلي لعملاء مزودي الخدمات (Bright Data Clients).
  - Query Builders الفعلية الخاصة بكل منصة.
  - Result Collectors & Parsers.
  - Normalizers (تنظيف الروابط وتوحيدها).
  - Deduplicators (إزالة التكرار للروابط).
  - Filters (تطبيق شروط العميل المحتمل وغيرها).
  - Rankers (إعطاء الدرجات للترتيب).
  - Provider-specific logic بالكامل.

## 2. اتجاه الاعتمادية (Dependency Direction)

قواعد الاعتمادية الصارمة للموديول:
- `public` -> يعتمد على -> `application` و `domain` (من أجل الـ types).
- `application` -> يعتمد على -> `domain` (قواعد وعقود).
- `infrastructure` -> يعتمد على -> `domain` (لتنفيذ العقود المحددة فيه).
- `index.ts` -> يعتمد على -> `public` فقط لتصديره.

**الممنوعات المطلقة:**
- **ممنوع**: `domain` يعتمد على `infrastructure` أو `application`.
- **ممنوع**: `application` يعتمد على API controllers أو مسارات التوجيه (لا يوجد API حالياً).
- **ممنوع**: `public` يعتمد على `infrastructure` مباشرة أو يستدعي أي Implementation.

## 3. الـ Use Case الرئيسي (Main Use Case)

الـ Use case الأساسي في هذا الموديول هو: **searchLeads**
- **وظيفته**: استلام `SearchRequest` وتوزيع مهام البحث على المنصات المختارة المحددة في الطلب.
- **التشغيل**: يشغل الـ Pipeline لكل منصة.
- **المخرجات (Search output integration readiness)**: تجميع الـ Output النهائي وتحويله عبر Mapper لإرجاع `LeadSearchOutput`.
  - نتائج البحث يجب أن تكون **display-ready**, **selection-ready**, و **save-ready for future clients module integration**.
  - هذا يعني أن الـ output لازم يحتوي على حقول منظمة داخل `CandidateResult` تكفي لاحقاً لعملية "Save to Clients List" دون أن يتكفل الموديول الحالي نفسه بالحفظ.

## 4. الـ Application Services المعرفة

- `PlatformSelectionService`: التحقق من أن المنصات المختارة مدعومة ومُناسبة للبحث بناءً على القواعد والأقاليم.
- `QueryExpansionService`: توليد الجمل البحثية بمرونة لدعم (العربية والإنجليزية) بناءً على Variants وقواعد ثابتة (لا يوجد الذكاء الاصطناعي).
- `PlatformSearchOrchestratorService`: **يُنسق فقط** ولا ينفذ التفاصيل بنفسه. يشغل المنصات المختارة ويجمع النتائج (Orchestration only).
- `CandidateSelectionService`: اختيار الفائزين، ترتيبهم، وتحديد القائمة النهائية المقبولة لكل منصة وتجاهل الفائض للحفاظ على الجودة المستهدفة.
- `SearchOutputMapper`: تجميع البيانات في كيان `LeadSearchOutput` المتماسك لتسليمه طبياً للواجهة الخارجية.

## 5. مكونات الـ Infrastructure التفصيلية

- **providers/**: التنفيذ الفعلي للـ Providers، مثل `brightdata-serp.provider.ts`.
- **query-builders/**: منشئي الـ Queries لكل منصة كـ `x-query-builder.ts`، و `linkedin-query-builder.ts`.
- **platform-services/**: تطبيق الـ Pipeline الخاص بالبحث في المنصة المحددة كـ `facebook-search.service.ts`.
- **normalizers/**: توحيد بنية الروابط عبر `url-normalizer.ts`.
- **deduplicators/**: إلغاء التكرار عبر `result-deduplicator.ts`.
- **filters/**: فلترة دقيقة كـ `client-only-result.filter.ts` لضمان أن النتيجة هي "عميل" وليست محتوى، مقال، ڤيديو الخ.
- **rankers/**: خوارزمية ترتيب النتائج بناءً على الثقل كـ `relevance-ranker.ts`.

## 6. مسار البحث الثابت لكل منصة (Platform Pipeline Rule)

**Platform service responsibility**: كل `platform-search.service.ts` مستقلة هي المالك والمُنفذ (Owner) الفعلي للـ Pipeline الخاصة بمنصتها، وتتبع الـ Flow الثابت والتسلسلي التالي حصرياً:
1. Build queries (تجهيز الكلمات)
2. Fetch raw results (جلب النتائج الخام)
3. Normalize URLs (توحيد الرابط)
4. Validate platform URLs (التحقق من مرجعية ونوع الصفحة)
5. Deduplicate (حذف المكرر)
6. Lightweight extraction (قراءة خفيفة للبيانات المرفقة)
7. Client-only filtering (فلترة العميل المحتمل وحذف المنشورات/المقالات)
8. Ranking (التقييم والوزن)
9. Continue until target or exhaustion (التوقف عند الهدف أو النفاذ)
10. Return platform result (إعادة الكيان المجمع الخاص بالمنصة)

## 7. مسؤوليات وموقع Bright Data

**قرار معماري استراتيجي:**
- **مكان التواجد**: Bright Data يعيش بشكل حصري في `infrastructure/providers/`.
- لا وجود له في `domain` أو `public` أو `application`.
- كافة طبقات الـ Application تعتمد دائماً على العقد المجرد `SearchProvider` الذي تم تعريفه في الـ `domain`.
- هذا الاستقلالية يتيح استبدال Bright Data مستقبلاً بحرية مطلقة دون الحاجة لإعادة كتابة منطق العمليات `Business Logic`.

**Bright Data provider priority (Fallback Policy)**:
تتبع الـ Providers التسلسل التالي بشكل صارم:
1. **SERP API first**: هو الأول للبحث العام.
2. **Social Scraper when needed**: يُستخدم للمنصات المدعومة لاحقاً.
3. **Web Unlocker as fallback only**: الملاذ الأخير ولا يستخدم كخيار افتراضي.

## 8. حدود الواجهات الخارجية (Facade & Index)

- `lead-search.facade.ts`: تمتلك الواجهة فقط `searchLeads(request)`.
- `index.ts`: تقتصر وظائفه على فتح واجهة الـ Facade وأنواع الـ DTO المطلوبة للخارج، ويحرم بشكل مطلق على Index تصدير تفاصيل Providers أو Query Builders.

## 9. المستثنى في هذه المرحلة (Out of Scope for Part 2)

لن يتم تنفيذ أو التدخل في التفاصيل الآتية في الوقت الحالي:
- تطبيق إعدادات أو مفاتيح Bright Data والأداء الفعلي للاتصالات.
- Express API و Routes الخاصة بالموديول و Controllers.
- الـ Persistence والتواصل الحقيقي مع قواعد البيانات Data.
- آليات الـ Caching وتخزين الردود المسبقة.
- معالجات الوظائف Background Jobs و الطوابير.
- منطق تكرار الفشل Retry/Backoff Mechanism.
- أدوات المراقبة وإحصاء الأداء Monitoring.
