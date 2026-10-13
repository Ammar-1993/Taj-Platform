<?php

namespace App\Http\Requests\Booking;

use App\Models\TeacherSlot;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var User $user */
        $user = $this->user();

        // 1. إذا كان المستخدم ولي أمر، مسموح له يحجز لأبنائه
        if ($user->hasRole('parent')) {
            return true;
        }

        // 2. إذا كان المستخدم طالب
        if ($user->hasRole('student')) {
            // إذا كان الطالب يتبع لولي أمر، نتحقق من الصلاحية
            if ($user->parent_id !== null) {
                return $user->studentProfile && $user->studentProfile->can_book_independently;
            }

            // إذا كان طالب مستقل (سجل بنفسه بدون أب) مسموح له
            return true;
        }

        return false;
    }

    // رسالة مخصصة تظهر إذا حاول الابن الحجز والصلاحية معطلة
    protected function failedAuthorization()
    {
        throw new AuthorizationException('عفواً، حسابك غير مصرح له بالحجز والدفع المباشر. يرجى الطلب من ولي الأمر تفعيل الصلاحية.');
    }

    public function rules(): array
    {
        return [
            'teacher_slot_id' => ['required', 'exists:teacher_slots,id'],
            'promo_code' => ['nullable', 'string', 'exists:promo_codes,code'],
            'child_id' => ['nullable', 'exists:users,id'], // إضافة حقل الابن
        ];
    }

    // تحقق أمني إضافي مخصص لولي الأمر
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->user()->hasRole('parent')) {
                if (! $this->child_id) {
                    $validator->errors()->add('child_id', 'يجب اختيار الابن المراد الحجز له.');
                } else {
                    $child = User::where('id', $this->child_id)
                        ->where('parent_id', $this->user()->id)
                        ->first();

                    if (! $child) {
                        $validator->errors()->add('child_id', 'الابن المختار غير صالح أو لا يتبع لك.');
                    }
                }
            }

            if ($this->teacher_slot_id) {
                $slot = TeacherSlot::with('teacher.teacherProfile')->find($this->teacher_slot_id);
                if ($slot && $slot->teacher) {
                    if (! $slot->teacher->is_active) {
                        $validator->errors()->add('teacher_slot_id', 'المعلم صاحب هذا الموعد غير نشط حالياً.');
                    }
                    if ($slot->teacher->teacherProfile && ! $slot->teacher->teacherProfile->is_verified) {
                        $validator->errors()->add('teacher_slot_id', 'المعلم صاحب هذا الموعد غير موثق بعد.');
                    }
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'teacher_slot_id.exists' => 'عفواً، الموعد المطلوب غير موجود.',
            'promo_code.exists' => 'كود الخصم المدخل غير صحيح.',
        ];
    }
}
