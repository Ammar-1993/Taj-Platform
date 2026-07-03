<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Services\BookingService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class CloseAbandonedClassrooms extends Command
{
    protected $signature = 'classrooms:close-abandoned';
    protected $description = 'يبحث عن الحصص العالقة في in_progress بدون نبضة حياة حديثة ويغلقها تلقائياً';

    public function handle(BookingService $bookingService): int
    {
        $staleCutoff  = Carbon::now()->subMinutes(10);
        $legacyCutoff = Carbon::now()->subMinutes(20);

        $abandoned = Booking::where('status', 'in_progress')
            ->where(function ($query) use ($staleCutoff, $legacyCutoff) {
                $query->where('last_heartbeat_at', '<', $staleCutoff)
                    ->orWhere(function ($q) use ($legacyCutoff) {
                        $q->whereNull('last_heartbeat_at')
                          ->where('teacher_joined_at', '<', $legacyCutoff);
                    });
            })
            ->get();

        foreach ($abandoned as $booking) {
            $bookingService->abandonBooking($booking);
            $this->info("تم إغلاق الحصة المهجورة رقم #{$booking->id}");
        }

        $this->info("انتهى الفحص. عدد الحصص المُغلقة: {$abandoned->count()}");
        return self::SUCCESS;
    }
}
