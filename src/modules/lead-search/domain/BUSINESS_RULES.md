# Lead Search Module - Business Rules

## Module purpose
الموديول مخصص للبحث عن بيانات العملاء المحتملين فقط (Lead Generation Search) ولا يقوم بأي أدوار أخرى.

## Geography scope
نطاق البحث الجغرافي محصور حالياً في **المملكة العربية السعودية**.
والمدينة الافتراضية للبحث هي **الرياض (Riyadh)**.

## Supported platforms
البحث مقصور حصرياً على المنصات السبع التالية:
1. Website
2. Facebook
3. Instagram
4. Snapchat
5. LinkedIn
6. X (Twitter)
7. TikTok

أي محاولة للبحث في منصة خارج هذه القائمة يجب أن ترفض.

## Count policy
عدد النتائج المسموح بطلبه محدد مسبقاً: **10** أو **25** أو **50**.
هذا العدد ينطبق **لكل منصة على حدة**، وليس المجموع الكلي للنتائج.

## Client-only filtering
النتيجة المقبولة يجب أن تكون حصراً **عميلاً محتملاً** (Potential Client).
يجب **استبعاد (Reject)** أي صفحة لا تمثل شركة أو كيان مهني، بما في ذلك:
- المقالات (Articles / Blogs)
- الفيديوهات والريلز (Videos / Reels / Shorts)
- المنشورات الفردية (Individual Posts)
- الأخبار (News)
- صفحات المحتوى العام (Content-only pages)
- صفحات التاجات (Hashtag pages)

الصفحات المقبولة فقط:
- Business Profile
- Professional Profile
- Official Business Page
- Official Website

## Search provider strategy
يكون المزود الأساسي (Primary Provider) لنتائج البحث هو **Bright Data**.

## Query language rule
يجب أن تدعم توليد جمل البحث (Query Expansion) كلا اللغتين: **العربية** و **الإنجليزية**.
التوليد يجب أن يكون محصوراً (limited)، مسيطر عليه (controlled)، ويعتمد على قواعد ثابتة (rule-based) **بدون استخدام الذكاء الاصطناعي (No AI)**.

## Platform isolation
كل منصة يتم البحث فيها بشكل مستقل تماماً عن بقية المنصات. 

## Failure isolation
فشل البحث في استخراج نتائج من إحدى المنصات لا يجب أن يوقف أو يكسر (Break) عمل الموديول مع باقي المنصات.
