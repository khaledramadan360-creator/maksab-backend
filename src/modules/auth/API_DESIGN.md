# تصميم واجهة برمجة التطبيقات (API Design) لموديول Auth

هذه الوثيقة تحدّد عقود طبقة نقط الإتصال (API Endpoints)، بما فيها قرارات التنسيقات (Formats)، أكواد الأخطاء (Status Codes)، وتطبيقات الأمان (Auth & Role requirements). لن تحتوي الوثيقة على أي شيفرات (Controllers/Routers) بل تعتبر الخط المعياري لإنشائها المنهجي.

## 1. الهيكل الموحد للاستجابات (Response Envelope)
لضبط المعايير وضمان التناغم، سترد جميع الـ APIs بناءً على الهيكل الموحّد (Standard Response Envelope):

**للنجاح (Single Resource):**
```json
{
  "data": { "id": "...", "email": "..." }
}
```

**للنجاح مع القوائم (Paginated List):**
```json
{
  "data": [
    { "id": "..." }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 45,
    "totalPages": 5
  }
}
```

**للفشل (Error):**
```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Error description..."
  }
}
```
*(ملاحظة: نقاط الـ Endpoint التي ترجع حالة `204 No Content` لا تُرفق Envelope إطلاقاً لجفاف الرد).*

## 2. عقد الفهرسة (Pagination Contract)
أي Endpoints تُرجع قوائم (listUsers, listInvites, listAuditLogs) تتبنى بشكل إجماعي:
- **Query Params**: `page` (مثلاً يبدأ بـ 1), و `pageSize` (الأقصى المعتاد مثلا 100).
- **Response Meta**: إرجاع هيكل `page`, `pageSize`, `totalItems`, `totalPages` بشكل صريح.

## 3. خرائط رموز حالات الفشل (API Error Mapping)
سيتم محاذاة أخطاء الـ Domain والـ Application نحو الـ HTTP Status Codes التالية:
- `ValidationError` ➔ **400 Bad Request**
- `AuthenticationError` ➔ **401 Unauthorized**
- `AuthorizationError` ➔ **403 Forbidden** (لعدم كفاية الرتبة/Access Policy)
- `NotFoundError` ➔ **404 Not Found**
- `ConflictError` ➔ **409 Conflict** (مثل حالة طلب مدعو لديه Pending سابقة).
- `UnprocessableEntityError` ➔ **422 Unprocessable Entity**
- `InternalError` ➔ **500 Internal Server Error**

## 4. قرار طريقة تنقل الصلاحيات (Auth Transport Decision)
نظراً لبناء المنظومة بشكل مرن كـ Backend-First:
- **`Access Token`**: يُرسل إلي عميل الواجهة عبر الـ **Response Body**.
- **`Refresh Token`**: يُرسل أيضاً عبر الـ **Response Body**.
(ستتكفل الـ API بتمريرهما كجزئية من الكائن الـ Returned في خانة الـ `data` بحسب العقود).

---

## 5. واجهات الـ Endpoints حسب المجموعات

### المجموعة الأولى: Public Auth Endpoints (عامة بلا تسجيل)

#### A) `POST /auth/login`
1. **الهدف**: التحقق من الاعتماديات والحصول على Tokens.
2. **الـ Authentication**: لا.
3. **الـ Role المطلوبة**: Public
4. **المدخلات (Body)**: `email`, `password`.
5. **المخرجات (Data)**: `user`, `accessToken`, `refreshToken`.
6. **Success status**: `200 OK`.
7. **Failure statuses**: `400` (Validation), `401 Unauthorized`.
8. **ملاحظات**: رسالة الخطأ دائماً مجردّة `invalid credentials` سواء لم يكن الحساب ظاهراً أو معلق (suspended) لمنع فضح حالة الحساب للعلن.

#### B) `POST /auth/refresh`
1. **الهدف**: تجديد جلسة الموظف ومنحه زوج متجدد للتوكن.
2. **الـ Authentication**: لا.
3. **الـ Role المطلوبة**: Public (الـ Role تُستنبط داخلياً بالتوكن).
4. **المدخلات (Body)**: `refreshToken`.
5. **المخرجات (Data)**: `accessToken`, `refreshToken`.
6. **Success status**: `200 OK`.
7. **Failure statuses**: `400`, `401 Unauthorized` (Token invalid or sessions blocked).
8. **ملاحظات**: خاصـية الدوران (Token Rotation) مطبقة: الاسترجاع لتوكنين جُدد و إعدام المُرسل.

#### C) `POST /auth/logout`
1. **الهدف**: فك القيود وتدمير الجلسة للخروج الصريح.
2. **الـ Authentication**: نعم (`Bearer Token` للتمكن من الهوية).
3. **الـ Role المطلوبة**: أي دور.
4. **المدخلات (Body)**: `refreshToken` (لإبطالها تحديداً).
5. **المخرجات**: لا شيء مرئي.
6. **Success status**: `204 No Content`.
7. **Failure statuses**: `401 Unauthorized`.
8. **ملاحظات**: تُمنع الاستجابات المفصلة بالاكتفاء بـ 204.

#### D) `POST /auth/forgot-password`
1. **الهدف**: إصدار كشاف بريدي لتجديد الكلمة السرية المحمية.
2. **الـ Authentication**: لا.
3. **الـ Role المطلوبة**: Public.
4. **المدخلات (Body)**: `email`.
5. **المخرجات (Data)**: رسالة تأكيدية معممة (Generic message).
6. **Success status**: `200 OK`.
7. **Failure statuses**: `400` (Invalid Email).
8. **ملاحظات**: الرد دائماً معمّم، لا تستعرض الـ API ما يثبت إيجاد الرقم بالדاتابيز (User Enumeration Defense).

#### E) `POST /auth/reset-password`
1. **الهدف**: تنصيب المعنى السري الجديد للتحققات المستقبلية.
2. **الـ Authentication**: لا.
3. **الـ Role المطلوبة**: Public.
4. **المدخلات (Body)**: `token`, `newPassword`.
5. **المخرجات (Data)**: رسالة تأكيدية تبلغ بنجاح تغيير الباسورد.
6. **Success status**: `200 OK`.
7. **Failure statuses**: `400` (Bad Structure), `401 Unauthorized` (Expired/Used invite token), `422 Unprocessable`.

---

### المجموعة الثانية: دعوات الـ User Acceptance (عامة مؤقتة)

#### F) `GET /auth/invites/validate`
1. **الهدف**: كشف مدى قانونية وتأهب رابط الدعوة المعني للصفحة الرئيسية.
2. **الـ Authentication**: لا.
3. **الـ Role المطلوبة**: Public.
4. **المدخلات (Query)**: `token`.
5. **المخرجات (Data)**: `valid: true`, `email` (Original Masked), `role`, `expiresAt`.
6. **Success status**: `200 OK`.
7. **Failure statuses**: `400 Bad Request` (Not a token), `410 Gone`.
8. **ملاحظات**: الفشل برمز 410 يعبّر عن سحب، انتهاء، أو استخدام أسبق للدعوة (No longer valid invite). 

#### G) `POST /auth/invites/accept`
1. **الهدف**: استقبال كلمة المرور للاشتراك والتنصيب.
2. **الـ Authentication**: لا.
3. **الـ Role المطلوبة**: Public.
4. **المدخلات (Body)**: `token`, `fullName`, `password`.
5. **المخرجات (Data)**: `user`, `accessToken`, `refreshToken`.
6. **Success status**: `201 Created` (حيث تم بناء مستخدم).
7. **Failure statuses**: `400 Bad Request`, `410 Gone`, `409 Conflict`.

---

### المجموعة الثالثة: إدارة الدعوات للمدراء (Admin/Manager)

#### H) `POST /auth/invites`
1. **الهدف**: اختلاق وصناعة بريد لدعوات التسجيل.
2. **الـ Authentication**: نعم.
3. **الـ Role المطلوبة**: `admin` أو `manager`.
4. **المدخلات (Body)**: `email`, `role`.
5. **المخرجات (Data)**: `inviteId`, `email`, `role`, `status`, `expiresAt`, `invitedByUserId`.
6. **Success status**: `201 Created`.
7. **Failure statuses**: `400`, `403 Forbidden` (If policy blocked), `409 Conflict` (Exists pending active invite/user), `422`.

#### I) `GET /auth/invites`
1. **الهدف**: قراءة الفهارس للدعوات المستدامة.
2. **الـ Authentication**: نعم.
3. **الـ Role المطلوبة**: `admin` أو `manager`.
4. **المدخلات (Query Params)**: `page`, `pageSize`, `status`, `role`, `email`.
5. **المخرجات**: مصفوفة للـ Items + Metadata.
6. **Success status**: `200 OK`.
7. **Failure statuses**: `403 Forbidden`.

#### J) `POST /auth/invites/:inviteId/resend`
1. **الهدف**: سحب ما مضى وإرسال الدعوة بعباءة متجددة.
2. **الـ Authentication**: نعم.
3. **الـ Role المطلوبة**: `admin` أو `manager`.
4. **المدخلات (Params)**: `inviteId`.
5. **المخرجات (Data)**: معلومات الـ Invite الـ **جديدة** المستخرجة.
6. **Success status**: `200 OK` (أو 201).
7. **Failure statuses**: `403 Forbidden`, `404 Not Found`, `409 Conflict` (Not resendable).

#### K) `POST /auth/invites/:inviteId/revoke`
1. **الهدف**: إلغاء صفة الجدية على الدعوة.
2. **الـ Authentication**: نعم.
3. **الـ Role المطلوبة**: `admin` أو `manager`.
4. **المدخلات (Params)**: `inviteId`.
5. **المخرجات (Data)**: Updated invite summary.
6. **Success status**: `200 OK`.
7. **Failure statuses**: `403 Forbidden`, `404 Not Found`, `409 Conflict` (can't revoke).

---

### المجموعة الرابعة: لوحة تعديل المستخدمين (User Management)

#### L) `GET /auth/users`
1. **الهدف**: معاينة الأطقم المسجلة بالداتابيز.
2. **الـ Authentication**: نعم.
3. **الـ Role المطلوبة**: `admin` أو `manager`.
4. **المدخلات (Query Params)**: `page`, `pageSize`, `role`, `status`, `email`.
5. **المخرجات**: مصفوفة User Array + Metadata Pagination.
6. **Success status**: `200 OK`.
7. **Failure statuses**: `403 Forbidden`.

#### M) `PATCH /auth/users/:userId/role`
1. **الهدف**: ترقية الوظائف والتعديل البنيوي للطاقم.
2. **الـ Authentication**: نعم.
3. **الـ Role المطلوبة**: `admin` أو `manager`.
4. **المدخلات**: `userId` (Param), `role` (Body).
5. **المخرجات (Data)**: Updated Public User profile.
6. **Success status**: `200 OK`.
7. **Failure statuses**: `400 Bad`, `403 Forbidden` (Policy blockage), `404 Not Found`, `409 Conflict`.

#### N) `PATCH /auth/users/:userId/suspend`
1. **الهدف**: تجميد سريع ومحتم للموظف المُقصى.
2. **الـ Authentication**: نعم.
3. **الـ Role المطلوبة**: `admin` أو `manager`.
4. **المدخلات**: `userId` (Param).
5. **المخرجات**: Updated user context (Status = Suspended).
6. **Success status**: `200 OK`.
7. **Failure statuses**: `403 Forbidden`, `404 Not Found`, `409 Conflict`.
8. **ملاحظات**: التوثيق يلزم سحب Sessions كليًا (Logs out on the backend internally).

#### O) `PATCH /auth/users/:userId/reactivate`
1. **الهدف**: تحرير حساب المستخدم المحظور.
2. **الـ Authentication**: نعم.
3. **الـ Role المطلوبة**: `admin` أو `manager`.
4. **المدخلات**: `userId` (Param).
5. **المخرجات**: Updated user (Status = Active).
6. **Success status**: `200 OK`.
7. **Failure statuses**: `403 Forbidden`, `404 Not Found`, `409 Conflict` (Already Active).

---

### المجموعة الخامسة: المراجعات الدورية (Audit)

#### P) `GET /auth/audit-logs`
1. **الهدف**: الكشف المبكر لسجلات الأمن.
2. **الـ Authentication**: نعم.
3. **الـ Role المطلوبة**: `admin` + `manager` (حسب القرار بحكم الشفافية).
4. **المدخلات (Query Params)**: `page`, `pageSize`, `action`, `entityType`, `entityId`, `actorUserId`, `dateFrom`, `dateTo`.
5. **المخرجات**: مصفوفة سجلات أحداث الأمن Array of audit entries + Metadata.
6. **Success status**: `200 OK`.
7. **Failure statuses**: `403 Forbidden`.

---

## 6. قرارات عقود (API DTOs) الـ Types التوضيحية
- **Login**: `LoginRequest`, `LoginResponse`
- **Session**: `RefreshRequest`, `RefreshResponse`
- **Invite**: `AcceptInviteRequest`, `SendInviteRequest`, `InviteResponse`, `InviteListResponse`
- **Admin**: `UserListResponse`, `AuditLogListResponse`
*(تُستخدم فقط على مستوى الـ Controllers لحماية الـ Domain objects من الخروج مباشر للإنترنت).*
