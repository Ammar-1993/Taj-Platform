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
        $subject = Subject::create(['name' => 'Math', 'is_active' => true]);

        $teacher = User::create([ 'name' => 'Teacher Three', 'email' => 'teacher3@taj.com', 'phone' => '0500000005', 'password' => bcrypt('password') ]);
        $student = User::create([ 'name' => 'Student Three', 'email' => 'student3@taj.com', 'phone' => '0500000006', 'password' => bcrypt('password') ]);

        $teacher->teacherProfile()->create(['subject_id' => $subject->id, 'average_rating' => 4.0, 'reviews_count' => 1, 'is_verified' => true]);

        $slot = TeacherSlot::create(['teacher_id' => $teacher->id, 'slot_date' => now()->addDay(), 'start_time' => '10:00:00', 'end_time' => '11:00:00', 'status' => 'available']);

        $booking = Booking::create([
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'booked_by_id' => $student->id,
            'teacher_slot_id' => $slot->id,
            'booking_date' => now(),
            'session_price' => 100.00,
            'discount_amount' => 0.00,
            'net_paid' => 100.00,
            'status' => 'completed',
            'agora_channel' => 'taj_review',
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
        $subject = Subject::create(['name' => 'English', 'is_active' => true]);

        $teacher = User::create([ 'name' => 'Teacher Four', 'email' => 'teacher4@taj.com', 'phone' => '0500000007', 'password' => bcrypt('password') ]);
        $student = User::create([ 'name' => 'Student Four', 'email' => 'student4@taj.com', 'phone' => '0500000008', 'password' => bcrypt('password') ]);

        $teacher->teacherProfile()->create(['subject_id' => $subject->id, 'average_rating' => 4.0, 'reviews_count' => 0, 'is_verified' => true]);
        $slot = TeacherSlot::create(['teacher_id' => $teacher->id, 'slot_date' => now()->addDay(), 'start_time' => '12:00:00', 'end_time' => '13:00:00', 'status' => 'available']);

        $booking = Booking::create([
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'booked_by_id' => $student->id,
            'teacher_slot_id' => $slot->id,
            'booking_date' => now(),
            'session_price' => 100.00,
            'discount_amount' => 0.00,
            'net_paid' => 100.00,
            'status' => 'scheduled',
            'agora_channel' => 'taj_review2',
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('لا يمكن تقييم حصة لم تكتمل بعد.');

        $service = new ReviewService();
        $service->submitReview($student, $booking->id, 4, 'Okay');
    }

    public function test_submit_review_fails_when_user_is_not_owner()
    {
        $subject = Subject::create(['name' => 'History', 'is_active' => true]);

        $teacher = User::create([ 'name' => 'Teacher Six', 'email' => 'teacher6@taj.com', 'phone' => '0500000011', 'password' => bcrypt('password') ]);
        $student = User::create([ 'name' => 'Student Six', 'email' => 'student6@taj.com', 'phone' => '0500000012', 'password' => bcrypt('password') ]);
        $otherUser = User::create([ 'name' => 'Imposter', 'email' => 'imposter@taj.com', 'phone' => '0500000013', 'password' => bcrypt('password') ]);

        $teacher->teacherProfile()->create(['subject_id' => $subject->id, 'average_rating' => 4.0, 'reviews_count' => 1, 'is_verified' => true]);
        $slot = TeacherSlot::create(['teacher_id' => $teacher->id, 'slot_date' => now()->addDay(), 'start_time' => '14:00:00', 'end_time' => '15:00:00', 'status' => 'available']);

        $booking = Booking::create([
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'booked_by_id' => $student->id,
            'teacher_slot_id' => $slot->id,
            'booking_date' => now(),
            'session_price' => 100.00,
            'discount_amount' => 0.00,
            'net_paid' => 100.00,
            'status' => 'completed',
            'agora_channel' => 'taj_review_nonowner',
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('عفواً، سِجل الحجز هذا غير موجود أو لا تملك صلاحية تقييمه.');

        $service = new ReviewService();
        $service->submitReview($otherUser, $booking->id, 3, 'Not allowed');
    }

    public function test_submit_review_fails_for_duplicate_review()
    {
        $subject = Subject::create(['name' => 'Science', 'is_active' => true]);

        $teacher = User::create([ 'name' => 'Teacher Five', 'email' => 'teacher5@taj.com', 'phone' => '0500000009', 'password' => bcrypt('password') ]);
        $student = User::create([ 'name' => 'Student Five', 'email' => 'student5@taj.com', 'phone' => '0500000010', 'password' => bcrypt('password') ]);

        $teacher->teacherProfile()->create(['subject_id' => $subject->id, 'average_rating' => 4.0, 'reviews_count' => 1, 'is_verified' => true]);
        $slot = TeacherSlot::create(['teacher_id' => $teacher->id, 'slot_date' => now()->addDay(), 'start_time' => '13:00:00', 'end_time' => '14:00:00', 'status' => 'available']);

        $booking = Booking::create([
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'booked_by_id' => $student->id,
            'teacher_slot_id' => $slot->id,
            'booking_date' => now(),
            'session_price' => 100.00,
            'discount_amount' => 0.00,
            'net_paid' => 100.00,
            'status' => 'completed',
            'agora_channel' => 'taj_review3',
        ]);

        $booking->review()->create(['student_id' => $student->id, 'teacher_id' => $teacher->id, 'rating' => 5, 'comment' => 'Nice', 'is_published' => true]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('لقد قمت بتقييم هذه الحصة مسبقاً.');

        $service = new ReviewService();
        $service->submitReview($student, $booking->id, 4, 'Again');
    }
}
