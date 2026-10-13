# Taj-Platform — Backend Code Review

**تاريخ الفحص:** 12 أكتوبر 2026  
**المستودع:** [Ammar-1993/Taj-Platform](https://github.com/Ammar-1993/Taj-Platform)  
**الفرع:** `main`  
**Commit المفحوص:** [`7b6cc848ec2bd84e60958bc456c98ad85f982256`](https://github.com/Ammar-1993/Taj-Platform/commit/7b6cc848ec2bd84e60958bc456c98ad85f982256)  
**آخر commit:** `fix(auth): prevent RouteNotFoundException by forcing API JSON responses and defining named login fallback` — 12 أكتوبر 2026 00:59:06 UTC.

## 1. نطاق المراجعة والمنهجية

أُعيد جلب بيانات المستودع وشجرة الملفات من `main` الحالي، ثم فُحصت ملفات التنفيذ الأساسية في `backend/`: المسارات وControllers وServices وModels وForm Requests، وترحيلات قاعدة البيانات، وJobs وEvents، والإعدادات، وموارد Filament ذات الأثر المالي، والاختبارات، وDocker وGitHub Actions. يحتوي مجلد الباك إند على **263 ملفًا** ضمن الشجرة المفحوصة، ويشمل ذلك ملفات التطبيق والاختبارات والاعتمادات والملفات المجمعة.

قورنت النسخة الحالية بالنسخة المفحوصة سابقًا (`19ab7a4686586ec74551e99bc4407066ab236604`). أحدث 10 commits تركز أساسًا على تشغيل Redis/Queue، ورؤوس Nginx، ومعالجة مسار الضيف غير المسجل؛ ولم تغيّر تدفقات الدفع الأساسية أو انتقالات الحجز التي تظهر أدناه.

هذه **مراجعة ساكنة للكود وإعدادات المستودع** وليست اختبار اختراق حيًا. لم أعدّل المستودع. سجل CI الحالي فُحص مباشرة، وهو يكشف مشكلة في تشغيل الاختبارات موضّحة أدناه.

## 2. الخلاصة التنفيذية

**التوصية الحالية: لا تعتمد هذه النسخة للإنتاج المالي قبل إغلاق P0 وإصلاح بوابة الاختبارات.** توجد بنية Laravel عملية يمكن البناء عليها، لكن سلامة الدفع وتدفق دورة حياة الحجز والصلاحيات ليست محكمة بما يكفي.

| المجال | التقييم |
|---|---|
| التصميم العام | Modular Monolith مناسب، وحدود الطبقات غير متسقة |
| SOLID | تطبيق جزئي؛ بعض Controllers وFilament وModels تتولى مسؤوليات مجال وبنية تحتية معًا |
| DDD | بداية تنظيم حول Services، دون نموذج مجال موحد لحالات الحجز والدفعات والسحب |
| الأمان | ضوابط مفيدة، مع عيوب حرجة في التحقق المالي والتوكنات وعزل الصلاحيات |
| سلامة الأموال | غير كافية للاعتماد الإنتاجي حاليًا |
| موثوقية CI/CD | غير موثوقة حاليًا؛ الاختبارات لم تُنفذ في آخر تشغيل رغم نجاح الـ workflow |

**نقاط قوة مثبتة:** استخدام `DB::transaction` و`lockForUpdate` في بعض مسارات الحجز والمحفظة، قيد فريد لملخص الحصة حسب الحجز، تشفير IBAN عبر Laravel encrypted cast، وظائف خلفية للفصل والملخص، استخدام Form Requests، حماية دخول لوحة Filament بدور admin، واختبارات Feature وUnit تغطي عدة مسارات.

---

## 3. النتائج مرتبة حسب الخطورة

### P0 — التحقق من توقيع Webhook يعمل بنمط Fail-open

**الملف:** [`PaymentController.php`](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/app/Http/Controllers/Api/PaymentController.php#L199-L255) — خصوصًا السطر 206.

```php
if ($webhookSecret && $signature) {
    // التحقق من التوقيع
}
```

يتحقق الكود من التوقيع فقط إذا كان السر والتوقيع موجودين معًا. عند غياب السر أو التوقيع يتجاوز التحقق ويكمل مسار الويب هوك. بعد ذلك تُقرأ حالة الدفع والمبلغ من جسم الطلب؛ وعند غياب metadata، يجلب الكود بيانات الفاتورة لكنه لا يضمن أن جميع القيم المالية المستخدمة لاحقًا مستبدلة بالقيم المؤكدة من Moyasar.

**الأثر:** إذا وصل الطلب إلى المسار بالإعدادات/الرؤوس غير المكتملة، لا يوجد رفض إلزامي قبل المعالجة المالية، ويمكن أن يُستخدم مبلغ غير موثوق لإضافة رصيد.

**الإصلاح المطلوب:** رفض أي webhook عند غياب السر أو التوقيع أو فشل المقارنة الثابتة؛ التحقق من الدفع عبر Moyasar عند الحاجة؛ ومطابقة معرّف الدفع والمبلغ والعملة والحالة ومالك الفاتورة قبل تعديل المحفظة. لا تستخدم `data.amount` الوارد وحده كحقيقة مالية.

### P0 — عدم وجود Idempotency مالي موثوق؛ احتمال تكرار الشحن

**الملف:** [`PaymentController.php`](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/app/Http/Controllers/Api/PaymentController.php#L130-L166) للتحقق اليدوي و[الويب هوك](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/app/Http/Controllers/Api/PaymentController.php#L224-L255).

التحقق اليدوي يبحث عن الدفع السابق عبر `description LIKE '%id%'`، وهو نص غير فريد وليس قيدًا ذريًا. يمكن لطلبين متزامنين اجتياز الفحص ثم تنفيذ الإيداع مرتين. مسار الويب هوك لا يطبق حتى فحصًا مماثلًا، لذلك يمكن أن يكرر الشحن عند وصول webhook مع طلب التحقق اليدوي أو إعادة إرسال الحدث.

**الإصلاح المطلوب:** جدول `payment_records` أو ما يعادله يتضمن `provider`, `provider_payment_id` بقيد `UNIQUE`, والمبلغ والعملة والحالة ووقت التأكيد. يُعالج الويب هوك والتحقق اليدوي عبر خدمة واحدة وداخل معاملة؛ ويكون إدخال الدفعة الفريدة هو بوابة idempotency، لا وصف المعاملة النصي.

### P0 — الفصل الافتراضي يمكن أن يصدر توكنات بعد إلغاء الحجز، وقد يعاد فتح الحالة

**الملف:** [`ClassroomController.php`](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/app/Http/Controllers/Api/ClassroomController.php#L33-L61) و[BookingService.php](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/app/Services/BookingService.php#L121-L165).

نقاط دخول الفصل والتحقق من حالة السبورة وتجديد التوكن تتحقق من هوية المشارك، لكنها لا تفرض أن حالة الحجز ما زالت تسمح بالدخول. كما يحدّث مسار دخول المعلم الحالة إلى `in_progress` عند عدم وجود `teacher_joined_at` من دون شرط على الحالة السابقة. وخدمة الإكمال تسمح بالحالات غير `completed` و`cancelled` و`refunded`، لذا تسمح أيضًا بالإكمال من `scheduled`.

**الأثر:** قد يصل مشارك إلى فصل ملغى، وقد يعيد دخول المعلم حجزًا مجدولًا ملغيًا إلى `in_progress`. كما يستطيع المعلم صاحب الحجز استدعاء endpoint الإكمال على حجز `scheduled` قبل انعقاد الحصة وصرف حصة المعلم (`80%`)؛ Controller لا يشترط أن يكون الحجز `in_progress`.

**الإصلاح المطلوب:** سياسة `ClassroomPolicy` مركزية تفحص حالة الحجز ونافذة الموعد؛ انتقالات حالة مسموح بها فقط من حالات محددة داخل معاملة مقفلة؛ الإكمال العادي يقتصر على `in_progress` ويجب أن يُراعى دليل حضور/انتهاء الجلسة. اجعل إصدار وتجديد RTC/RTM/Whiteboard tokens تابعًا لنفس السياسة. افصل موافقة الإدارة على الحالات المهجورة عن الإكمال العادي.

### P0 — بوابة CI لا تشغّل الاختبارات فعليًا

**الملف:** [`.github/workflows/deploy-backend.yml`](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/.github/workflows/deploy-backend.yml#L34-L46).  
**تشغيل GitHub Actions الحالي:** [Run 38190182994](https://github.com/Ammar-1993/Taj-Platform/actions/runs/38190182994).

الخطوة تنفذ:

```bash
php artisan test --graceful || true
```

سجل تشغيل 12 أكتوبر 2026 يوضح أن PHPUnit أعاد `Unknown option "--graceful"`. ثم أخفى `|| true` رمز الخروج غير الناجح، وظهرت خطوة الاختبارات والـ workflow باللون الأخضر؛ لم يظهر في السجل تنفيذ فعلي للاختبارات.

**الأثر:** النشر يستطيع الاستمرار حتى عند عدم تنفيذ الاختبارات أو فشلها، ولا تعد حالة نجاح الـ workflow دليلًا على اجتياز الاختبارات.

**الإصلاح المطلوب:** استخدام `php artisan test` دون `|| true` أو خيار PHPUnit غير مدعوم؛ إيقاف النشر عند أي فشل؛ إضافة فحص lint/static analysis عند اعتماده؛ واختبارات MySQL تكاملية لمسارات الأقفال والتزامن، لا SQLite فقط.

### P1 — الطالب يستطيع تجاوز إعداد ولي الأمر لمنع الحجز المستقل

**الملف:** [`ProfileController.php`](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/app/Http/Controllers/Api/ProfileController.php#L100-L124).

`completeStudentProfile()` يحدّث `can_book_independently` إلى `true` كلما أرسل الطالب ملف المرحلة الدراسية. في المقابل، `StoreBookingRequest` يعتمد على هذا الحقل لمنع الطالب المرتبط بولي أمر من الحجز المباشر عند تعطيل ولي الأمر الصلاحية.

**الأثر:** يستطيع الطالب إعادة تفعيل الصلاحية عبر API وتجاوز قرار ولي الأمر.

**الإصلاح المطلوب:** عدم تعديل حقل التفويض في مسار ملف الطالب؛ حصر تغييره في endpoint ولي الأمر وسياسة تفويض، وإضافة اختبار يثبت أن الطالب لا يستطيع إعادة تفعيله.

### P1 — حقول مستخدم داخلية قد تُعرض في API الاكتشاف العام

**الملفات:** [`DiscoveryController.php`](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/app/Http/Controllers/Api/DiscoveryController.php#L87-L153)، [مواعيد المعلم](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/app/Http/Controllers/Api/DiscoveryController.php#L155-L190)، و[`User.php`](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/app/Models/User.php#L24-L42).

الاستعلام يستخدم `User::select('users.*')` ويرجع نماذج Eloquent مباشرة. `User::$hidden` يخفي `password` و`remember_token` فقط، لكنه لا يخفي `last_login_ip` و`last_login_at` و`parent_id` و`metadata` وحقول أخرى. ومسار مواعيد المعلم يعيد كائن `$teacher` كاملًا.

**الأثر:** يمكن أن تتسرب بيانات تشغيلية لا يحتاجها الجمهور، خصوصًا IP آخر تسجيل دخول وmetadata وارتباط ولي الأمر.

**الإصلاح المطلوب:** إرجاع `TeacherResource` أو DTO بقائمة سماح واضحة، وتقييد الحقول المختارة في public API؛ واختبارات assertions تضمن خلو الاستجابة من حقول داخلية.

### P1 — API إنشاء المواعيد لا يفرض دور المعلم وفحص التداخل ليس ذريًا

**الملف:** [`TeacherSlotController.php`](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/app/Http/Controllers/Api/TeacherSlotController.php#L43-L86) و[`routes/api.php`](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/routes/api.php#L108-L114).

المسار داخل `auth:sanctum` فقط ولا يفرض `teacher` role أو أن المعلم موثق ونشط. فحص التداخل يسبق الإدخال ولا توجد حماية ذرية تربط الفحص بالإدراج؛ لذلك يمكن لطلبين متزامنين إنشاء فترتين متداخلتين. كذلك فحص الوقت المستقبلي لا يضمن اتساقًا كاملًا مع منطقة زمنية/تاريخ الحصة.

**الإصلاح المطلوب:** `TeacherSlotPolicy`/FormRequest، التأكد من أن المعلم نشط وموثق وأن الموعد مستقبلي؛ ثم حماية التداخل بقفل صف تنسيق للمعلم/اليوم أو آلية حصرية مناسبة لقاعدة البيانات واختبارات تزامن MySQL.

### P1 — إجراءات رفض السحب قد تعيد الأموال أكثر من مرة

**الملف:** [`PayoutRequestResource.php`](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/app/Filament/Resources/PayoutRequestResource.php#L145-L190).

الرفض يحدّث حالة السحب ويعيد المال من داخل closure في واجهة Filament. لا توجد خدمة مجال واحدة تتحقق من الحالة الحالية بقفل؛ والظهور في الواجهة على أنه `pending` لا يمنع طلبين إداريين متزامنين باستخدام سجل قديم من كلاهما إعادة الإيداع. الاعتماد والتحويل الجماعي يحدّثان الحالات مباشرة أيضًا.

**الإصلاح المطلوب:** `PayoutService::approve/reject/markTransferred`، مع `lockForUpdate` وإعادة التحقق من الحالة داخل المعاملة، وحركة مالية فريدة مرتبطة بـ `payout_request_id` لضمان الاسترداد مرة واحدة.

### P1 — الحساب المعطّل قد يحتفظ بالوصول عبر توكن سابق

**الملفات:** [`AuthController.php`](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/app/Http/Controllers/Api/AuthController.php#L49-L88)، [إعادة تعيين كلمة المرور](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/app/Http/Controllers/Api/AuthController.php#L121-L150)، و[`sanctum.php`](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/config/sanctum.php#L45-L60).

فحص `is_active` يحدث عند تسجيل الدخول فقط. إعداد Sanctum لا يحدد مدة انتهاء افتراضية للتوكن، ومسار إعادة تعيين كلمة المرور لا يلغي توكنات الوصول الحالية صراحةً. لذلك قد يستمر حساب معطّل أو غُيّرت كلمة مروره في استخدام توكن قائم ما لم يُلغَ منفصلًا.

**الإصلاح المطلوب:** middleware يرفض الحساب غير النشط في كل طلب محمي، وإلغاء توكنات المستخدم بعد reset/password change أو تعطيل الحساب، مع سياسة انتهاء صلاحية ودوران موثقة.

### P1 — تذكرة الدعم يمكن ربطها بحجز لا يخص مقدم الطلب

**الملف:** [`routes/api.php`](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/routes/api.php#L130-L151).

يُتحقق من أن `booking_id` موجود فقط، ثم يُربط بالتذكرة للمستخدم الحالي دون التحقق من كونه الطالب أو المعلم أو ولي الأمر المرتبط بالحجز. هذا يتيح تزوير ارتباطات التذاكر ويشوّش إجراءات الدعم.

**الإصلاح المطلوب:** استخدام Policy أو query scoped تضمن أن الحجز ضمن نطاق مقدم الطلب، أو السماح بتذكرة عامة بلا `booking_id`.

### P1 — نموذج الحركات المالية لا يوفر مرجعًا فريدًا ولا يحافظ على الدقة المالية المثلى

**الملفات:** [`WalletService.php`](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/app/Services/WalletService.php)، [`wallet_transactions migration`](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/database/migrations/2026_03_06_235445_create_wallet_transactions_table.php)، و[`BookingService.php`](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/app/Services/BookingService.php#L150-L166).

الخدمة تستقبل `float`، وتحدّث رصيدًا mutable، وتسجل مقدارًا موجبًا دائمًا في `amount` مع الاعتماد على نص `type` لمعرفة اتجاه الحركة. جدول المعاملات لا يملك `provider_reference` فريدًا أو معرف idempotency أو عملة/مرجعًا واضحًا لمعاملة الدفع. عمولة المعلم 80% ثابتة داخل الخدمة.

**الإصلاح المطلوب:** تمثيل المبالغ بوحدات العملة الصغرى الصحيحة (halalas) أو Value Object دقيق؛ سجل مالي غير قابل للتعديل/append-only بمرجع خارجي فريد، وحقول صريحة للاتجاه والحالة، وسياسة عمولة مستقلة ومؤرخة. لا يتطلب ذلك إعادة كتابة فورية كاملة، لكنه شرط لتقوية التدقيق المالي.

---

## 4. نتائج إضافية (P2)

1. **إرسال آثار جانبية قبل commit:** `backend/config/queue.php` مضبوط على `after_commit => false` لاتصال Redis، بينما يجري إطلاق `BookingCreated` وإشعار المعلم من داخل معاملة `createBooking`. قد ينفذ العامل الحدث قبل ثبات سجل الحجز أو يبث حدثًا عن معاملة تراجعت. استخدم `afterCommit()` أو outbox pattern.
2. **توكن Agora:** [`AgoraService::refreshTokens()`](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/app/Services/AgoraService.php#L102-L126) يصدر RTC token بدور `publisher` دائمًا، حتى لو كان طالبًا/ولي أمر مصنفًا audience. يجب تمرير دور صريح والتحقق منه بدل boolean `isTeacher`، وربط التجديد بحالة الحجز. هذا يتداخل مع P0 الخاص بدخول الفصل.
3. **إعادة إرسال الاختبار:** [`SessionSummaryController.php`](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/app/Http/Controllers/Api/SessionSummaryController.php#L142-L207) يسمح للدافع/ولي الأمر بالإرسال رغم نص الرسالة الذي يقول إن الاختبار للطالب، كما لا يمنع إعادة الإرسال بعد `completed_at`. افصل الصلاحيات وفرض invariant ذري للإكمال.
4. **تاريخ الحجز:** `BookingService::createBooking()` يضع `booking_date => now()` بدل تاريخ الموعد من `TeacherSlot`. هذا يخلط وقت إنشاء الحجز بوقت الدرس ويؤثر في البحث والتقارير والعرض الإداري.
5. **كود الخصم:** فحص `PromoCode::isValid()` ثم `increment('used_count')` ليس ذريًا تحت التزامن. إذا انتهى الحد الأقصى بالتزامن، فقد يتم تجاوز `max_uses`. كذلك يجب توضيح سياسة رفض الكود غير الصالح بدل تجاهله، والتأكد من ربط الكود بالحجز وتسجيل أثر الخصم.
6. **السجلات المالية:** Webhook يسجل `$request->all()` ويكتب metadata وتفاصيل استجابة مزود الدفع. قلّل السجلات إلى معرفات ومعطيات منقحة، ولا تسجل بيانات لا يحتاجها التشخيص.
7. **رسائل أخطاء الدفع:** مسار إنشاء الفاتورة يعيد `moyasar_error_details`، وفي حالة استثناء يعيد `exception_details`. أرجع رمز خطأ عام للعميل وسجل التفاصيل المنقحة داخل الخادم.
8. **Reset password:** التحقق من `exists:users,email` في endpoint نسيان/إعادة تعيين كلمة المرور يتيح استنتاج ما إذا كان البريد مسجلًا، والمسارات لا يظهر عليها middleware rate limit مخصص. استخدم ردًا موحدًا وحدود معدل مناسبة.
9. **Proxy trust/rate limit:** `trustProxies(at: '*')` مع محدد دخول معتمد على `$request->ip()` يحتاج مراجعة إعداد الـ reverse proxy وجدار الحماية، خصوصًا أن Docker ينشر منفذ API على `8082` دون ربط loopback. إذا كان الوصول مباشرًا ممكنًا، قد تُزوّر ترويسات forwarded IP لتجاوز الحد.
10. **Redis مشتركة للـ Queue والـ Cache:** `volatile-lru` مع `maxmemory 128mb` يمكن أن يزيل مفاتيح مؤقتة مثل cache locks عند ضغط الذاكرة، ما قد يسمح بتكرار وظائف مقفلة. في المقابل يمكن أن تبقى مفاتيح Queue غير قابلة للإخلاء وتسبب رفض الكتابة عند الامتلاء. افصل cache عن queue أو راجع eviction policy والسعة والتنبيهات.
11. **Queue restart polling:** `Queue::withoutInterruptionPolling()` يعطل فحص إشارات restart/pause القياسية للعامل (ويظهر ذلك في اختبارات الوحدة). هذا قرار تشغيلي مقصود لتقليل استطلاع الكاش، لكنه يعني أن `queue:restart` التقليدي لن يكون وسيلة إعادة تحميل موثوقة؛ وثّق ذلك واعتمد آلية إعادة تشغيل مضمونة.
12. **KYC URL fallback:** [`TeacherProfile.php`](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/app/Models/TeacherProfile.php#L79-L100) يعود إلى `disk->url($path)` عندما يفشل `temporaryUrl()`. إذا كان إعداد التخزين يسمح بروابط عامة، فقد يتجاوز هذا الفشل-المفتوح خصوصية الهوية والشهادة. يجب فشل الطلب بأمان وعدم الرجوع إلى رابط دائم، وتثبيت اسم قرص KYC الخاص صراحةً.
13. **معالجة أخطاء الإنتاج:** [`bootstrap/app.php`](https://github.com/Ammar-1993/Taj-Platform/blob/7b6cc848ec2bd84e60958bc456c98ad85f982256/backend/bootstrap/app.php) يتجاهل أنواعًا من `TypeError` وأخطاء Redis حسب أجزاء من الرسالة على نطاق عام. ضيّق الاستثناءات إلى سياقات مؤكدة حتى لا تختفي عيوب حقيقية من مراقبة الإنتاج.
14. **الاختبارات وقاعدة البيانات:** PHPUnit مضبوط على SQLite في الذاكرة، وCI لا يشغّل الاختبارات حاليًا. SQLite لا يثبت سلوك `lockForUpdate` وتعارضات التزامن نفسها الموجودة في MySQL. أضف اختبارات تكامل MySQL فعلية للدفع، الحجز، أقفال المحفظة والسحب، وتداخل المواعيد.
15. **تكرار ملفات Controllers:** توجد Controllers عامة قديمة خارج `Api/` إلى جانب Controllers الحالية. مع اعتماد المسارات الحالية على مجموعة محددة، راجع هذه الملفات لتحديد ما هو legacy فعليًا، ثم احذف غير المستخدم أو وثّق حدود استخدامه لتقليل وجود أكثر من مكان محتمل لمنطق المجال.

## 5. تحليل Architecture وSOLID وDDD

### Architecture

الباك إند أقرب إلى **Laravel Service-Layer Monolith** منه إلى Clean Architecture كاملة. هناك فصل مفيد إلى Services وModels وControllers، لكن بعض المسؤوليات ما زالت في `routes/api.php` closures وFilament action closures، وبعض قواعد المجال (الصلاحيات وانتقالات الحالات) موزعة بين Controller وService. لا أوصي بتقسيمه إلى Microservices ولا بإعادة هيكلة المجلدات كلها قبل إصلاح الأموال والصلاحيات.

### SOLID

- **SRP:** `PaymentController` يجمع إنشاء الفاتورة والتحقق اليدوي والويب هوك والتحقق من الملكية وتعديل المحفظة. `BookingService` ينسق الحجز والخصومات والمحفظة والإشعارات والفصل. وFilament يحتوي منطق حالات السحب المالي.
- **OCP/DIP:** مزود الدفع وAgora وWhiteboard متصلون مباشرة في الخدمات/Controllers بدل عقود مثل `PaymentGateway` و`VideoTokenProvider` عند الحاجة لاختبار وتبديل المزود. ينبغي استخراج العقود مع حالات استخدام مالية، لا بناء طبقات شكلية لجميع الخدمات.
- **ISP/LSP:** لا توجد أدلة كافية على مخالفات مباشرة تستدعي إعادة تصميم واسعة؛ الأولوية للحدود المالية والتفويض.

### DDD

توجد مفاهيم مجال واضحة (Booking, Wallet, Payout, PromoCode)، لكن لا توجد آلة حالات مركزية للحجز أو الدفع والسحب. الحالة تُخزن كنصوص/enum في قاعدة البيانات وتُفحص في مواضع عدة. توصية عملية:

1. `BookingStatus` و`BookingStateTransition` مع شروط انتقال محددة.
2. حالات استخدام واضحة: `CreateBooking`, `CompleteBooking`, `CancelBooking`, `ConfirmPayment`, `RejectPayout`.
3. `PaymentRecord` و`WalletLedgerEntry` مع مراجع فريدة وقواعد عدم التكرار.
4. Policies مركزية لـ Booking/Classroom/TeacherSlot/Quiz/Payout/SupportTicket.
5. Events/Listeners بعد commit أو Outbox لضمان عدم نشر أحداث لمعاملات متراجعة.

---

## 6. خطة الإصلاح حسب ترتيب المخاطر

### PR 1 — سلامة النشر
- حذف `--graceful || true` واستبداله بأمر اختبار مدعوم يفشل CI عند الفشل.
- تثبيت host key لخادم SSH وإزالة `StrictHostKeyChecking=no` باستخدام `known_hosts` موثوق.
- إضافة MySQL integration job؛ لا تجعل نشر backend يعتمد على SQLite فقط.
- تحقق أن سجلات CI تحتوي فعليًا على ملخص PHPUnit وعدد الاختبارات.

### PR 2 — الدفع وIdempotency
- fail-closed webhook signature.
- إنشاء Payment record بمرجع provider فريد.
- توحيد webhook وmanual verify في خدمة `ConfirmPayment`.
- جلب/مطابقة المبلغ والعملة والحالة ومعرّف الفاتورة من Moyasar.
- اختبارات: توقيع مفقود/خاطئ، مبلغ أو عملة غير متطابقين، webhook مكرر، تزامن webhook والتحقق اليدوي.

### PR 3 — الحجز والفصل
- إضافة state transition policy.
- منع access/refresh tokens للحجز الملغي/المسترد/المكتمل، وعدم تغيير الحالة خارج انتقال مسموح.
- منع إكمال `scheduled` مباشرة عبر API؛ الإكمال العادي من `in_progress` فقط.
- إصدار Agora token حسب دور مشارك صريح.
- اختبار سيناريو: إلغاء الحجز ثم محاولة الدخول والإكمال؛ يجب ألا يصدر توكن وألا تُصرف أرباح.

### PR 4 — صلاحيات المستخدمين والمواعيد
- إزالة تغيير `can_book_independently` من endpoint ملف الطالب.
- فرض دور المعلم وحالة التوثيق/النشاط على إنشاء الموعد والحجز.
- معالجة تداخل المواعيد بطريقة ذرية واختبار متزامن على MySQL.
- إنشاء API Resources بدل تسلسل `User` مباشرة في الاستجابات العامة.
- تحقق من ملكية booking قبل ربطه بتذكرة دعم.

### PR 5 — السحب والسجل المالي
- استخراج transitions في `PayoutService` بما فيها reject/refund وtransfer.
- منع إعادة رد الرصيد باستخدام مرجع فريد لقيد الاسترداد وقفل `payout_request`.
- اعتماد مبالغ صحيحة بالهللات وتوثيق قيد المنصة والعمولة.
- جعل ledger هو سجل الحقيقة لتفسير الرصيد، وإضافة أدوات reconciliation بين سجل الدفعات والرصيد.

### PR 6 — التشغيل ومراقبة الإنتاج
- مراجعة `after_commit` وآثار Events داخل المعاملات.
- مراجعة Redis memory/eviction/failover وQueue restart behavior.
- إلغاء fallback الآمن-ظاهري لروابط KYC العامة.
- تقييد proxy trust، وتوحيد رسائل reset password وrate limits.

## 7. Definition of Done

لا يُغلق الإصلاح حتى تثبت الاختبارات الآتي:

- Webhook لا يقبل طلبًا دون توقيع صالح وإعداد سر صالح.
- إعادة إرسال نفس معرف دفع، حتى بالتزامن، تضيف رصيدًا مرة واحدة فقط.
- لا يمكن لمعلم إكمال حجز مجدول قبل انعقاد الدرس.
- الحجز الملغي أو المسترد لا يصدر أي Agora/Whiteboard tokens ولا يعود إلى `in_progress`.
- طالب لا يستطيع تفعيل الحجز المستقل بعد أن يعطله ولي الأمر.
- غير المعلم لا يستطيع إنشاء موعد؛ وطلبان متزامنان لا ينشئان مواعيد متداخلة.
- رفض السحب يرد المبلغ مرة واحدة فقط حتى مع التزامن.
- public teacher APIs لا تكشف IP أو metadata أو `parent_id` أو حقولًا داخلية.
- يتوقف CI والنشر عند فشل الاختبارات، وتظهر سجلات PHPUnit عدد الاختبارات والنتيجة.
- اختبارات التزامن المالية تعمل على MySQL فعلي، لا على SQLite فقط.

## الحكم النهائي

الهيكل الحالي قابل للتحسين دون إعادة كتابة شاملة، لكن مستوى التنفيذ الإنتاجي أقل من المطلوب لمنصة تحرّك أرصدة مالية وتصدر توكنات وصول لفصول حية. الأولوية ليست إعادة تسمية المجلدات أو إضافة طبقات DDD شكلية؛ بل حماية التحقق المالي، منع التكرار، فرض دورة حياة الحجز، تثبيت الصلاحيات، وجعل CI يثبت فعلًا أن الاختبارات تعمل.
