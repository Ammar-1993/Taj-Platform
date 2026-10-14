<?php

namespace Tests\Feature\Admin;

use App\Models\GradeLevel;
use App\Models\Subject;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TeacherKycDocumentTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected User $teacherUser;

    protected User $studentUser;

    protected TeacherProfile $profile;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'teacher']);
        Role::firstOrCreate(['name' => 'student']);

        $this->adminUser = User::factory()->create();
        $this->adminUser->assignRole('admin');

        $this->teacherUser = User::factory()->create();
        $this->teacherUser->assignRole('teacher');

        $this->studentUser = User::factory()->create();
        $this->studentUser->assignRole('student');

        $grade = GradeLevel::create(['name' => 'Primary', 'session_price' => 100]);
        $subject = Subject::create(['grade_level_id' => $grade->id, 'name' => 'Science', 'is_active' => true]);

        $this->profile = TeacherProfile::create([
            'user_id' => $this->teacherUser->id,
            'subject_id' => $subject->id,
            'bio' => 'Experienced Science Teacher',
            'national_id_path' => 'teacher_documents/national_id_sample.jpg',
            'degree_path' => 'teacher_documents/degree_sample.pdf',
            'is_verified' => false,
        ]);

        // Fake KYC disk
        $diskName = config('filesystems.kyc_disk', 'kyc');
        Storage::fake($diskName);
        Storage::disk($diskName)->put('teacher_documents/national_id_sample.jpg', UploadedFile::fake()->image('national_id.jpg')->getContent());
        Storage::disk($diskName)->put('teacher_documents/degree_sample.pdf', UploadedFile::fake()->create('degree.pdf', 100, 'application/pdf')->getContent());
    }

    #[Test]
    public function it_allows_access_to_national_id_via_valid_temporary_signed_url(): void
    {
        $signedUrl = $this->profile->getNationalIdUrl(15);

        $this->assertNotNull($signedUrl);
        $this->assertStringContainsString('signature=', $signedUrl);

        $response = $this->get($signedUrl);

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'image/jpeg');
        $this->assertStringContainsString('no-cache', (string) $response->headers->get('Cache-Control'));
        $this->assertStringContainsString('private', (string) $response->headers->get('Cache-Control'));
    }

    #[Test]
    public function it_allows_download_of_degree_via_signed_url_with_download_flag(): void
    {
        $downloadUrl = $this->profile->getDegreeDownloadUrl(15);

        $this->assertNotNull($downloadUrl);
        $this->assertStringContainsString('download=1', $downloadUrl);

        $response = $this->get($downloadUrl);

        $response->assertStatus(200);
        $this->assertStringContainsString('attachment', (string) $response->headers->get('Content-Disposition'));
        $this->assertStringContainsString('degree_sample.pdf', (string) $response->headers->get('Content-Disposition'));
    }

    #[Test]
    public function it_denies_access_when_signature_is_missing_or_tampered(): void
    {
        $unsignedUrl = route('admin.teacher.kyc.document', [
            'profile' => $this->profile->id,
            'type' => 'national_id',
        ]);

        $response = $this->get($unsignedUrl);

        $response->assertStatus(403);
    }

    #[Test]
    public function it_allows_authenticated_admin_to_access_document_even_without_signature(): void
    {
        $unsignedUrl = route('admin.teacher.kyc.document', [
            'profile' => $this->profile->id,
            'type' => 'national_id',
        ]);

        $response = $this->actingAs($this->adminUser)->get($unsignedUrl);

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'image/jpeg');
    }

    #[Test]
    public function it_denies_authenticated_student_from_viewing_teacher_documents_without_signature(): void
    {
        $unsignedUrl = route('admin.teacher.kyc.document', [
            'profile' => $this->profile->id,
            'type' => 'national_id',
        ]);

        $response = $this->actingAs($this->studentUser)->get($unsignedUrl);

        $response->assertStatus(403);
    }

    #[Test]
    public function it_allows_teacher_owner_to_access_their_own_document_without_signature(): void
    {
        $unsignedUrl = route('admin.teacher.kyc.document', [
            'profile' => $this->profile->id,
            'type' => 'national_id',
        ]);

        $response = $this->actingAs($this->teacherUser)->get($unsignedUrl);

        $response->assertStatus(200);
    }

    #[Test]
    public function it_returns_404_for_unsupported_document_type(): void
    {
        $signedUrl = URL::temporarySignedRoute(
            'admin.teacher.kyc.document',
            now()->addMinutes(15),
            ['profile' => $this->profile->id, 'type' => 'passport']
        );

        $response = $this->get($signedUrl);

        $response->assertStatus(404);
    }

    #[Test]
    public function it_returns_404_when_file_does_not_exist_on_storage(): void
    {
        $this->profile->update(['national_id_path' => 'teacher_documents/ghost_file.jpg']);

        $signedUrl = $this->profile->getNationalIdUrl(15);

        $response = $this->get($signedUrl);

        $response->assertStatus(404);
    }
}
