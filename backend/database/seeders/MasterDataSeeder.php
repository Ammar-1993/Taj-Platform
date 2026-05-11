<?php

namespace Database\Seeders;

use App\Models\GradeLevel;
use App\Models\PromoCode;
use App\Models\Subject;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. زرع المراحل الدراسية وأسعارها الافتراضية للحصة
        $grades = [
            'primary' => GradeLevel::create(['name' => 'المرحلة الابتدائية', 'session_price' => 50.00, 'is_active' => true]),
            'middle' => GradeLevel::create(['name' => 'المرحلة المتوسطة', 'session_price' => 70.00, 'is_active' => true]),
            'secondary' => GradeLevel::create(['name' => 'المرحلة الثانوية', 'session_price' => 100.00, 'is_active' => true]),
            'competitive' => GradeLevel::create(['name' => 'القدرات والتحصيلي', 'session_price' => 150.00, 'is_active' => true]),
        ];

        // 2. زرع المواد الدراسية وربطها بالمراحل
        $subjectMappings = [
            'primary' => ['الرياضيات (ابتدائي)', 'اللغة العربية', 'العلوم'],
            'middle' => ['الرياضيات (متوسط)', 'اللغة الإنجليزية', 'الحاسب الآلي'],
            'secondary' => ['الفيزياء', 'الكيمياء', 'الأحياء', 'الرياضيات (ثانوي)'],
            'competitive' => ['القدرات - كمي', 'القدرات - لفظي', 'التحصيلي - علمي'],
        ];

        foreach ($subjectMappings as $gradeKey => $subjectList) {
            foreach ($subjectList as $subjectName) {
                Subject::create([
                    'grade_level_id' => $grades[$gradeKey]->id,
                    'name' => $subjectName,
                    'is_active' => true,
                ]);
            }
        }

        // 3. زرع كود خصم ترويجي للاختبار
        PromoCode::create([
            'code' => 'TAJ2026',
            'discount_percentage' => 20.00, // خصم 20%
            'max_uses' => 100,
            'used_count' => 0,
            'expires_at' => now()->addMonths(3),
        ]);
    }
}
