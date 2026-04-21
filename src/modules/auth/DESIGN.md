# تصميم الهيكل الداخلي لموديول Auth

هذا الملف يوثق التصميم المعماري الداخلي، الهيكلية، قواعد التواصل، والمسؤوليات الخاصة بموديول الـ Auth وفق مبادئ الـ Modular Monolith.

## 1. الهيكل الداخلي للموديول (Folder Structure)
الشكل المعتمد لمجلد الموديول:
```text
src/modules/auth/
├── index.ts                      # Module Boundary (يُصدر public فقط)
├── public/                       # الواجهة المسموح للموديولات الأخرى استخدامها
│   ├── auth.facade.ts
│   └── auth.types.ts
├── api/                          # طبقة التقديم (Presentation / Delivery)
│   ├── auth.routes.ts
│   ├── auth.controller.ts
│   └── auth.schemas.ts
├── application/                  # طبقة التطبيق (Use Cases & Application Logic)
│   ├── dto/
│   ├── use-cases/
│   ├── services/
│   └── mappers/
├── domain/                       # طبقة المجال (التي تم استكمالها في الجزء الأول)
│   ├── enums.ts
│   ├── entities.ts
│   ├── rules.ts
│   ├── policy.ts
│   ├── repositories.ts
│   ├── use-cases.ts
│   └── BUSINESS_RULES.md
└── infrastructure/               # طبقة البنية التحتية (Implementation details)
    ├── repositories/
    ├── security/
    ├── mail/
    └── persistence/
```

## 2. مسؤوليات الطبقات (Layer Responsibilities)
* **`public/`**: الواجهة الوحيدة التي يُسمح من خلالها لباقي موديولات النظام بالتواصل مع موديول `auth`. لا يخرج من الموديول أي من تفاصيله الداخلية أبدًا باستثناء ما هو متوفر في هذا المجلد.
* **`api/`**: مسئول فقط عن استقبال الطلبات (`routes`)، توجيهها للـ `Controllers`، التحقق من صحة الطلبات (`request validation` عبر `schemas`)، وتنسيق الاستجابة للإرجاع (`response formatting`). هذه الطبقة لا تحتوي إطلاقا على `business logic`.
* **`application/`**: القلب المنسق للموديول ويحوي الـ `Use Cases` و `dto` و `Application Services`. مهمتها وتوزيع المهام (Orchestration)، والتحويل (`mapping`) بين الـ `API Input` والـ `Domain/Outputs`.
* **`domain/`**: لغة الموديول الحقيقية، تحتوي على الـ Entities و Enums وقواعد العمل وسياسات الصلاحيات (`policy`) وعقود الـ `Repositories`.
* **`infrastructure/`**: مسئولة عن أي تعامل تقني خارجي ويشمل: تنفيذ الـ `repositories` في مستوى الـ MySQL، تشفير الكلمات مرور (`password hashing`)، العمليات المتعلقة بـ (`token generation`)، وإرسال الايميلات (`mail sending`).

## 3. اتجاه الاعتماديات (Dependency Direction)
قواعد صارمة تحدد من يستطيع استدعاء من:
✅ **المسموح:**
* `api` -> يعتمد على -> `application`
* `application` -> يعتمد على -> `domain`
* `infrastructure` -> يعتمد على -> `domain`
* `public` -> يعتمد على -> `application/domain` (لتنفيذ الأوامر وإرجاع الأنواع)
* `index.ts` -> يصدر فقط -> `public`

❌ **الممنوع منعًا باتًا:**
* لا يمكن لـ `api` أن يكلم الـ `infrastructure` مباشرة.
* لا يمكن لـ `application` أن تعتمد على الـ `api` أو على تفاصيل الـ `infrastructure` التقنية (تعتمد فقط على `Contracts`).
* لا يمكن لـ `domain` الاعتماد على أي طبقة أخرى أبدًا (لا `application` ولا `infrastructure`).

## 4. قائمة حالات الاستخدام (Use Cases / Application Layer)
تصنيف الملفات داخل `application/use-cases/` ومسؤوليتها الأساسية:
- `send-invite`: معالجة طلب إرسال دعوة جديدة والمصادقة على أهليّتها وإرسال الإيميل.
- `resend-invite`: إعادة إرسال إيميل لدعوة موجودة مسبقًا وحالتها تسمح.
- `revoke-invite`: سحب الصلاحية من دعوة (تحويل حالتها لإلغاء).
- `validate-invite`: التوثق من بيانات الدعوة وموعد انتهائها وصلاحيتها عند دخول المستخدم على الرابط.
- `accept-invite`: تفعيل حساب وبناء مستخدم جديد انطلاقاً من الدعوة وإقفال الـ invite.
- `login`: التحقق من الحساب وكلمة المرور وتوليد التوكنز للـ Session.
- `refresh-session`: إصدار Token جديد بناءً في حال وجود session صالحة للعمل.
- `logout`: تدمير جلسة وتسجيل الخروج.
- `request-password-reset`: طلب استعادة وعمل Reset Token.
- `reset-password`: معالجة استخدام توكن الإستعادة وحفظ الكلمة الجديدة.
- `change-user-role`: تغيير صلاحية/دور مستخدم معين.
- `suspend-user`: إيقاف حساب المستخدم.
- `reactivate-user`: تخليص حساب المستخدم من حالة الإيقاف.
- `list-users`: تقديم قائمة للمستخدمين بالمعاير المسموحة.
- `list-invites`: عرض الدعوات حسب من طلبها.
- `list-audit-logs`: قراءة بيانات سجل التدقيق وتصديرها.

## 5. خدمات التطبيق المشتركة (Shared Application Services)
تتمركز داخل فولدر `application/services/`:
- `invite-policy.service`: مسؤولة عن فحص وتأكيد إذا كان المستخدم الحالي (`actor`) يمتلك صلاحية التفاعل (إرسال، إلغاء) لدعوة تخص منصب معين (مرتبط بالـ Policy Domain).
- `user-access-policy.service`: لفحص السماح للـ (`actor`) لتغيير `role` أو عمل `suspend` و `reactivate` لمستخدم.
- `audit-logger.service`: واجهة مركزية بداخل الـ Application لتدوين وتسجيل الأحداث (e.g. نجاح الدخول، تغيير الدور).
- `session-revocation.service`: خدمة متخصصة لتنسيق سحب الجلسات (Logout All) من الـ `SessionRepository` للمستخدم عند تغيير الـ `role` أو حال الإلغاء.
- `token-fingerprint.service`: لتنسيق عمليات الـ `Hashing` للـ Token الموزعة بطريقة موحدة ومقاصة مقارنتها مع المُخزن بقواعد البيانات.

## 6. محولات البنية التحتية (Infrastructure Adapters)
المكونات المتواجدة داخل طبقة البيانات والخدمات التقنية بمجلد `infrastructure/`:
* **Repositories Adapters**
  - `mysql-user.repository`
  - `mysql-invite.repository`
  - `mysql-session.repository`
  - `mysql-password-reset.repository`
  - `mysql-audit-log.repository`
* **Security Adapters**
  - `password-hasher`
  - `token-service` (or `jwt-service`)
* **Mail Adapters**
  - `invite-mailer`
  - `password-reset-mailer`
* **Persistence**
  - Database Client أو Transaction Helper موحد لـ MySQL ضمن الموديول.

## 7. الواجهة العامة للموديول (Public Facade Boundary)
ملف `public/auth.facade.ts` يصدّر أقل حد ممكن لحماية الموديول:
✅ **يخرج للخارج:**
- `getUserById(id)`
- `getUserByEmail(email)`
- `ensureUserIsActive(id)`
- `revokeAllSessionsForUser(id)`
(ومعلومات المستخدم كـ DTO فقط `PublicUserDto`)
❌ **ما يُمنع خروجه:**
- تفاصيل الـ JWT Tokens وقواعدها.
- كائنات الـ Repositories أو الـ Rules.
- الـ Internal Use-Cases للتحكم.

## 8. حدود توجيه الموديول (Module Index Boundary)
الموديول يصدر فقط عبر `src/modules/auth/index.ts`.
ويقوم بالتصدير فقط من `public/auth.facade.ts` ومجلد `public` حمايةً للتصميم ومنعاً للتداخل المعقد.
