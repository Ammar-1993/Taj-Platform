<?php

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var \App\Models\User|null $user */
        $user = $this->user();

        // مسموح فقط للطلاب أو الآباء بإنشاء حجز
        return $user && $user->hasAnyRole(['student', 'parent']);
    }
    

    public function rules(): array
    {
        return [
            'teacher_slot_id' => ['required', 'integer', 'exists:teacher_slots,id'],
            'promo_code' => ['nullable', 'string', 'exists:promo_codes,code'],
            // parent_student_id يُستخدم فقط إذا كان الأب هو من يحجز لابنه
            'parent_student_id' => ['nullable', 'integer', 'exists:users,id'], 
        ];
    }
    
    public function messages(): array
    {
        return [
            'teacher_slot_id.exists' => 'عفواً، الموعد المطلوب غير موجود.',
            'promo_code.exists' => 'كود الخصم المدخل غير صحيح.',
        ];
    }
}