<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Exception;

class WhiteboardService
{
    protected string $sdkToken;
    protected string $region;
    protected string $baseUrl = 'https://api.netless.link/v5';

    /**
     * Maximum attempts for every Netless HTTP call.
     * Back-off: 500ms → 1 500ms → 4 500ms (each interval is tripled).
     */
    private const HTTP_TRIES      = 3;
    private const HTTP_RETRY_MS   = 500;
    private const HTTP_TIMEOUT_S  = 15;

    public function __construct()
    {
        $this->sdkToken = config('services.whiteboard.sdk_token') ?? env('WHITEBOARD_SDK_TOKEN');
        $this->region   = config('services.whiteboard.region') ?? env('WHITEBOARD_REGION', 'sg');
    }

    /**
     * Build a pre-configured HTTP client with auth headers, timeout, and
     * exponential back-off retries on 5xx / connection failures.
     */
    private function http(): \Illuminate\Http\Client\PendingRequest
    {
        return Http::withHeaders([
            'token'        => $this->sdkToken,
            'Content-Type' => 'application/json',
            'region'       => $this->region,
        ])
        ->timeout(self::HTTP_TIMEOUT_S)
        ->retry(
            self::HTTP_TRIES,
            self::HTTP_RETRY_MS,
            // Only retry on server errors (5xx) or connection failures.
            // Never retry on 4xx — those are always configuration/auth issues.
            //
            // Laravel's retry() passes: (Throwable $e, PendingRequest $pending, string $method).
            // To inspect the HTTP response we must unwrap a RequestException, not receive
            // a Response object directly — that was the root cause of the previous TypeError.
            function (\Throwable $exception, \Illuminate\Http\Client\PendingRequest $pending, string $method): bool {
                if (
                    $exception instanceof \Illuminate\Http\Client\RequestException
                    && $exception->response->serverError()
                ) {
                    return true;
                }
                // Retry on connection-level failures (timeout, DNS, etc.)
                return $exception instanceof \Illuminate\Http\Client\ConnectionException;
            },
            throw: false   // Return the last failed response instead of throwing
        );
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
        $response = $this->http()->post("{$this->baseUrl}/rooms", [
            'isRecord' => false,
            'limit'    => 0,
        ]);

        if ($response->successful()) {
            return $response->json('uuid');
        }

        $errorMessage = 'فشل إنشاء غرفة السبورة التفاعلية: ' . $response->body();
        if (class_exists(\Sentry\SentrySdk::class)) {
            \Sentry\captureException(new Exception($errorMessage));
        }
        throw new Exception($errorMessage);
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
     * Force-mint a fresh room token, bypassing the cache.
     *
     * Used by the whiteboard token refresh endpoint when the SDK signals
     * that the current token has expired mid-session.
     *
     * @throws Exception
     */
    public function refreshRoomToken(string $roomUuid, string $role, int $lifespanMs = 3600000): string
    {
        $token = $this->mintRoomToken($roomUuid, $role, $lifespanMs);

        // Overwrite the stale cached token immediately
        $cacheMinutes = max(1, (int) floor($lifespanMs / 60000) - 10);
        Cache::put("whiteboard_token_{$roomUuid}_{$role}", $token, now()->addMinutes($cacheMinutes));

        return $token;
    }

    /**
     * Actually call the Netless API to mint a room token (used by getRoomToken cache).
     *
     * @throws Exception
     */
    private function mintRoomToken(string $roomUuid, string $role, int $lifespanMs): string
    {
        $response = $this->http()->post("{$this->baseUrl}/tokens/rooms/{$roomUuid}", [
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

        throw new Exception('فشل الحصول على توكن السبورة: ' . $response->body());
    }
}
