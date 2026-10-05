<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $session_summary_id
 * @property int $booking_id
 * @property string|null $title
 * @property array $questions
 * @property array|null $student_answers
 * @property int|null $score
 * @property int $total_questions
 * @property Carbon|null $completed_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class SessionQuiz extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_summary_id',
        'booking_id',
        'title',
        'questions',
        'student_answers',
        'score',
        'total_questions',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'questions' => 'array',
            'student_answers' => 'array',
            'score' => 'integer',
            'total_questions' => 'integer',
            'completed_at' => 'datetime',
        ];
    }

    public function sessionSummary(): BelongsTo
    {
        return $this->belongsTo(SessionSummary::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
