<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Subject;
use App\Models\GradeLevel;
use App\Models\PromoCode;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. زرع المواد الدراسية
        $subjects = ['الرياضيات', 'اللغة الإنجليزية', 'الفيزياء', 'الكيمياء', 'البرمجة', 'القدرات والتحصيلي'];
        foreach ($subjects as $subject) {
            Subject::create(['name' => $subject, 'is_active' => true]);
        }

        // 2. زرع المراحل الدراسية وأسعارها الافتراضية للحصة
        $grades = [
            ['name' => 'المرحلة الابتدائية', 'price' => 50.00],
            ['name' => 'المرحلة المتوسطة', 'price' => 70.00],
            ['name' => 'المرحلة الثانوية', 'price' => 100.00],
            ['name' => 'القدرات والتحصيلي', 'price' => 150.00],
        ];
        
        foreach ($grades as $grade) {
            GradeLevel::create([
                'name' => $grade['name'], 
                'session_price' => $grade['price'], 
                'is_active' => true
            ]);
        }

        // 3. زرع كود خصم ترويجي للاختبار
        PromoCode::create([
            'code' => 'TAJ2026',
            'discount_percentage' => 20.00, // خصم 20%
            'max_uses' => 100,
            'used_count' => 0,
            'expires_at' => now()->addMonths(3)
        ]);
    }
}