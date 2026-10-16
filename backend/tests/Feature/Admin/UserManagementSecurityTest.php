<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Filament\Panel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserManagementSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'student']);

        $this->adminUser = User::factory()->create([
            'is_active' => true,
        ]);
        $this->adminUser->assignRole('admin');

        $this->otherUser = User::factory()->create([
            'is_active' => true,
        ]);
        $this->otherUser->assignRole('student');
    }

    #[Test]
    public function authenticated_user_cannot_deactivate_their_own_account(): void
    {
        $this->actingAs($this->adminUser);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('لا يمكن للمستخدم إلغاء تفعيل حسابه الخاص.');

        $this->adminUser->update(['is_active' => false]);
    }

    #[Test]
    public function admin_can_deactivate_other_users_and_tokens_are_revoked(): void
    {
        $this->actingAs($this->adminUser);

        // Create API token for other user
        $this->otherUser->createToken('test_token');
        $this->assertCount(1, $this->otherUser->tokens);

        $this->otherUser->update(['is_active' => false]);

        $this->assertFalse($this->otherUser->fresh()->is_active);
        $this->assertCount(0, $this->otherUser->fresh()->tokens);
    }

    #[Test]
    public function active_admin_can_access_filament_panel(): void
    {
        $panel = new Panel;
        $this->assertTrue($this->adminUser->canAccessPanel($panel));
    }

    #[Test]
    public function deactivated_admin_cannot_access_filament_panel(): void
    {
        // Deactivate via DB query directly (simulating historical/admin backend update)
        User::where('id', $this->adminUser->id)->update(['is_active' => false]);
        $this->adminUser->refresh();

        $panel = new Panel;
        $this->assertFalse($this->adminUser->canAccessPanel($panel));
    }
}
