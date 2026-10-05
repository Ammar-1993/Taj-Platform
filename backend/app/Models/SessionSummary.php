<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property int $booking_id
 * @property string|null $summary_content
 * @property array|null $key_takeaways
 * @property string $status
 * @property string|null $model_used
 * @property int|null $tokens_used
 * @property string|null $error_message
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class SessionSummary extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'summary_content',
        'key_takeaways',
        'status',
        'model_used',
        'tokens_used',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'key_takeaways' => 'array',
            'tokens_used' => 'integer',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function quiz(): HasOne
    {
        return $this->hasOne(SessionQuiz::class);
    }
}
