<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UsersTableSeeder extends Seeder
{
    public function run(): void
    {
        // كلمة المرور الموحدة لجميع الحسابات التجريبية
        $password = Hash::make('password123');

        // 1. حساب الإدارة (Admin)
        $admin = User::create([
            'name' => 'مدير النظام',
            'email' => 'admin@taj.com',
            'phone' => '0500000001',
            'password' => $password,
            'is_active' => true,
        ]);
        $admin->assignRole('admin');

        // 2. حساب المعلم (Teacher) مع ملفه ومحفظته وأوقاته
        $teacher = User::create([
            'name' => 'أ. أحمد عبدالله',
            'email' => 'teacher@taj.com',
            'phone' => '0500000002',
            'password' => $password,
            'is_active' => true,
        ]);
        $teacher->assignRole('teacher');
        $teacher->teacherProfile()->create([
            'subject_id' => 1, // رياضيات
            'bio' => 'معلم رياضيات بخبرة 10 سنوات في تبسيط المناهج، متخصص في تأسيس الطلاب.',
            'is_verified' => true,
            'average_rating' => 4.8,
            'reviews_count' => 15
        ]);
        $teacher->wallet()->create(['balance' => 0.00]);
        // زرع أوقات متاحة للمعلم غداً
        $teacher->teacherSlots()->createMany([
            ['slot_date' => now()->addDays(1)->toDateString(), 'start_time' => '16:00:00', 'end_time' => '17:00:00', 'status' => 'available'],
            ['slot_date' => now()->addDays(1)->toDateString(), 'start_time' => '17:30:00', 'end_time' => '18:30:00', 'status' => 'available'],
        ]);

        // 3. حساب الطالب (Student) مع ملفه ومحفظته المشحونة
        $student = User::create([
            'name' => 'الطالب خالد',
            'email' => 'student@taj.com',
            'phone' => '0500000003',
            'password' => $password,
            'is_active' => true,
        ]);
        $student->assignRole('student');
        $student->studentProfile()->create([
            'grade_level_id' => 3, // ثانوية (سعر الحصة 100 ريال)
            'can_book_independently' => true
        ]);
        // شحن محفظة الطالب بـ 500 ريال ليتمكن من الحجز عند اختبارنا للنظام
        $student->wallet()->create(['balance' => 500.00]); 
    }
}