# تصميم حالات الاستخدام لموديول Auth (Use Cases Blueprint)

تمثل هذه الوثيقة خريطة التنفيذ (Execution Blueprint) الصارمة الموجهة لجميع حالات الاستخدام بموديول الـ Auth، بدون الاعتماد على أي كتابة دقيقة للكود، بهدف الاستدلال والتمسك بالقرارات السلوكية المفصلية لحماية المنظومة.

---

## القرارات السلوكية الملزمة (Behavioral Decisions)
تم حسم القرارات الجوهرية التالية وتثبيتها:
1. **طبيعة `resendInvite`**: لا يتم إعادة تدوير وبث نفس الـ Token ولا تُمدد الدعوة السابقة. الأسلوب المُعتمد أأمن: يتم تحويل الدعوة القديمة المعلقة (Pending) إلى مسحوبة (Revoked)، ومن ثم يُصنع (Token) ودعوة جديدة بالكلية وتُرسل، ليصبح القديم غير فاعل للاطمئنان.
2. **ردود `requestPasswordReset`**: الرد الدائم للمستفيد هو "استجابة نجاح مُبهمة" إما (تم إرسال بريد). يقتضي هذا المنع الكامل لتبيان ما إذا كان الإيميل خاطئاً أو الحساب غير موجود لمنع عمليات الإحصاء والإختراق (User Enumeration).
3. **رسائل فشل `login`**: الفشل دوماً يرجع (مبهم Generic) بعبارة كـ `invalid credentials` سواءً أنكر النظام تواجد الاسم البريدي أو غلط في مفتاح المرور لمنع استبيان الحسابات.
4. **التدوير في `refreshSession`**: نعم، نعتمد الـ **Rotation**، كل عملية Refresh تخلِف وتدوّر Refresh Token جديد تماماً مع Access Token، وتستثني وتُعدم سلفه لمنع سرقة المفاتيح النشطة.
5. **تأثير الـ `resetPassword`**: حتماً عند استتباب إنشاء كلمة عبور محكمة جديدة، يتولى الموديول كإجراء وقائي سحب وإعدام كل الجلسات (Revoke all sessions)، مُجبراً الخصم (أو المُستخدم الشرعي بالتبادل) لطلب تسجيل دخول من الصفر.

---

## المجموعة A: حالات الاستخدام الأساسية

### 1. `sendInvite`
1. **الهدف**: إرسال دعوة بالبريد الإلكتروني للالتحاق بالنظام وبناء أرشيف الدعوة.
2. **المدخلات**: `actorUserId`, `targetEmail`, `targetRole`.
3. **المخرجات**: `inviteId`, `email`, `role`, `status`, `expiresAt`.
4. **الـ Dependencies**: `UserRepository`, `InviteRepository`, `AuditLogRepository`, `InvitePolicyService`, `InviteMailer`, `TokenService` (لتبني الهاش).
5. **الـ Preconditions**:
   - الفاعل متوفر ونشط.
   - الفاعل يحمل دوراً يسمح له بإرسال الدعوات إجمالاً، ويسمح باستهداف هذا الدور تخصيصاً.
   - لا يوجد موظف / حساب فعال أو مقفل تم تأسيسه بهذا البريد من قبل.
   - لا يوجد دعوة مُستقلة بحالة `pending` قيد التنفيذ للبريد نفسه.
6. **الخطوات الداخلية**:
   - استحضار الـ actor والتأكد من وضعه.
   - حسم الـ policy للموكل.
   - استطلاع إذا ماكان هناك Record بالـ `UserRepository` عبر البريد لمنعه.
   - استطلاع بالـ `InviteRepository` لمنع تراكم الـ Pending لنفس البريد.
   - بناء token سرّافي (Random text) وتحليله بـ Hashing.
   - تكوين وحفظ ريكورد لـ Invite.
   - الإرسال عبر البوابة البريدية `InviteMailer` مشتملاً التوكن الأصلي.
   - تقييد الأمر بالـ Audit Log.
   - إجابة ببيانات الدعوة.
7. **حالات الفشل**: `Actor missing/suspended`, `Forbidden`, `Email occupied`, `Pending invite already valid`, `Mailer failed`.
8. **الـ Audit Events**: `invite.sent`

### 2. `acceptInvite`
1. **الهدف**: التفعيل وابتكار مِلف حساب User باستلام رمز دعوة ودعمه بكلمة سر.
2. **المدخلات**: `inviteToken`, `fullName`, `password`.
3. **المخرجات**: `Public user data`, `access/refresh token pair`.
4. **الـ Dependencies**: `InviteRepository`, `UserRepository`, `SessionRepository`, `AuditLogRepository`, `PasswordHasher`, `TokenService`, `JwtService`.
5. **الـ Preconditions**:
   - الدعوة قائمة ولم تحذف وهاش التوكن ممتثل.
   - حالة الدعوة حصرًا `pending`.
   - الوقت الحالي يسبق الـ `expires_at`.
   - الإيميل غير مرتبط بأي ريكورد في الـ `users`.
6. **الخطوات الداخلية**:
   - الهاش للتوكن النصي وجلب الدعوة من الـ `InviteRepository`.
   - التقييم الزمني (Expiry) وتقييم الحالة (الحظر للـ revoked/accepted).
   - توثيق Validation لطول الإسم والإشتراطات لكلمة المرور.
   - التشفير بحزمة `PasswordHasher`.
   - تكوين ريكورد اليا لمستخدم جديد والـ Save.
   - صياغة وتحديث الدعوة إلى `accepted` وتعليق `accepted_user_id`.
   - الإذن بطيّ الجلسات وإثبات الـ JWT/Sessions.
   - تدوين الانتهاء.
   - التسليم.
7. **حالات الفشل**: `missing invite`, `token invalid`, `expired/revoked/accepted status`, `user exists`, `malformed password/name`.
8. **الـ Audit Events**: `invite.accepted`

### 3. `login`
1. **الهدف**: تسجيل الولوج للمستخدمين المقيدين لإستحصال الـ Tokens.
2. **المدخلات**: `email`, `password`.
3. **المخرجات**: `access token`, `refresh token`, `user public data`.
4. **الـ Dependencies**: `UserRepository`, `SessionRepository`, `PasswordHasher`, `JwtService`, `TokensService`, `AuditLogRepository`.
5. **الـ Preconditions**: الـ User فعلي ومسجل وحالته مقبولة وكلمة العبور مصدقة.
6. **الخطوات الداخلية**:
   - تخليص الإيميل من الفوارغ كـ Trim/Lowercase.
   - استعداء المستخدم بناء على بريده.
   - التقييم لظروف الحساب وأنه `active`.
   - مقارنة الباسورد باستخدام التشفير الداخلي.
   - تعيين وبناء `session` مستحدثة تُحفظ بالريبوسيتوري.
   - صرف مفاتيح دخول (JWT).
   - إنهاء بتسجيل الـ Audit.
   - التسليم للواجهة.
7. **حالات الفشل**: `Invalid credentials` (تضم داخليًا user missing + wrong password), `Suspended account`.
8. **الـ Audit Events**: `auth.login.succeeded`, `auth.login.failed`

---

## المجموعة B: معاملات الجلسات

### 4. `refreshSession`
1. **الهدف**: استخلاص وتغيير مفاتيح الدخول المتزامنة لاستمرار التصفح.
2. **المدخلات**: `refreshToken`.
3. **المخرجات**: `new access token`, `new refresh token`.
4. **الـ Dependencies**: `SessionRepository`, `UserRepository`, `JwtService`, `TokenService`, `AuditLogRepository`.
5. **الـ Preconditions**: التوكن شرعي وساري ولم يُسحب للمستخدم النشط.
6. **الخطوات الداخلية**:
   - إقرار التشفير على التوكن المُحمل وبحث المعامل له في الداتابيز.
   - فحص وجود الجلسة، وتقييم إذا ما حان الانقضاء `expires_at` أو جُمّدت `revoked_at`.
   - التوثق من بيانات صاحب الحساب بكونه لا يزال `active`.
   - تحجير ووقف حقل الـ session السابقة إذا فضل مهندس التطبيق، أو التبديل المباشر (Rotation) وإصدار ثروة مفتاحية جديدة للجلسة مع تحديث الـ Hash.
   - الإرجاع للزوج الجديد من المفاتيح.
7. **حالات الفشل**: `Token invalid`, `Session revoked/expired`, `Suspended/Deleted user`.
8. **الـ Audit Events**: غير محتمل للنجاح المستمر لكثرته الساحقة، يسجل רק (عند المحاولة الدخيلة باستخدام جلسة مسحوبة). تم التنازل عن تدوين التدقيق في كل نجاح.

### 5. `logout`
1. **الهدف**: إنهاء وتعطيل الجلسات المختارة وتأمين ترك النظام.
2. **المدخلات**: `refreshToken` (ممكن SessionId), `actorUserId`.
3. **المخرجات**: `success boolean` أو `void`.
4. **الـ Dependencies**: `SessionRepository`, `AuditLogRepository`.
5. **الـ Preconditions**: التوكن مقترن بجلسة حية تخص الـ actor.
6. **الخطوات الداخلية**:
   - جلب وتسوية الجلسة التابعة للتوكن.
   - تحديث حالة السحب بوضع التاريخ الخاص بـ `revoked_at`.
   - التسجيل.
   - الخروج.
7. **حالات الفشل**: `Unknown session`, `Unauthorized cross-account session action`.
8. **الـ Audit Events**: `auth.logout`

---

## المجموعة C: إجراءات الأمان للكلمة المرورية

### 6. `requestPasswordReset`
1. **الهدف**: تدشين مقترح إيميل لترميم كلمة الحماية.
2. **المدخلات**: `email`.
3. **المخرجات**: `Generic success response`.
4. **الـ Dependencies**: `UserRepository`, `PasswordResetRepository`, `TokenService`, `PasswordResetMailer`, `AuditLogRepository`.
5. **الـ Preconditions**: لا شيء يذكر للملأ للحفاظ على الـ Generics (داخلياً فقط الموظف النشيط يستحق رسالة).
6. **الخطوات الداخلية**:
   - تمهيد مساحة الإيميل (Normalize).
   - جلب العميل المعني من الداتابيز.
   - إن لم يعثر عليه النظام أو كان "Suspended"، يطوي الصفحة ويجاوب بالنجاح المبهم.
   - إبطال الجلسات الحالية لمطلبي الاستعادة السابقة لنفس العميل (Cleanup Optional).
   - صناعة التوكن المشفر كـ UUID قوي.
   - إيداع بالـ `PasswordResetRepository` + تحديد فترة السماح بصلاحية 15 دقيقة فقط.
   - استدعاء الطوابع وإرسال الميل الفعلي عبر Mailer.
   - استكمال الدفتر بالعملية (Audit).
   - رجوع النجاح العام.
7. **حالات الفشل**: `Mailer crashes`, `DB transaction failed` (Internal/Server errors mostly).
8. **الـ Audit Events**: `auth.password_reset.requested`

### 7. `resetPassword`
1. **الهدف**: تطبيق واستكمال تعيين الرمز السري.
2. **المدخلات**: `resetToken`, `newPassword`.
3. **المخرجات**: `Generic success`.
4. **الـ Dependencies**: `PasswordResetRepository`, `UserRepository`, `SessionRepository`, `PasswordHasher`, `AuditLogRepository`.
5. **الـ Preconditions**: التوكن صحيح وغير منلو والزمن يسمح والحساب موجود.
6. **الخطوات الداخلية**:
   - التحليل المعرفي للتوكن.
   - تأكيد الخلل في الزمن أو التعديل السابق (`used_at`).
   - الإحاطة بمدى مطابقة الـ `newPassword` للإشتراطات.
   - تنفيض التشفير الجديد بـ PasswordHasher.
   - تحديث سجل الـ `users`.
   - وضع ختم الاستعمال بخانة `used_at` بريكورد الـ Request.
   - الأمر بـ إسقاط وعزل كافة جلسات المستخدم الفعلية بالـ `SessionRepository` لإجباره على استعمال المفتاح الجديد إجبارياً.
   - تدوين الإقفال ومسح الجلسة.
   - النجاح.
7. **حالات الفشل**: `Spoofed token`, `Expired limit`, `Used request`, `Missing user/password issues`.
8. **الـ Audit Events**: `auth.password_reset.completed`, `session.revoked_all`

---

## المجموعة D: التعديل الإداري للدعوات

### 8. `revokeInvite`
1. **الهدف**: سحب وتعقيد الدعوة من المتلقي لمنعه من فتح حساب ولإبطال التوكن.
2. **المدخلات**: `actorUserId`, `inviteId`.
3. **المخرجات**: `updated invite summary`.
4. **الـ Dependencies**: `UserRepository`, `InviteRepository`, `InvitePolicyService`, `AuditLogRepository`.
5. **الـ Preconditions**: الفاعل نشيط والدعوة مقيدة للآن `pending` ويصرح للفاعل إدارتها.
6. **الخطوات الداخلية**:
   - الجلب السريع للفاعل والدعوة المعنية.
   - تدقيق الموانع الإدارية بالـ `Policy` كأن يحاول Manager سحب دعوة موجهة لـ أدمين.
   - تعيير وإرساء الصفة على `revoked` وضبط التوقيت.
   - حسم التعديل بالداتابيز وتأصيل الـ Audit.
   - تسليم المحصلة.
7. **حالات الفشل**: `Actor unallowed (suspended)`, `Invite unaccounted`, `Not impending invite (like accepted)`, `Policy barriers`.
8. **الـ Audit Events**: `invite.revoked`

### 9. `resendInvite`
1. **الهدف**: استحصال دعوة جديدة وإرساله لمتلقي لم يجاوب السابقة، بتوكن وسلامة متجددة.
2. **المدخلات**: `actorUserId`, `inviteId`.
3. **المخرجات**: `new invite summary` (نعم جديدة بحكم القرار المسبق).
4. **الـ Dependencies**: `UserRepository`, `InviteRepository`, `InvitePolicyService`, `TokenService`, `InviteMailer`, `AuditLogRepository`.
5. **الـ Preconditions**: الموكل صالح وتعتبر الدعوة المستهدفة مؤهلة للإعادة وللفاعل الصلاحية المطلقة.
6. **الخطوات الداخلية**:
   - إعداد الملفات (actor and invite logic).
   - توقيع الممنوعات الإدارية بالـ Policy.
   - إنفاذ الانسحاب على الدعوة الكهلية (`revoke` القديمة) بحيلة داخليّة وتسجيل توقيتها كمسحوبة/معطلة.
   - استشراف وإنشاء دعوة جديدة لنفس العنوان والاسم (email, role) مع خلق وتشفير Token جديد.
   - تسجيل المكتوب الحديث بالريبوسيتوري.
   - القذف بالرسالة الجديدة عبر الـ Mailer.
   - توثيق الإستدراك بالـ Audit.
7. **حالات الفشل**: `Mailer crashes`, `Actor unverified`, `Invite unaccounted or already taken`, `Lacking bounds and policies`.
8. **الـ Audit Events**: `invite.resent`

---

## المجموعة E: التحكم بالسلطات والحالات للحساب

### 10. `changeUserRole`
1. **الهدف**: إعادة تموضع وتبديل الدرجة الوظيفية (Role) بحق النظام للمستهدفين الأصيلة.
2. **المدخلات**: `actorUserId`, `targetUserId`, `newRole`.
3. **المخرجات**: `updated public user data`.
4. **الـ Dependencies**: `UserRepository`, `UserAccessPolicyService`, `AuditLogRepository`.
5. **الـ Preconditions**: الفاعل فاعل، والهدف موجود بصرف النظر عن حالته، وصلاحية الفاعل تسري لعمل هذا التعديل إلى الوظيفة الجديدة.
6. **الخطوات الداخلية**:
   - إدخال الأطراف (Actor And Target User) من قِبل الريبوسيتوري.
   - اجتياز سياسات المُراقبة الخاصة بأن (الـ Manager) لا يقوى على (الـ Admin) ولا يقوى بتعليم غيره كـ (Admin).
   - شرط التفادي إذا ما اتفق الهدف والرول الجديد (No-op check).
   - تبديل وتحديث دور الهدف لـ `newRole`.
   - التسجيل للـ Audit والتسليم.
7. **حالات الفشل**: `Actor/Target not found`, `Forbidden barrier (Manager/Admin constraints)`.
8. **الـ Audit Events**: `user.role.changed`

### 11. `suspendUser`
1. **الهدف**: الوقف الفوري والصريح لسحب قدرة المستفيد من الولوج وإيقاف أجهزته النشطة.
2. **المدخلات**: `actorUserId`, `targetUserId`.
3. **المخرجات**: `updated user summary`.
4. **الـ Dependencies**: `UserRepository`, `SessionRepository`, `UserAccessPolicyService`, `AuditLogRepository`.
5. **الـ Preconditions**: الفاعل نشط، المستهدف مسجل ولا يتبين كموقوف مسبقاً، وسلطة المشرف الفاعل تسمح (المدير لا يطرد الأدمن).
6. **الخطوات الداخلية**:
   - إجبار تحميل الفاعل والهدف من الجدول المرجعي.
   - تقييم أهليّة الإيقاف (Policy rules).
   - تحوير الخصيصة الخاصة بحالة الحساب المنبثقة من `active` لـ `suspended`.
   - التحاكم الفوري مع `SessionRepository` لسحق كافة ومجمل الجلسات المرتبطة `revoke all sessions`.
   - التقييد المُزدوج للـ Audit Record بالوقف وتدمير الجلسات.
7. **حالات الفشل**: `Actor lacks the power (Forbidden)`, `Target already banned`, `Target vanished`.
8. **الـ Audit Events**: `user.suspended`, `session.revoked_all`

### 12. `reactivateUser`
1. **الهدف**: استعادة حق الصلاحية ورفع حظر التوقيف لاستئناف العمل بالحساب.
2. **المدخلات**: `actorUserId`, `targetUserId`.
3. **المخرجات**: `updated user summary`.
4. **الـ Dependencies**: `UserRepository`, `UserAccessPolicyService`, `AuditLogRepository`.
5. **الـ Preconditions**: النقيض، الموكل صالح والهدف مسجل ويتبين أنه مجمد (Suspended)، والـ Policy تُطابق وتُسهم.
6. **الخطوات الداخلية**:
   - احياء ملفات الموكل والمقصد من الريبوسيتوري.
   - المواثيق (Access verification policy).
   - التأكيد الحتمي أن الهدف "Suspended".
   - تجديد الحالة الوصفية ورفعها إلى "Active".
   - رصد الحدث (Audit) والعرض الناتج للرجوع.
7. **حالات الفشل**: `Policy blocked (insufficient permission)`, `Already active or missing account`.
8. **الـ Audit Events**: `user.reactivated`

---

## المجموعة F: الاستعلامات والعروض الإدارية القابلة للفهرسة

### 13. الاستعلام الشامل والفرز (List Reads)

#### أ. `listUsers`
- **الهدف**: قراءة وفهرسة الحسابات النشطة وعرضها للمشرفين.
- **المدخلات**: `actorUserId`, `page`, `pageSize`, `filters` (role, status, email).
- **المخرجات**: مصفوفة من الـ `PublicUserDto` موشحة بـ `Pagination metadata/TotalCount`.
- **الـ Dependencies**: `UserRepository`, `UserAccessPolicyService`.
- **الشروط**: على الـ Actor أن يملك دورًا يقدر على التقصي (كمدير أو أدمن).

#### ب. `listInvites`
- **الهدف**: تبيان السجل الإداري للدعوات المرسلة ووضعها الراهن (مقبولة، معلقة، إلخ).
- **المدخلات**: `actorUserId`, `page`, `pageSize`, `filters` (status, role, email snippet).
- **المخرجات**: مصفوفة للـ `InviteDto` + `Paginator`.
- **الـ Dependencies**: `InviteRepository`, `InvitePolicyService`.

#### ج. `listAuditLogs`
- **الهدف**: مطالعة الأجهزة المرجعية والمراجعة الأمنية للأحداث المستحثة في المنظومة.
- **المدخلات**: `actorUserId`, `page`, `pageSize`, `filters` (action, entityType, dateRange intervals).
- **المخرجات**: الـ `AuditLogDto` + `Paginator records`.
- **الـ Dependencies**: `AuditLogRepository`, (والمتحكم بالسياسة).
- **قرار سياسة المشاهدة (Manager Logs Rule)**: بقرار معتمد وثابت، سيمتلك الشخص بتصنيف `manager` الرؤية الشاملة لكافة السجل الأمني (يملك الإذن الكلي مثله مثل المندوبين `admin`) إستنادًا لعدالة الوثوقيات المطلوبة منه للنظر في تحركات العامل الخاص بمجاله. ولتبسيط الهيكل سيتم تعيين `canViewAuditLogs: true` من غير تحديد حواجز له برمجياً إلا ما يتطلبه مسار التطوير.
