<?php

namespace Tests\Unit;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Booking;
use App\Models\Subject;
use App\Models\TeacherProfile;
use App\Models\TeacherSlot;
use App\Models\Review;
use App\Services\ReviewService;

class ReviewServiceUnitTest extends TestCase
{
    use RefreshDatabase;

    public function test_submit_review_success_updates_teacher_profile()
    {
        $subject = Subject::factory()->create(['name' => 'Math']);

        $teacher = User::factory()->create();
        $student = User::factory()->create();

        $teacher->teacherProfile()->create([
            'subject_id' => $subject->id, 
            'average_rating' => 4.0, 
            'reviews_count' => 1, 
            'is_verified' => true
        ]);

        $slot = TeacherSlot::factory()->create([
            'teacher_id' => $teacher->id, 
            'status' => 'available'
        ]);

        $booking = Booking::factory()->create([
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'booked_by_id' => $student->id,
            'teacher_slot_id' => $slot->id,
            'status' => 'completed',
        ]);

        $service = new ReviewService();
        $review = $service->submitReview($student, $booking->id, 5, 'Excellent');

        $this->assertInstanceOf(Review::class, $review);
        $this->assertEquals(5, $review->rating);
        $this->assertEquals(2, $teacher->teacherProfile->refresh()->reviews_count);
        $this->assertEquals(4.5, $teacher->teacherProfile->refresh()->average_rating);
    }

    public function test_submit_review_fails_for_non_completed_booking()
    {
        $subject = Subject::factory()->create(['name' => 'English']);

        $teacher = User::factory()->create();
        $student = User::factory()->create();

        $teacher->teacherProfile()->create([
            'subject_id' => $subject->id, 
            'is_verified' => true
        ]);
        
        $slot = TeacherSlot::factory()->create([
            'teacher_id' => $teacher->id, 
            'status' => 'available'
        ]);

        $booking = Booking::factory()->create([
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'booked_by_id' => $student->id,
            'teacher_slot_id' => $slot->id,
            'status' => 'scheduled',
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('لا يمكن تقييم حصة لم تكتمل بعد.');

        $service = new ReviewService();
        $service->submitReview($student, $booking->id, 4, 'Okay');
    }

    public function test_submit_review_fails_when_user_is_not_owner()
    {
        $subject = Subject::factory()->create(['name' => 'History']);

        $teacher = User::factory()->create();
        $student = User::factory()->create();
        $otherUser = User::factory()->create();

        $teacher->teacherProfile()->create([
            'subject_id' => $subject->id, 
            'is_verified' => true
        ]);
        
        $slot = TeacherSlot::factory()->create([
            'teacher_id' => $teacher->id, 
            'status' => 'available'
        ]);

        $booking = Booking::factory()->create([
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'booked_by_id' => $student->id,
            'teacher_slot_id' => $slot->id,
            'status' => 'completed',
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('عفواً، سِجل الحجز هذا غير موجود أو لا تملك صلاحية تقييمه.');

        $service = new ReviewService();
        $service->submitReview($otherUser, $booking->id, 3, 'Not allowed');
    }

    public function test_submit_review_fails_for_duplicate_review()
    {
        $subject = Subject::factory()->create(['name' => 'Science']);

        $teacher = User::factory()->create();
        $student = User::factory()->create();

        $teacher->teacherProfile()->create([
            'subject_id' => $subject->id, 
            'is_verified' => true
        ]);
        
        $slot = TeacherSlot::factory()->create([
            'teacher_id' => $teacher->id, 
            'status' => 'available'
        ]);

        $booking = Booking::factory()->create([
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'booked_by_id' => $student->id,
            'teacher_slot_id' => $slot->id,
            'status' => 'completed',
        ]);

        $booking->review()->create([
            'student_id' => $student->id, 
            'teacher_id' => $teacher->id, 
            'rating' => 5, 
            'comment' => 'Nice', 
            'is_published' => true
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('لقد قمت بتقييم هذه الحصة مسبقاً.');

        $service = new ReviewService();
        $service->submitReview($student, $booking->id, 4, 'Again');
    }
}
