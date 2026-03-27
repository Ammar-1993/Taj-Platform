<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class UsersTableSeeder extends Seeder
{
    public function run(): void
    {
        // كلمة المرور الموحدة لجميع الحسابات التجريبية
        $password = Hash::make('password123');

        // ==========================================
        // 1. حسابات الإدارة (Admins)
        // ==========================================
        $admin = User::create([
            'name' => 'مدير النظام',
            'email' => 'admin@taj.com',
            'phone' => '0500000001',
            'password' => $password,
            'is_active' => true,
        ]);
        $admin->assignRole('admin');


        // ==========================================
        // 2. حسابات المعلمين (Teachers)
        // ==========================================
        
        // أ. معلم رياضيات (موثق ونشط)
        $teacher1 = User::create([
            'name' => 'أ. أحمد عبدالله',
            'email' => 'teacher@taj.com',
            'phone' => '0500000002',
            'password' => $password,
            'is_active' => true,
        ]);
        $teacher1->assignRole('teacher');
        $teacher1->teacherProfile()->create([
            'subject_id' => 1, // نفترض 1 = رياضيات
            'bio' => 'معلم رياضيات بخبرة 10 سنوات في تبسيط المناهج، متخصص في تأسيس الطلاب للمرحلة الثانوية والقدرات.',
            'is_verified' => true,
            'average_rating' => 4.8,
            'reviews_count' => 15
        ]);
        $teacher1->wallet()->create(['balance' => 250.00]); // لديه رصيد سابق ليتمكن من تجربة سحب الأرباح
        $teacher1->teacherSlots()->createMany([
            ['slot_date' => Carbon::tomorrow()->toDateString(), 'start_time' => '16:00:00', 'end_time' => '17:00:00', 'status' => 'available'],
            ['slot_date' => Carbon::tomorrow()->toDateString(), 'start_time' => '17:30:00', 'end_time' => '18:30:00', 'status' => 'available'],
            ['slot_date' => Carbon::now()->addDays(2)->toDateString(), 'start_time' => '20:00:00', 'end_time' => '21:00:00', 'status' => 'available'],
        ]);

        // ب. معلمة لغة إنجليزية (موثقة ونشطة)
        $teacher2 = User::create([
            'name' => 'أ. سارة محمد',
            'email' => 'sara@taj.com',
            'phone' => '0500000003',
            'password' => $password,
            'is_active' => true,
        ]);
        $teacher2->assignRole('teacher');
        $teacher2->teacherProfile()->create([
            'subject_id' => 2, // نفترض 2 = لغة إنجليزية
            'bio' => 'مدرسة لغة إنجليزية معتمدة، أركز على مهارات المحادثة والاستماع بطرق تفاعلية ممتعة.',
            'is_verified' => true,
            'average_rating' => 5.0,
            'reviews_count' => 8
        ]);
        $teacher2->wallet()->create(['balance' => 0.00]);
        $teacher2->teacherSlots()->createMany([
            ['slot_date' => Carbon::tomorrow()->toDateString(), 'start_time' => '18:00:00', 'end_time' => '19:00:00', 'status' => 'available'],
        ]);

        // ج. معلم فيزياء (غير موثق - بانتظار موافقة الإدارة)
        $teacher3 = User::create([
            'name' => 'أ. عمر خالد',
            'email' => 'omar@taj.com',
            'phone' => '0500000004',
            'password' => $password,
            'is_active' => true, // الحساب نشط لكن البروفايل غير موثق
        ]);
        $teacher3->assignRole('teacher');
        $teacher3->teacherProfile()->create([
            'subject_id' => 3, // نفترض 3 = فيزياء
            'bio' => 'شغوف بتعليم الفيزياء وربطها بالواقع العملي والتجارب العلمية.',
            'is_verified' => false, // 🛑 لاختبار شاشة طلبات الانضمام في Filament
            'average_rating' => 0,
            'reviews_count' => 0
        ]);
        $teacher3->wallet()->create(['balance' => 0.00]);


        // ==========================================
        // 3. حسابات الطلاب المستقلين (Independent Students)
        // ==========================================
        $student1 = User::create([
            'name' => 'خالد',
            'email' => 'student@taj.com',
            'phone' => '0500000005',
            'password' => $password,
            'is_active' => true,
        ]);
        $student1->assignRole('student');
        $student1->studentProfile()->create([
            'grade_level_id' => 3, // ثانوية
            'can_book_independently' => true
        ]);
        $student1->wallet()->create(['balance' => 500.00]); // مشحونة للتجارب


        // ==========================================
        // 4. حسابات أولياء الأمور والأبناء (Parents & Children)
        // ==========================================
        
        // أ. ولي الأمر
        $parent = User::create([
            'name' => 'أبو ياسر',
            'email' => 'parent@taj.com',
            'phone' => '0500000006',
            'password' => $password,
            'is_active' => true,
        ]);
        $parent->assignRole('parent');
        $parent->wallet()->create(['balance' => 1000.00]); // ميزانية ولي الأمر لحجز الحصص لأبنائه

        // ب. الابن الأول (مرحلة متوسطة)
        $child1 = User::create([
            'name' => 'ياسر',
            'email' => 'yasser@taj.com',
            'phone' => '0500000007',
            'password' => $password,
            'is_active' => true,
        ]);
        $child1->assignRole('student');
        $child1->studentProfile()->create([
            'grade_level_id' => 2, // متوسطة
            'can_book_independently' => false // لا يمكنه الدفع، يعتمد على محفظة والده
        ]);
        $child1->wallet()->create(['balance' => 0.00]);

        // ج. الابنة الثانية (مرحلة ابتدائية)
        $child2 = User::create([
            'name' => 'منى',
            'email' => 'mona@taj.com',
            'phone' => '0500000008',
            'password' => $password,
            'is_active' => true,
        ]);
        $child2->assignRole('student');
        $child2->studentProfile()->create([
            'grade_level_id' => 1, // ابتدائية
            'can_book_independently' => false
        ]);
        $child2->wallet()->create(['balance' => 0.00]);

        // د. ربط الأبناء بولي الأمر (في الجدول الوسيط)
        // نفترض وجود جدول parent_student (parent_id, student_id)
        DB::table('parent_student')->insert([
            ['parent_id' => $parent->id, 'student_id' => $child1->id, 'created_at' => now(), 'updated_at' => now()],
            ['parent_id' => $parent->id, 'student_id' => $child2->id, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}