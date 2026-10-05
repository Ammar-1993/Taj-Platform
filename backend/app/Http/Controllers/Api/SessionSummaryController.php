<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateSessionSummaryJob;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionSummaryController extends Controller
{
    /**
     * Determine if user is authorized to view or manage the session summary.
     */
    private function isParticipant(User $user, Booking $booking): bool
    {
        return in_array($user->id, [
            $booking->student_id,
            $booking->teacher_id,
            $booking->booked_by_id,
        ], true)
            || ($booking->student && $booking->student->parent_id === $user->id)
            || $user->hasRole('admin');
    }

    /**
     * Get the session summary and interactive quiz for a booking.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $booking = Booking::with(['sessionSummary.quiz', 'student'])->findOrFail($id);

        if (! $this->isParticipant($user, $booking)) {
            return response()->json([
                'status' => 'error',
                'message' => 'غير مصرح لك بالوصول إلى ملخص هذه الحصة.',
            ], 403);
        }

        if ($booking->status !== 'completed') {
            return response()->json([
                'status' => 'error',
                'message' => 'ملخص الجلسة متاح فقط للحصص المكتملة.',
            ], 400);
        }

        $summary = $booking->sessionSummary;

        if (! $summary) {
            GenerateSessionSummaryJob::dispatch($booking);

            return response()->json([
                'status' => 'pending',
                'message' => 'جاري توليد الملخص والاختبار الذكي في الخلفية...',
                'data' => [
                    'status' => 'pending',
                ],
            ]);
        }

        if ($summary->status === 'pending') {
            return response()->json([
                'status' => 'pending',
                'message' => 'جاري إعداد الملخص الذكي...',
                'data' => [
                    'status' => 'pending',
                ],
            ]);
        }

        if ($summary->status === 'failed') {
            return response()->json([
                'status' => 'failed',
                'message' => 'تعذر توليد الملخص تلقائياً، يمكنك النقر لإعادة المحاولة.',
                'data' => [
                    'status' => 'failed',
                    'error' => $summary->error_message,
                ],
            ]);
        }

        $quiz = $summary->quiz;
        $sanitizedQuestions = [];

        if ($quiz && is_array($quiz->questions)) {
            $isCompleted = ! empty($quiz->completed_at);
            $isTeacherOrAdmin = $user->id === $booking->teacher_id || $user->hasRole('admin');

            foreach ($quiz->questions as $q) {
                $item = [
                    'id' => $q['id'] ?? null,
                    'question' => $q['question'] ?? '',
                    'options' => $q['options'] ?? [],
                ];

                // حماية تربوية: إخفاء الإجابة والشرح حتى يكمل الطالب الحل لمنع الغش من الـ DevTools
                if ($isCompleted || $isTeacherOrAdmin) {
                    $item['correct_answer_index'] = $q['correct_answer_index'] ?? null;
                    $item['explanation'] = $q['explanation'] ?? '';
                }

                $sanitizedQuestions[] = $item;
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'summary' => [
                    'id' => $summary->id,
                    'status' => $summary->status,
                    'content' => $summary->summary_content,
                    'key_takeaways' => $summary->key_takeaways ?? [],
                    'model_used' => $summary->model_used,
                    'created_at' => $summary->created_at?->toIso8601String(),
                ],
                'quiz' => $quiz ? [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'total_questions' => $quiz->total_questions,
                    'score' => $quiz->score,
                    'student_answers' => $quiz->student_answers,
                    'completed_at' => $quiz->completed_at?->toIso8601String(),
                    'questions' => $sanitizedQuestions,
                ] : null,
            ],
        ]);
    }

    /**
     * Submit student answers for the session quiz and calculate score.
     */
    public function submitQuiz(Request $request, int $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $booking = Booking::with(['sessionSummary.quiz', 'student'])->findOrFail($id);

        $isStudentOrPayer = ($user->id === $booking->student_id)
            || ($user->id === $booking->booked_by_id)
            || ($booking->student && $booking->student->parent_id === $user->id);

        if (! $isStudentOrPayer && ! $user->hasRole('admin')) {
            return response()->json([
                'status' => 'error',
                'message' => 'حل الاختبار مخصص للطالب فقط.',
            ], 403);
        }

        $quiz = $booking->sessionSummary?->quiz;

        if (! $quiz || empty($quiz->questions)) {
            return response()->json([
                'status' => 'error',
                'message' => 'لا يوجد اختبار متاح لهذه الحصة.',
            ], 404);
        }

        $validated = $request->validate([
            'answers' => 'required|array',
            'answers.*' => 'required|integer|min:0|max:10',
        ]);

        $submittedAnswers = $validated['answers'];
        $score = 0;
        $detailedResults = [];

        foreach ($quiz->questions as $q) {
            $qId = (string) $q['id'];
            $correct = $q['correct_answer_index'] ?? 0;
            $chosen = $submittedAnswers[$qId] ?? $submittedAnswers[$q['id']] ?? null;

            $isCorrect = ($chosen !== null && (int) $chosen === (int) $correct);
            if ($isCorrect) {
                $score++;
            }

            $detailedResults[] = [
                'id' => $q['id'],
                'question' => $q['question'],
                'options' => $q['options'],
                'chosen_answer_index' => $chosen !== null ? (int) $chosen : null,
                'correct_answer_index' => $correct,
                'is_correct' => $isCorrect,
                'explanation' => $q['explanation'] ?? '',
            ];
        }

        $totalQuestions = count($quiz->questions);

        $quiz->update([
            'student_answers' => $submittedAnswers,
            'score' => $score,
            'total_questions' => $totalQuestions,
            'completed_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "أحسنت! تم تصحيح الاختبار وحصلت على {$score} من {$totalQuestions}.",
            'data' => [
                'score' => $score,
                'total_questions' => $totalQuestions,
                'percentage' => $totalQuestions > 0 ? round(($score / $totalQuestions) * 100) : 0,
                'completed_at' => $quiz->completed_at?->toIso8601String(),
                'results' => $detailedResults,
            ],
        ]);
    }

    /**
     * Trigger generation or re-generation of session summary and quiz.
     */
    public function generate(Request $request, int $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $booking = Booking::with('sessionSummary')->findOrFail($id);

        if (! $this->isParticipant($user, $booking)) {
            return response()->json([
                'status' => 'error',
                'message' => 'غير مصرح لك بطلب توليد ملخص هذه الحصة.',
            ], 403);
        }

        if ($booking->status !== 'completed') {
            return response()->json([
                'status' => 'error',
                'message' => 'لا يمكن توليد الملخص إلا للحصص المكتملة.',
            ], 400);
        }

        GenerateSessionSummaryJob::dispatch($booking);

        return response()->json([
            'status' => 'success',
            'message' => 'تم إطلاق مهمة توليد الملخص والاختبار الذكي في الخلفية بنجاح 🚀',
        ]);
    }
}
