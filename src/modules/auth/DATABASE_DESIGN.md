# تصميم قاعدة البيانات لموديول Auth

هذا الملف يوثق تصميم قاعدة البيانات الخاصة بالموديول، بما في ذلك الجداول، الأعمدة، العلاقات، الفهارس، وقيود البنية التحتية، بالإضافة إلى قواعد الأعمال التي لن تُفرض بواسطة الداتابيز بل مبرمجة في طبقة التطبيق. بناءً على التوجيهات، لن تتضمن هذه المرحلة أي استعلامات (Queries) أو عمليات ترحيل (Migrations).

## 1. قائمة الجداول الأساسية
1. `users`
2. `invites`
3. `sessions`
4. `password_resets`
5. `audit_logs`

## 2. أعمدة الجداول (Table Columns)

**ملاحظات على الأنواع (Data Types):**
- المُعرفات (IDs): سنصممها كـ `UUID` (طولها عادة String 36) نظراً لمرونتها، وأمانها من ناحية التخمين (Guessing)، وتوافقها الأفضل مع هيكلية الـ Modular Monolith.
- خيارات الحالة/الدور (Role/Status): `VARCHAR` لدعم المرونة مستقبلاً (مثل `admin`, `active`).
- سجلات الوقت: `DATETIME` أو `TIMESTAMP`.
- البريد الإلكتروني: `VARCHAR` (ويكون دائمًا مخزنًا بصيغة Lowercase Normalized).

### 2.1. جدول الحسابات الفعلية `users`
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Not Null)
- `full_name` (VARCHAR, Not Null)
- `password_hash` (VARCHAR, Not Null)
- `role` (VARCHAR, Not Null)
- `status` (VARCHAR, Not Null)
- `created_at` (DATETIME, Not Null)
- `updated_at` (DATETIME, Not Null)

### 2.2. جدول الدعوات `invites`
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Not Null)
- `role` (VARCHAR, Not Null)
- `status` (VARCHAR, Not Null) — (pending, accepted, expired, revoked)
- `token_hash` (VARCHAR, Not Null)
- `expires_at` (DATETIME, Not Null)
- `invited_by_user_id` (UUID, Not Null)
- `accepted_user_id` (UUID, Nullable)
- `accepted_at` (DATETIME, Nullable)
- `revoked_at` (DATETIME, Nullable)
- `created_at` (DATETIME, Not Null)
- `updated_at` (DATETIME, Not Null)

### 2.3. جدول الجلسات `sessions`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Not Null)
- `refresh_token_hash` (VARCHAR, Not Null)
- `expires_at` (DATETIME, Not Null)
- `revoked_at` (DATETIME, Nullable)
- `last_used_at` (DATETIME, Not Null)
- `created_at` (DATETIME, Not Null)

### 2.4. جدول استعادة كلمة المرور `password_resets`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Not Null)
- `token_hash` (VARCHAR, Not Null)
- `expires_at` (DATETIME, Not Null)
- `used_at` (DATETIME, Nullable)
- `created_at` (DATETIME, Not Null)

### 2.5. جدول السجل الأمني `audit_logs`
- `id` (UUID, Primary Key)
- `actor_user_id` (UUID, Nullable) — (قد لا يكون معلوماً وقت محاولة تسجيل دخول فاشلة).
- `action` (VARCHAR, Not Null)
- `entity_type` (VARCHAR, Not Null)
- `entity_id` (VARCHAR, Not Null)
- `metadata_json` (JSON, Nullable)
- `created_at` (DATETIME, Not Null)

## 3. العلاقات (Relations & Foreign Keys)
- جدول `users` ← `invites` (منشئ الدعوة): `invites.invited_by_user_id` → `users.id`
- جدول `users` ← `invites` (مُتقبل الدعوة): `invites.accepted_user_id` → `users.id`
- جدول `users` ← `sessions`: `sessions.user_id` → `users.id`
- جدول `users` ← `password_resets`: `password_resets.user_id` → `users.id`
- جدول `users` ← `audit_logs`: `audit_logs.actor_user_id` → `users.id`

## 4. القيود الفريدة (Unique Constraints)
- في `users`: قيمة `email` فريدة تماماً (Unique).
- في `invites`: قيمة `token_hash` فريدة.
- في `sessions`: قيمة `refresh_token_hash` فريدة.
- في `password_resets`: قيمة `token_hash` فريدة.

## 5. الفهارس (Indexes)
تُضاف الفهارس لتسريع قراءة البيانات بناءً على أعمدة البحث الشائعة:

**في `users`:**
- UNIQUE INDEX (`email`)
- INDEX (`role`)
- INDEX (`status`)

**في `invites`:**
- UNIQUE INDEX (`token_hash`)
- INDEX (`email`)
- INDEX (`status`)
- INDEX (`expires_at`)
- INDEX (`invited_by_user_id`)

**في `sessions`:**
- UNIQUE INDEX (`refresh_token_hash`)
- INDEX (`user_id`)
- INDEX (`expires_at`)
- INDEX (`revoked_at`)

**في `password_resets`:**
- UNIQUE INDEX (`token_hash`)
- INDEX (`user_id`)
- INDEX (`expires_at`)
- INDEX (`used_at`)

**في `audit_logs`:**
- INDEX (`actor_user_id`)
- INDEX (`action`)
- INDEX (`entity_type`)
- INDEX (`entity_id`)
- INDEX (`created_at`)

## 6. سياسات الحذف والتحديث (Delete & Update Policies)
لا نحتاج في موديول Auth لاستخدام `Soft Delete` (كحقل `deleted_at`)، فالأعمدة المتوفرة بحكم الموديول تعتبر كافية.
- **`users`:** لا يُحذف المستخدم فعلياً ليتم تغيير الـ status فقط.
- **`invites`:** تُحفظ في الداتابيز كأرشيف دائم.
- **`sessions`:** يتم إبطالها بتسجيل `revoked_at` (من الممكن إنشاء Job في المستقبل للتنظيف ولكن كـ Business Logic، نعتمد على الاستدعاء والتوقيت).
- **`password_resets`:** تحتفظ كسجل دائم للتأكيد ولا تحذف عند الـ Use.
- **`audit_logs`:** لا تحذف أبداً.

**أما بالنسبة لقواعد الـ Foreign Keys في الداتابيز:**
- يفضل أن تكون القاعدة `ON DELETE RESTRICT` لجميع ربط الـ `users_id` في الجداول المعنية لمنع المسح الجسدي الخطأ للحساب ووقوع الـ (Orphan data).
- بالنسبة لسجل الـ Actor في الـ Audit: قد يكون الاستثناء بمنح `ON DELETE SET NULL` لعامود `actor_user_id` في `audit_logs` إذا تم حذف المستخدم مستقبلاً لأسباب قانونية وبداعي الاحتفاظ بالـ Log.

## 7. القواعد المنطقية المفروضة من البزنس (Business constraints outside DB)
بعض القواعد سيتم فرضها برمجياً (Application Logic) لأن الاعتماد على قاعدة البيانات لغرضها حصرياً معقد أو مقيد:
- **منع الدعوات المعلقة المكررة:** تاريخياً نعم يمكن إرسال أكثر من دعوة للحساب الواحد، ولكن لا يمكن إنشاء دعوة جديدة بحالة `pending` لنفس الإيميل إذا كان هنالك بالفعل دعوة `pending` فعالة.
- **إدارة المدراء:** النظام سيرفض كودياً أن يقوم أحدهم برتبة `Manager` بتغيير الصلاحيات للمستخدم `admin` أو إيقافه أو دعوة حساب بصلاحيات `admin`.
- **صلاحية القبول:** لا يقبل التطبيق تنشيط كود الدعوة (Accept Invite) إن كانت حالته مغايرة عن الـ `pending` أو وقته أقدم من الزمن الفعلي.
- **صلاحية الاستعادة:** توكن إعادة تعيين كلمة المرور هو (`single-use`) فقط ولا يُقبل بعد استخدامه وتدوين `used_at`.
- **جلسات الموقوف:** الـ (`suspended user`) سوف تُلغى قدرته الجلساتية الحية فور تطبيق إغلاق الحساب في الـ Transaction.
