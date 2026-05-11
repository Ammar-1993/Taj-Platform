<?php

namespace Tests\Feature;

use App\Models\GradeLevel;
use App\Models\Subject;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'student']);
        Role::firstOrCreate(['name' => 'teacher']);
    }

    public function test_student_can_complete_profile()
    {
        /** @var User $user */
        $user = User::factory()->create();
        $user->assignRole('student');

        $grade = GradeLevel::create(['name' => 'Primary 1', 'session_price' => 50.00]);

        $payload = [
            'grade_level_id' => $grade->id,
        ];

        $response = $this->actingAs($user)
            ->postJson('/api/v1/profile/student', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'تم استكمال ملف الطالب بنجاح',
            ]);

        $this->assertDatabaseHas('student_profiles', [
            'user_id' => $user->id,
            'grade_level_id' => $grade->id,
            'can_book_independently' => true,
        ]);
    }

    public function test_teacher_can_complete_profile_with_uploads()
    {
        Storage::fake('public');

        /** @var User $user */
        $user = User::factory()->create();
        $user->assignRole('teacher');

        $grade = GradeLevel::create(['name' => 'Secondary', 'session_price' => 100.00]);
        $subject = Subject::create([
            'grade_level_id' => $grade->id,
            'name' => 'Mathematics',
            'is_active' => true,
        ]);

        $payload = [
            'subject_id' => $subject->id,
            'bio' => 'هذا هو الوصف الشخصي التعريفي للمعلم، يجب أن يكون طويلاً كفاية.',
            'national_id' => UploadedFile::fake()->create('id.jpg', 1024),
            'degree' => UploadedFile::fake()->create('degree.pdf', 2048),
        ];

        $response = $this->actingAs($user)
            ->postJson('/api/v1/profile/teacher', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'تم استكمال ملف المعلم ورفع المستندات بنجاح. حسابك الآن قيد المراجعة الإدارية ⏳',
            ]);

        $this->assertDatabaseHas('teacher_profiles', [
            'user_id' => $user->id,
            'subject_id' => $subject->id,
            'is_verified' => false,
        ]);

        $profile = TeacherProfile::where('user_id', $user->id)->first();
        $this->assertNotNull($profile->national_id_path);
        $this->assertNotNull($profile->degree_path);

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('public');
        $disk->assertExists($profile->national_id_path);
        $disk->assertExists($profile->degree_path);
    }

    public function test_non_teacher_cannot_complete_teacher_profile()
    {
        /** @var User $user */
        $user = User::factory()->create();
        $user->assignRole('student');

        $response = $this->actingAs($user)
            ->postJson('/api/v1/profile/teacher', []);

        $response->assertStatus(403);
    }
}
