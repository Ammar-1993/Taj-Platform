<?php

namespace Tests\Unit;

use App\Models\GradeLevel;
use App\Models\Subject;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TeacherKycSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'teacher']);
        Role::firstOrCreate(['name' => 'student']);
    }

    #[Test]
    public function it_returns_null_when_documents_are_not_uploaded(): void
    {
        $profile = new TeacherProfile;

        $this->assertNull($profile->getNationalIdUrl());
        $this->assertNull($profile->getDegreeUrl());
    }

    #[Test]
    public function it_generates_urls_for_national_id_and_degree(): void
    {
        Storage::fake('public');

        $profile = new TeacherProfile([
            'national_id_path' => 'teacher_documents/national_id.pdf',
            'degree_path' => 'teacher_documents/degree.pdf',
        ]);

        $idUrl = $profile->getNationalIdUrl(5);
        $degreeUrl = $profile->getDegreeUrl(5);

        $this->assertNotNull($idUrl);
        $this->assertNotNull($degreeUrl);
        $this->assertStringContainsString('teacher_documents/national_id.pdf', $idUrl);
        $this->assertStringContainsString('teacher_documents/degree.pdf', $degreeUrl);
    }

    #[Test]
    public function it_hides_sensitive_kyc_document_paths_during_model_serialization(): void
    {
        $user = User::factory()->create();
        $grade = GradeLevel::create(['name' => 'Secondary', 'session_price' => 100]);
        $subject = Subject::create(['grade_level_id' => $grade->id, 'name' => 'Math', 'is_active' => true]);

        $profile = TeacherProfile::create([
            'user_id' => $user->id,
            'subject_id' => $subject->id,
            'bio' => 'A qualified mathematics instructor.',
            'national_id_path' => 'teacher_documents/secret_id_123.pdf',
            'degree_path' => 'teacher_documents/secret_degree_456.pdf',
            'is_verified' => true,
        ]);

        $serialized = $profile->toArray();

        $this->assertArrayNotHasKey('national_id_path', $serialized);
        $this->assertArrayNotHasKey('degree_path', $serialized);

        // Can still be explicitly made visible for authorized owner
        $profile->makeVisible(['national_id_path', 'degree_path']);
        $ownerSerialized = $profile->toArray();

        $this->assertArrayHasKey('national_id_path', $ownerSerialized);
        $this->assertArrayHasKey('degree_path', $ownerSerialized);
        $this->assertEquals('teacher_documents/secret_id_123.pdf', $ownerSerialized['national_id_path']);
    }

    #[Test]
    public function it_prevents_kyc_document_leaks_in_public_discovery_endpoint(): void
    {
        $user = User::factory()->create(['name' => 'Ahmed Teacher', 'is_active' => true]);
        $user->assignRole('teacher');

        $grade = GradeLevel::create(['name' => 'Primary', 'session_price' => 150]);
        $subject = Subject::create(['grade_level_id' => $grade->id, 'name' => 'Arabic', 'is_active' => true]);

        TeacherProfile::create([
            'user_id' => $user->id,
            'subject_id' => $subject->id,
            'bio' => 'Expert Arabic teacher.',
            'national_id_path' => 'teacher_documents/private_national_id.pdf',
            'degree_path' => 'teacher_documents/private_degree.pdf',
            'is_verified' => true,
        ]);

        $response = $this->getJson('/api/v1/discovery/teachers');

        $response->assertStatus(200);
        $data = $response->json('data.data');

        $this->assertNotEmpty($data);
        $teacher = $data[0];

        $this->assertNotNull($teacher['teacher_profile']);
        $this->assertArrayNotHasKey('national_id_path', $teacher['teacher_profile']);
        $this->assertArrayNotHasKey('degree_path', $teacher['teacher_profile']);
    }
}
