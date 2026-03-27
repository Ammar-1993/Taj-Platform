<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase; // 🟢 التعديل الأول
use PHPUnit\Framework\Attributes\Test; // 🟢 التعديل الثاني
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    // 🟢 التعديل الأول: استخدام هذه السمة لكي لا تُحذف قاعدة بياناتك الحقيقية
    use RefreshDatabase; 

    protected function setUp(): void
    {
        parent::setUp();
        
        // 🟢 استخدام firstOrCreate لكي لا يحدث خطأ إذا كانت الصلاحية موجودة مسبقاً
        Role::firstOrCreate(['name' => 'student']);
        Role::firstOrCreate(['name' => 'teacher']);
        Role::firstOrCreate(['name' => 'parent']);
    }

    #[Test] // 🟢 التعديل الثاني: استخدام Attribute بدلاً من التعليق
    public function a_student_can_register_successfully_and_get_a_wallet()
    {
        $payload = [
            'name' => 'طالب تجريبي',
            'email' => 'test_student_999@test.com', // استخدام إيميل مميز
            'phone' => '0500000999',
            'password' => 'password123',
            'role' => 'student'
        ];

        $response = $this->postJson('/api/v1/auth/register', $payload);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'status',
                     'message',
                     'data' => [
                         'user' => ['id', 'name', 'email', 'roles', 'wallet'],
                         'token'
                     ]
                 ]);

        $this->assertDatabaseHas('users', [
            'email' => 'test_student_999@test.com',
        ]);

        $user = User::where('email', 'test_student_999@test.com')->first();
        $this->assertTrue($user->hasRole('student'));

        // هل تم إنشاء المحفظة؟
        $this->assertDatabaseHas('wallets', [
            'user_id' => $user->id,
            'balance' => 0.00
        ]);
    }

    #[Test]
    public function registration_fails_if_email_is_already_taken()
    {
        // 1. إنشاء مستخدم مسبقاً
        $existingUser = User::factory()->create(['email' => 'existing_999@test.com']);

        $payload = [
            'name' => 'مستخدم جديد',
            'email' => 'existing_999@test.com', // إيميل مكرر!
            'phone' => '0500000888',
            'password' => 'password123',
            'role' => 'teacher'
        ];

        // 2. التنفيذ
        $response = $this->postJson('/api/v1/auth/register', $payload);

        // 3. التحقق: يجب أن يفشل (422)
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }
}