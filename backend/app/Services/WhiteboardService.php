<?php

namespace App\Services;

use App\Events\DrawingBatchReceived;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Exception;

class WhiteboardService
{
    protected string $sdkToken;
    protected string $region;
    protected string $baseUrl = 'https://api.netless.link/v5';

    public function __construct()
    {
        $this->sdkToken = config('services.whiteboard.sdk_token') ?? env('WHITEBOARD_SDK_TOKEN');
        $this->region   = config('services.whiteboard.region') ?? env('WHITEBOARD_REGION', 'eu');
    }

    /**
     * Create a new whiteboard room.
     *
     * @return string Room UUID
     * @throws Exception
     */
    public function createRoom(string $name = 'Classroom'): string
    {
        // Note: The 'name' parameter is intentionally omitted as it causes
        // "disable input name" errors in certain v5 API regions.
        $response = Http::withHeaders([
            'token'        => $this->sdkToken,
            'Content-Type' => 'application/json',
            'region'       => $this->region,
        ])->post("{$this->baseUrl}/rooms", [
            'isRecord' => false,
            'limit'    => 0,
        ]);

        if ($response->successful()) {
            return $response->json('uuid');
        }

        throw new Exception('فشل إنشاء غرفة السبورة التفاعلية: ' . $response->body());
    }

    /**
     * Generate a join token for a specific room.
     *
     * Tokens are cached for 50 minutes (room lifespan is 1 hour) to eliminate
     * the blocking HTTP round-trip on every classroom join. A per-role cache
     * key ensures teachers receive an admin token and students a reader token.
     *
     * @param string $roomUuid
     * @param string $role       'admin' for teachers, 'reader' for students
     * @param int    $lifespanMs Token validity in milliseconds (default: 1 hour)
     * @return string Room Token
     * @throws Exception
     */
    public function getRoomToken(
        string $roomUuid,
        string $role = 'reader',
        int $lifespanMs = 3600000
    ): string {
        // Cache for slightly less than the token lifespan to avoid serving expired tokens.
        // lifespanMs is in ms → convert to minutes, then subtract a 10-minute safety buffer.
        $cacheMinutes = max(1, (int) floor($lifespanMs / 60000) - 10);

        $cacheKey = "whiteboard_token_{$roomUuid}_{$role}";

        return Cache::remember($cacheKey, now()->addMinutes($cacheMinutes), function () use ($roomUuid, $role, $lifespanMs) {
            return $this->mintRoomToken($roomUuid, $role, $lifespanMs);
        });
    }

    /**
     * Actually call the Netless API to mint a room token (used by getRoomToken cache).
     *
     * @throws Exception
     */
    private function mintRoomToken(string $roomUuid, string $role, int $lifespanMs): string
    {
        $response = Http::withHeaders([
            'token'        => $this->sdkToken,
            'Content-Type' => 'application/json',
            'region'       => $this->region,
        ])->post("{$this->baseUrl}/tokens/rooms/{$roomUuid}", [
            'lifespan' => $lifespanMs,
            'role'     => $role,
        ]);

        if ($response->successful()) {
            // The Netless API returns the room token as a JSON-encoded string (e.g. "NETLESSROOM_xxx").
            // json_decode on the raw body is the safest way to strip surrounding quotes.
            $body    = $response->body();
            $decoded = json_decode($body, true);

            return is_string($decoded) ? $decoded : $body;
        }

        throw new Exception('فشل توليد توكن السبورة: ' . $response->body());
    }
}
