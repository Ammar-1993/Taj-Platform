<?php

namespace App\Http\Requests\Whiteboard;

use Illuminate\Foundation\Http\FormRequest;

/**
 * DrawingBatchRequest
 *
 * يتحقق من صحة دفعة الرسم المُرسَلة من المعلم إلى السبورة التفاعلية.
 *
 * الحقول المطلوبة:
 *  - points : مصفوفة من الإحداثيات، كل عنصر يحمل x و y (أرقام صحيحة)
 *  - color  : لون الفرشاة بصيغة HEX (اختياري، افتراضي: '#000000')
 *  - width  : سُمك الفرشاة بالبكسل (اختياري، افتراضي: 4)
 */
class DrawingBatchRequest extends FormRequest
{
    /**
     * المعلم الذي يمتلك صلاحية إرسال ضربات الرسم —
     * يتم التحقق من الدور على مستوى الـ Controller وليس هنا،
     * لذا نسمح للجميع المصادَق عليهم بتمرير الـ validation.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * قواعد التحقق من صحة البيانات.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // مصفوفة النقاط: مطلوبة، يجب أن تكون مصفوفة، وحدها الأدنى نقطة واحدة
            'points'    => ['required', 'array', 'min:1'],

            // كل نقطة: مصفوفة تحتوي على x و y
            'points.*'  => ['required', 'array'],
            'points.*.x' => ['required', 'numeric'],
            'points.*.y' => ['required', 'numeric'],

            // لون الفرشاة: اختياري، يجب أن يكون قيمة HEX (#RRGGBB)
            'color' => ['sometimes', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],

            // سُمك الفرشاة: اختياري، عدد صحيح بين 1 و 100
            'width' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }

    /**
     * رسائل الخطأ المُخصَّصة بالعربية.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'points.required' => 'يجب توفير نقاط الرسم.',
            'points.array'    => 'يجب أن تكون نقاط الرسم مصفوفة.',
            'points.min'      => 'يجب توفير نقطة رسم واحدة على الأقل.',
            'points.*.x.required' => 'كل نقطة رسم يجب أن تحتوي على قيمة x.',
            'points.*.y.required' => 'كل نقطة رسم يجب أن تحتوي على قيمة y.',
            'color.regex'     => 'يجب أن يكون اللون بصيغة HEX (#RRGGBB).',
            'width.integer'   => 'يجب أن يكون سُمك الفرشاة رقمًا صحيحًا.',
            'width.min'       => 'يجب أن يكون سُمك الفرشاة أكبر من صفر.',
            'width.max'       => 'سُمك الفرشاة لا يمكن أن يتجاوز 100.',
        ];
    }
}
