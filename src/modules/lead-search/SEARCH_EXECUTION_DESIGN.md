# Search Execution Design Blueprint

هذه الوثيقة تمثل المرجع الأساسي والشامل لكيفية تنفيذ وتشغيل عمليات البحث داخل موديول `lead-search`. توضح الوثيقة التسلسل الدقيق للعمليات من لحظة استلام الطلب وحتى إرجاع النتيجة النهائية الجاهزة.

## 1. الـ Flow الرئيسي للـ Use Case (searchLeads)
الهدف من هذا الـ Flow هو تشغيل البحث بانسجام تام، تجميع النتائج، وإخراجها كـ `LeadSearchOutput` نظيف وقابل للحفظ.

**Input**: `SearchRequest` (keyword, country, saudiCity, platforms[], requestedResultsCount, language?)
**Output**: `LeadSearchOutput`

### خطوات التنفيذ (Step-by-Step):
- **Step 1: Normalize request**:
  - إذا لم يُمرر `country` يتم اعتباره افتراضياً `SA` (السعودية).
  - إذا لم تمرر `saudiCity` تُعتبر `Riyadh`.
  - التحقق من الـ `requestedResultsCount` (يجب أن يكون 10، 25، أو 50).
  - التحقق من قائمة المنصات المدعومة واستبعاد أي منصة غير مسموحة.
- **Step 2: Expand keyword**:
  - تجهيز نظائر للكلمة (Variants) باللغتين العربية والإنجليزية.
  - يعتمد على Expansion محدود ومسيطر عليه (Controlled Expansion)، **بدون استخدام AI**.
- **Step 3: Select platform services**:
  - تفعيل وتهيئة الـ Services الخاصة بالمنصات المختارة فقط.
- **Step 4: Execute platform search independently**:
  - تشغيل مسارات البحث المنصية بالتوازي (Parallel) أو المتتالية باستقلالية متطرفة (كل منصة في معزل).
  - **Failure Isolation**: إذا فشلت منصة كلياً، تستمر باقي المنصات ويرجع مسار المنصة الفاشلة كائن يعكس الفشل/التحذير.
- **Step 5: Aggregate results**:
  - تجميع الـ `PlatformSearchResult` العائدة من كل منصة.
- **Step 6: Build final output**:
  - توحيد النتيجة النهائية وإخراجها بـ Format محدد (`LeadSearchOutput`).

---

## 2. الـ Flow الفرعي لكل منصة (searchPlatformLeads)

**Input**: المنصة (Platform)، الطلب المنسق، الكلمات الموسعة (variants)، والعدد المطلوب.
**Output**: `PlatformSearchResult` (وتشمل النتائج وحالة اكتمالها).

### خطوات التنفيذ المنصي:
1. **Build platform queries**: بناء الجمل البحثية (Queries) المتناسبة والصحيحة للمنصة.
2. **Run search in batches**: تشغيل الـ Query عبر الـ Provider (مثل SERP API) على دفعات.
3. **Normalize URLs**: تنظيف وترتيب وإزالة التشوهات الملحقة بالروابط العائدة.
4. **Validate URL type**: التحقق من نوع الرابط؛ هل هو Profile أو Page صحيحة، وليس فيديو أو مقال؟
5. **Deduplicate**: إزالة أي الروابط المكررة لضمان تفرد النتائج (فرز على مستوى المنصة).
6. **Lightweight extraction**: استخراج البيانات الصافية من النتيجة (مثل `title`, `snippet`, `name/label`, `location`).
7. **Client-only filtering**: إخضاع النتيجة لسلسلة الفلاتر لرفض أي رابط لا يمتلك احتمالية أن يكون عميلاً.
8. **Relevance ranking**: تقييم ورصد علامة (Score) لكل نتيجة مُرشحة وترتيبها.
9. **Check target**: فحص العدد: إذا اكتمل العدد المطلوب (كـ 25) نتوقف (Stop). إذا كان أقل ننطلق لجلب الدفعة التالية (Batch 2 / Next Variant).
10. **Return platform result**: إرجاع الـ Array المقصوص/العالي التقييم مع حالة البحث.

---

## 3. هندسة توسيع الكلمات الرئيسية (Query Expansion Design)

بما أن النظام يعمل باللغتين العربية والإنجليزية بشكل تلقائي، فعملية التوسيع تعمل على 3 مستويات فقط ومحدودة جداً **بدون الذكاء الاصطناعي**:
- **A) Original Keyword**: النَص الأصلي المُدخل.
- **B) Cross-language Equivalent**: المُقابل في اللغة الأخرى (مترجم/مصطلح بديل عام).
- **C) Limited Synonyms**: مرادفات ضيقة للكلمة.

**أمثلة مرجعية**:
- **كلمة "عقارات"**: (Original: عقارات)، (Synonym: عقاري)، (Equivalent: Real Estate)، (Synonym Eng: Property).
- **كلمة "عيادة اسنان"**: (عيادة اسنان، عيادات اسنان، Dental Clinic، Dentist Clinic، Dental Center).

**قاعدة ذهبية**: ممنوع توليد عشرات المرادفات، يجب أن يكون الـ `max` الخاص بالتوسيع رقماً صغيراً جداً، لمنع استهلاك غير ضروري للموارد.

---

## 4. بناء الـ Queries المنصية (Query Building Rules)

الصيغة العامة والموحدة لبناء الـ Query:
`[site restriction] "[keyword variant]" "[saudiCity]" "Saudi Arabia"`

طُرق بناء الـ Queries المعتمدة:
- **LinkedIn**: `site:linkedin.com/in/ "<keyword>" "<city>" "Saudi Arabia"`
- **Instagram**: `site:instagram.com "<keyword>" "<city>" "Saudi Arabia"`
- **Facebook**: `site:facebook.com "<keyword>" "<city>" "Saudi Arabia"`
- **X**: `site:x.com "<keyword>" "<city>" "Saudi Arabia"` أو `site:twitter.com ...`
- **TikTok**: `site:tiktok.com "<keyword>" "<city>" "Saudi Arabia"`
- **Snapchat**: `site:snapchat.com "<keyword>" "<city>" "Saudi Arabia"`
- **Website**: `"<keyword>" "<city>" "Saudi Arabia"` (بدون تضييق بـ site).

---

## 5. قواعد تحقق الروابط (URL Validation Rules)

ضمان جلب "عملاء فقط"، يتم رفض محتوى الـ Content:
- **Website**: 
  - *مقبول*: Homepage، about، contact، services، landing pages الرسمية.
  - *مرفوض*: `/blog`, `/article`, `/news`, `/post`, `/category`, `/tag`.
- **Facebook / Instagram / TikTok / X**:
  - *مقبول*: Main Profile, Main business page.
  - *مرفوض*: Post links, Reels, Videos, `/p/`, `/tv/`, Photos.
- **LinkedIn**:
  - *مقبول*: `linkedin.com/in/...` أو مسارات الشركة الرسمية مستقبلاً.
  - *مرفوض*: Posts, Articles, Feed, Updates.
- **Snapchat**:
  - *مقبول*: الحسابات الأساسية Public Profiles.
  - *مرفوض*: صفحات عرض المحتوى المستقلة.

---

## 6. تسلسل فلاتر قبول العميل (Client-Only Filtering Sequence)

التصفية المتبعة تجري بالترتيب الصارم التالي:
1. **Filter 1 (Platform validity)**: هل الرابط يعود لذات المنصة الهدف؟
2. **Filter 2 (Page type validity)**: هل هو حساب شخصي (Profile/Page) أم محتوى منشور (Post/Video)؟ (باستخدام تفاصيل التقييم السابق).
3. **Filter 3 (Basic field presence)**: هل تملك النتيجة حداً أدنى من البيانات؟ (بمعنى وجود Title أدنى، اسم العرض Display Name، أو Bio/Snippet بسيطة يثبت وجود الكيان).
4. **Filter 4 (Client eligibility)**: هل الكيان المكتشف يمثل عميلاً محتملاً؟ (استبعاد المدونات البحتة، صفحات الأخبار، منصات نشر الميمز والمحتوى غير التجاري البحت).
5. **Filter 5 (Keyword relevance)**: هل هنالك صلة تقارب بالكلمة المفتاحية في الـ Snippet أو الروابط أو العنوان؟

---

## 7. منطق ترتيب النتائج (Ranking Logic)

يتم ترتيب الجودة بتصميم مبني على القواعد (Rule-based) يصل الحد الأقصى فيه لـ `100 Score`. توزع النقاط تقريبياً على النحو التالي:
- **45 نقطة - Keyword Match**: 
  - التام (Exact) أعلى علامة (45)، الجزئي أقل، المرادف أقل.
- **20 نقطة - City Match**:
  - ذكر اسم المدينة بوضوح في العنوان أو المقتطف (20)، ذكر "الرياض/السعودية" جزئي بوزن أقل، عدم الوجود صفر.
- **15 نقطة - Result Clarity**:
  - التايتل والـ Snippet واضحان وقابلان للقراءة بلا تشوه.
- **10 نقاط - Page/Client Type**:
  - حساب تجاري (Official Business) له الأفضلية على الحساب الفردي غير المحدد، إلخ.
- **10 نقاط - Field Completeness**:
  - النتيجة التي تملك اسمًا مع تايتل وموقع جغرافي تحصل على النقاط كاملة بالمقارنة مع نتيجة تملك التايتل فقط.

---

## 8. سياسة المتابعة حتى الإشباع (Continue-Until-Target Logic)

لا يتوقف البحث بمجرد مناداة المزود أو أول عملية فحص. المنطق هو الإصرار حتى تحقق الهدف:
- **القاعدة**: إشباع الـ `requested count` المطلوب من المستخدم للمنصة.
- **التشغيل العملي**:
  1. تشغيل الـ Query الأولى.
  2. فلترة النتائج وتوثيق الناجحة منها.
  3. إن كان المستخرج الناجح أقل من العدد (مثلاً 5 من أصل 25)، نشغل Batch ثاني (Page 2 أو Variant ثانية).
  4. تطهير البيانات، ودمجها مع ما سلف، وترتيبها (Rank again)، وحفظ الأعلى شأناً.
  5. تتوقف الدورة فقط متى ما بلغ العدد إشباعه المطلق، أو انتهى الرصيد الممكن استنفاذه من הـ Queries المسموحة (Exhaustion).

---

## 9. سياسة الاستنزاف والنفاذ (Exhaustion Policy)

ماذا لو عملت المنصة ودارت في حلقاتها المفرغة وانتهت الكلمات ولا زال العائد مثلاً 6 من أصل 25؟
- البحث لا ينكسر. يتم استرجاع الـ 6 نتائج الصالحة التي تم إيجادها.
- يُطعم كائن الإرجاع المنصي بـ `warning` جليح: `"Insufficient valid results after exhausting search attempts"`.

---

## 10. معالجة الإخفاق والأعطال الجانبية (Failure Handling)

- مبدأ **Failure Isolation**: فشل أي خدمة داخل منصة واحدة، يحيا باقي الجسد.
- لو انهارت منصة (Snapchat) لسبب، تُرسَل الردود للمنصات الخضراء (LinkedIn/Instagram) طبيعية. في حين منصة (Snapchat) تعود بنتيجة 0، ومرفق معها الـ `warning` أو الخطأ المرتبط.
- الأسباب المتوقعة للعطل المحاصرة: `Provider failure`، `Rate limit reached`، `Timeout`، أو حتى عجز تام في الصياغة المردودة كـ `Zero valid results`.

---

## 11. إخراج النتائج الجاهزة (Save-Ready Output)

- يجب أن تصنع النتيجة وتُجهز حتى تكون مطواعة بشكل مباشر للإرسال والعرض للعميل (**display-ready**)، ولتحديدها من قبل العميل (**selection-ready**)، وأن تُرسل إلى موديول العملاء للحفظ مستقبلاً بثقة (**save-ready for future clients module integration**).
- لا يقوم هذا الموديول بالحفظ لكنه يضمن إخراج الأعمدة المطلوبة كالتالي:

```json
{
  "platform": "...",
  "canonicalUrl": "...",
  "displayNameOrName": "...",
  "titleOrHeadline": "...",
  "location": "...",
  "resultType": "...",
  "sourceQuery": "..."
}
```

---

## 12. أولوية استخدام مزود الخدمة Bright Data (Usage Sequence)

سيتم استعمال Bright Data بشكل مقنن وتدرجي، بالأولوية الثابتة:
1. **SERP API (أولوية قصوى وافتراضية)**: للبحث، واكتشاف النتائج، فهو الأرخص، والأسرع وهو الأساسي لجمع الصفحات.
2. **Social Scraper (عند الحاجة وللمنصات المدعومة)**: يُستخدم كخطوة ثانية أو اختيارية عند الرغبة لاحقاً في استخراج basic fields إن دعت الحاجة ولما تكون المنصة مدعومة.
3. **Web Unlocker (خيار الانقاذ كـ Fallback)**: لا يُستخدم كإعداد افتراضي مطلقاً، يُلجأ له كـ `Fallback` لفتح صفحة عامة صعبة أو محمية.

---

## 13. الشكل المتوقع والهيكلية الختامية للمخرجات (Final Output Structure)

الهيكل المنطقي المجمع والمُعاد من `searchLeads` سيسلك البنية المعجمية المطلوبة بشفافية عظمى:

```json
{
  "keyword": "Real Estate Investors",
  "country": "SA",
  "saudiCity": "Riyadh",
  "platforms": ["linkedin", "instagram"],
  "requestedResultsCount": 10,
  "platformResults": {
    "linkedin": {
      "requestedCount": 10,
      "returnedCount": 10,
      "results": [
        {
          "platform": "linkedin",
          "canonicalUrl": "https://www.linkedin.com/in/xyz/",
          "displayNameOrName": "XYZ Investments",
          "titleOrHeadline": "Leading Real Estate Investor in Riyadh",
          "location": "Riyadh, Saudi Arabia",
          "resultType": "professional_profile",
          "sourceQuery": "site:linkedin.com/in/ \"Real Estate Investors\" \"Riyadh\" \"Saudi Arabia\""
        }
      ]
    },
    "instagram": {
      "requestedCount": 10,
      "returnedCount": 6,
      "warning": "Insufficient valid results after exhausting search attempts",
      "results": [
         // ...
      ]
    }
  }
}
```
