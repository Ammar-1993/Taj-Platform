<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['bail', 'required', 'string', 'email', 'max:255', 'unique:users'],
            'phone' => ['bail', 'required', 'string', 'max:20', 'unique:users'],
            'password' => ['required', 'string', 'min:8'],
            // نقبل فقط هذه الأدوار عند التسجيل العام
            'role' => ['required', 'in:student,parent,teacher'], 
        ];

        // في البيئة المحلية، نجعل التوكن اختيارياً لتسهيل التطوير بدون مفاتيح حقيقية
        if (!app()->environment('local')) {
            $rules['recaptcha_token'] = ['required', 'string'];
        }

        return $rules;
    }

    /**
     * التحقق من reCAPTCHA قبل معالجة باقي الحقول لزيادة الأمان
     */
    protected function prepareForValidation()
    {
        // يمكننا التحقق هنا يدوياً إذا أردنا إيقاف التنفيذ فوراً قبل الـ rules
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->has('recaptcha_token')) {
                $recaptcha = app(\App\Services\RecaptchaService::class);
                if (!$recaptcha->verify($this->recaptcha_token, $this->ip())) {
                    $validator->errors()->add('recaptcha_token', 'فشل التحقق من reCAPTCHA. يرجى المحاولة مرة أخرى.');
                }
            }
        });
    }
}