<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * DrawingBatchReceived
 *
 * يُطلَق عندما يرسل المعلم دفعة من نقاط الرسم عبر السبورة التفاعلية.
 * يُبثّ على قناة خاصة بالحجز حتى يستقبلها الطالب في الوقت الحقيقي.
 *
 * القناة: private-classroom.{bookingId}
 * الاسم:  DrawingBatchReceived
 */
class DrawingBatchReceived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param int   $bookingId  معرّف الحجز (يُحدِّد القناة الخاصة)
     * @param array $points     مصفوفة نقاط الرسم [['x'=>..., 'y'=>...], ...]
     * @param string $color     لون الفرشاة (hex، مثل '#000000')
     * @param int   $width      سُمك الفرشاة بالبكسل
     */
    public function __construct(
        public readonly int    $bookingId,
        public readonly array  $points,
        public readonly string $color,
        public readonly int    $width,
    ) {}

    /**
     * القناة التي يُبثّ عليها الحدث.
     * نستخدم قناة خاصة (private) لضمان أن الطالب المعني فقط
     * هو من يستقبل البيانات دون غيره.
     */
    public function broadcastOn(): Channel
    {
        return new Channel("classroom.{$this->bookingId}");
    }

    /**
     * الاسم المُخصَّص للحدث المُبثّ (يُستخدم على جانب الـ Frontend).
     */
    public function broadcastAs(): string
    {
        return 'DrawingBatchReceived';
    }

    /**
     * البيانات المُرسَلة مع الحدث.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'points' => $this->points,
            'color'  => $this->color,
            'width'  => $this->width,
        ];
    }
}
