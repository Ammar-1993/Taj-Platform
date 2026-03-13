<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;


class ProfileController extends Controller
{
    // استكمال بيانات المعلم
    public function completeTeacherProfile(Request $request): JsonResponse
    {
        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'bio' => 'nullable|string|max:1000',
        ]);
        /** @var \App\Models\User $user */
        $user = $request->user();

        if (! $user->hasRole('teacher')) {
            return response()->json(['message' => 'غير مصرح لك.'], 403);
        }

        $profile = $user->teacherProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'subject_id' => $request->subject_id,
                'bio' => $request->bio,
                // نجعله false افتراضياً حتى توافق عليه الإدارة لاحقاً
                'is_verified' => false,
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'تم استكمال ملف المعلم بنجاح',
            'data' => $profile,
        ]);
    }

    // استكمال بيانات الطالب
    public function completeStudentProfile(Request $request): JsonResponse
    {
        $request->validate([
            'grade_level_id' => 'required|exists:grade_levels,id',
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();

        if (! $user->hasRole('student')) {
            return response()->json(['message' => 'غير مصرح لك.'], 403);
        }

        $profile = $user->studentProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'grade_level_id' => $request->grade_level_id,
                'can_book_independently' => true,
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'تم استكمال ملف الطالب بنجاح',
            'data' => $profile,
        ]);
    }
}
