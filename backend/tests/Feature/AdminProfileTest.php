<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'teacher', 'guard_name' => 'web']);
        Role::create(['name' => 'student', 'guard_name' => 'web']);
    }

    #[Test]
    public function it_returns_ui_avatars_url_when_avatar_url_is_null(): void
    {
        $user = User::factory()->create([
            'name' => 'محمد أحمد',
            'avatar_url' => null,
        ]);

        $avatarUrl = $user->getFilamentAvatarUrl();

        $this->assertNotNull($avatarUrl);
        $this->assertStringContainsString('ui-avatars.com', $avatarUrl);
        $this->assertStringContainsString(urlencode('محمد أحمد'), $avatarUrl);
    }

    #[Test]
    public function it_returns_storage_url_when_avatar_url_is_set(): void
    {
        Storage::fake(config('filesystems.default', 'public'));

        $user = User::factory()->create([
            'name' => 'مدير النظام',
            'avatar_url' => 'avatars/admin_avatar.jpg',
        ]);

        $avatarUrl = $user->getFilamentAvatarUrl();

        $this->assertNotNull($avatarUrl);
        $this->assertStringContainsString('avatars/admin_avatar.jpg', $avatarUrl);
    }

    #[Test]
    public function it_returns_direct_url_when_avatar_url_is_external_http(): void
    {
        $user = User::factory()->create([
            'name' => 'مدير النظام',
            'avatar_url' => 'https://example.com/custom_avatar.png',
        ]);

        $this->assertEquals('https://example.com/custom_avatar.png', $user->getFilamentAvatarUrl());
    }

    #[Test]
    public function admin_can_access_filament_profile_page(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get('/admin/profile');

        $response->assertSuccessful();
    }

    #[Test]
    public function non_admin_cannot_access_filament_profile_page(): void
    {
        $student = User::factory()->create();
        $student->assignRole('student');

        $response = $this->actingAs($student)->get('/admin/profile');

        $response->assertForbidden();
    }
}
