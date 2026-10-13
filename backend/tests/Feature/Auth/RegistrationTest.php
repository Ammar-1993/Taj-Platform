<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Models\Wallet; // 🟢 التعديل الأول
use App\Services\RecaptchaService; // 🟢 التعديل الثاني
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Test;
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

        // Mock RecaptchaService
        $this->mock(RecaptchaService::class, function ($mock) {
            $mock->shouldReceive('verify')->andReturn(true);
        });
    }

    #[Test] // 🟢 التعديل الثاني: استخدام Attribute بدلاً من التعليق
    public function a_student_can_register_successfully_and_get_a_wallet()
    {
        $payload = [
            'name' => 'طالب تجريبي',
            'email' => 'test_student_999@test.com', // استخدام إيميل مميز
            'phone' => '0500000999',
            'password' => 'password123',
            'role' => 'student',
            'recaptcha_token' => 'fake-token',
        ];

        $response = $this->postJson('/api/v1/auth/register', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'user' => ['id', 'name', 'email', 'roles', 'wallet'],
                    'token',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'test_student_999@test.com',
        ]);

        $user = User::where('email', 'test_student_999@test.com')->first();
        $this->assertTrue($user->hasRole('student'));

        // هل تم إنشاء المحفظة؟
        $this->assertDatabaseHas('wallets', [
            'user_id' => $user->id,
            'balance' => 0.00,
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
            'role' => 'teacher',
            'recaptcha_token' => 'fake-token',
        ];

        // 2. التنفيذ
        $response = $this->postJson('/api/v1/auth/register', $payload);

        // 3. التحقق: يجب أن يفشل (422)
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    #[Test]
    public function registration_fails_if_recaptcha_is_invalid()
    {
        // Mock RecaptchaService to return false
        $this->mock(RecaptchaService::class, function ($mock) {
            $mock->shouldReceive('verify')->andReturn(false);
        });

        $payload = [
            'name' => 'طالب فاشل',
            'email' => 'failed_recaptcha@test.com',
            'phone' => '0500000777',
            'password' => 'password123',
            'role' => 'student',
            'recaptcha_token' => 'invalid-token',
        ];

        $response = $this->postJson('/api/v1/auth/register', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['recaptcha_token']);
    }

    #[Test]
    public function registration_rolls_back_completely_if_wallet_creation_fails(): void
    {
        Wallet::creating(function () {
            throw new \RuntimeException('Simulated wallet failure for transaction rollback');
        });

        $payload = [
            'name' => 'طالب اختبار الرول باك',
            'email' => 'rollback_user@test.com',
            'phone' => '0500000123',
            'password' => 'password123',
            'role' => 'student',
            'recaptcha_token' => 'fake-token',
        ];

        try {
            $this->postJson('/api/v1/auth/register', $payload);
        } catch (\RuntimeException $e) {
            // Caught simulated exception
        }

        $this->assertDatabaseMissing('users', [
            'email' => 'rollback_user@test.com',
        ]);
    }

    #[Test]
    public function recaptcha_service_verifies_expected_action_correctly(): void
    {
        config(['services.recaptcha.secret' => 'test_secret_key']);
        $service = new RecaptchaService;

        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::sequence()
                ->push([
                    'success' => true,
                    'score' => 0.9,
                    'action' => 'login',
                ])
                ->push([
                    'success' => true,
                    'score' => 0.9,
                    'action' => 'register',
                ]),
        ]);

        // 1. Mismatched action -> returns false
        $this->assertFalse($service->verify('test-token', '127.0.0.1', 'register'));

        // 2. Matching action -> returns true
        $this->assertTrue($service->verify('test-token', '127.0.0.1', 'register'));
    }
}
