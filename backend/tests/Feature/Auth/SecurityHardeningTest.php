<?php

namespace Tests\Feature\Auth;

use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'student']);
        Role::firstOrCreate(['name' => 'teacher']);
        Role::firstOrCreate(['name' => 'admin']);
    }

    #[Test]
    public function active_user_can_access_protected_endpoints(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole('student');

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/auth/me');

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.id', $user->id);
    }

    #[Test]
    public function deactivated_user_cannot_access_protected_endpoints_and_token_is_revoked(): void
    {
        $user = User::factory()->create(['is_active' => false]);
        $user->assignRole('student');
        $token = $user->createToken('test_token');

        $response = $this->withHeader('Authorization', 'Bearer '.$token->plainTextToken)
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(403)
            ->assertJson([
                'status' => 'error',
                'message' => 'تم إيقاف حسابك مؤقتاً. يرجى التواصل مع فريق الدعم.',
            ]);

        // Token should be revoked immediately
        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $token->accessToken->id,
        ]);
    }

    #[Test]
    public function deactivating_user_via_model_update_revokes_all_active_tokens(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $user->createToken('token_1');
        $user->createToken('token_2');

        $this->assertCount(2, $user->tokens);

        // Deactivate user
        $user->update(['is_active' => false]);

        $this->assertCount(0, $user->fresh()->tokens);
    }

    #[Test]
    public function deactivated_admin_cannot_access_filament_panel(): void
    {
        $admin = User::factory()->create(['is_active' => false]);
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get('/admin/profile');
        $response->assertForbidden();

        $admin->update(['is_active' => true]);
        $activeResponse = $this->actingAs($admin->fresh())->get('/admin/profile');
        $activeResponse->assertSuccessful();
    }

    #[Test]
    public function forgot_password_returns_unified_success_even_for_non_existent_email(): void
    {
        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'nonexistent_account@taj-edu.test',
        ]);

        $response->assertOk()
            ->assertJson([
                'status' => 'success',
                'message' => 'إذا كان البريد الإلكتروني مسجلاً، فستصلك رسالة تحتوي على تعليمات إعادة تعيين كلمة المرور.',
            ]);
    }

    #[Test]
    public function reset_password_revokes_all_previous_tokens(): void
    {
        $user = User::factory()->create([
            'email' => 'reset_user@taj-edu.test',
            'password' => Hash::make('OldPassword123!'),
            'is_active' => true,
        ]);
        $token1 = $user->createToken('device_1');
        $token2 = $user->createToken('device_2');

        $this->assertCount(2, $user->tokens);

        // Generate valid password reset token
        $resetToken = Password::createToken($user);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'reset_user@taj-edu.test',
            'token' => $resetToken,
            'password' => 'NewSecurePassword123!',
            'password_confirmation' => 'NewSecurePassword123!',
        ]);

        $response->assertOk()
            ->assertJson([
                'status' => 'success',
                'message' => 'تم إعادة تعيين كلمة المرور بنجاح.',
            ]);

        // Tokens must be revoked
        $this->assertCount(0, $user->fresh()->tokens);
    }

    #[Test]
    public function updating_password_via_update_user_revokes_other_sessions(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('CurrentPassword123!'),
            'is_active' => true,
        ]);
        $user->assignRole('student');

        $currentSession = $user->createToken('current_session');
        $otherSession = $user->createToken('other_session');

        $this->assertCount(2, $user->tokens);

        $response = $this->withHeader('Authorization', 'Bearer '.$currentSession->plainTextToken)
            ->putJson('/api/v1/auth/me', [
                'current_password' => 'CurrentPassword123!',
                'password' => 'BrandNewPassword123!',
                'password_confirmation' => 'BrandNewPassword123!',
            ]);

        $response->assertOk();

        // Other session must be deleted, current session must remain
        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $otherSession->accessToken->id,
        ]);
        $this->assertDatabaseHas('personal_access_tokens', [
            'id' => $currentSession->accessToken->id,
        ]);
    }

    #[Test]
    public function kyc_ephemeral_urls_fail_closed_in_production(): void
    {
        $profile = new TeacherProfile([
            'national_id_path' => 'teacher_documents/national_id_secret.pdf',
            'degree_path' => 'teacher_documents/degree_secret.pdf',
        ]);

        // In testing environment, returns local URL fallback
        $this->assertNotNull($profile->getNationalIdUrl());

        // In simulated production environment, if temporaryUrl fails, it must return null (fail closed)
        $this->app['env'] = 'production';
        $this->assertNull($profile->getNationalIdUrl());
        $this->assertNull($profile->getDegreeUrl());
    }
}
