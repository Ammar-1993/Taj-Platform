<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Review;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Exception;

class ReviewService
{
    /**
     * Submit a review for a completed booking and mathematically update the teacher's rating inside an atomic transaction.
     *
     * @param User $user
     * @param int $bookingId
     * @param int $rating
     * @param string|null $comment
     * @return Review
     * @throws Exception
     */
    public function submitReview(User $user, int $bookingId, int $rating, ?string $comment = null): Review
    {
        // 1. Validate Booking Ownership and Status
        $booking = Booking::where('id', $bookingId)
            ->where(function ($q) use ($user) {
                $q->where('student_id', $user->id)->orWhere('booked_by_id', $user->id);
            })->first();

        if (!$booking) {
            throw new Exception('عفواً، سِجل الحجز هذا غير موجود أو لا تملك صلاحية تقييمه.');
        }

        if ($booking->status !== 'completed') {
            throw new Exception('لا يمكن تقييم حصة لم تكتمل بعد.');
        }

        if ($booking->review()->exists()) {
            throw new Exception('لقد قمت بتقييم هذه الحصة مسبقاً.');
        }

        // 2. Execute Atomic DB Transaction
        return DB::transaction(function () use ($booking, $rating, $comment) {
            
            // Create the Review
            $review = Review::create([
                'booking_id' => $booking->id,
                'student_id' => $booking->student_id,
                'teacher_id' => $booking->teacher_id,
                'rating' => $rating,
                'comment' => $comment,
                'is_published' => true, 
            ]);

            // Safely lock the teacher profile row and update calculations
            $profile = TeacherProfile::where('user_id', $booking->teacher_id)->lockForUpdate()->first();
            
            if ($profile) {
                $oldCount = $profile->reviews_count;
                $oldAvg = $profile->average_rating;
                
                $newCount = $oldCount + 1;
                $newAvg = (($oldAvg * $oldCount) + $rating) / $newCount;

                $profile->update([
                    'reviews_count' => $newCount,
                    'average_rating' => round($newAvg, 2)
                ]);
            }

            return $review;
        });
    }
}
