<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ReviewService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    protected ReviewService $reviewService;

    public function __construct(ReviewService $reviewService)
    {
        $this->reviewService = $reviewService;
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        /** @var User $user */
        $user = $request->user();

        try {
            $review = $this->reviewService->submitReview(
                $user,
                $request->booking_id,
                $request->rating,
                $request->comment
            );

            return response()->json([
                'status' => 'success',
                'message' => 'تم حفظ التقييم بنجاح، شكراً لك!',
                'data' => $review,
            ]);

        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 400); // 400 Bad Request if logic fails
        }
    }
}
