<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Exception;

class WhiteboardService
{
    protected string $sdkToken;
    protected string $region;
    protected string $baseUrl = 'https://api.netless.link/v5';

    public function __construct()
    {
        $this->sdkToken = config('services.whiteboard.sdk_token') ?? env('WHITEBOARD_SDK_TOKEN');
        $this->region = config('services.whiteboard.region') ?? env('WHITEBOARD_REGION', 'eu');
    }

    /**
     * Create a new whiteboard room.
     * 
     * @param string $name
     * @return string Room UUID
     * @throws Exception
     */
    public function createRoom(string $name = 'Classroom')
    {
        // Note: The 'name' parameter is intentionally omitted as it causes 
        // "disable input name" errors in certain v5 API regions.
        $response = Http::withHeaders([
            'token' => $this->sdkToken,
            'Content-Type' => 'application/json',
            'region' => $this->region,
        ])->post("{$this->baseUrl}/rooms", [
            'isRecord' => false,
            'limit' => 0,
        ]);

        if ($response->successful()) {
            return $response->json('uuid');
        }

        throw new Exception('فشل إنشاء غرفة السبورة التفاعلية: ' . $response->body());
    }

    /**
     * Generate a join token for a specific room.
     * 
     * @param string $roomUuid
     * @return string Room Token
     */
    public function getRoomToken(string $roomUuid)
    {
        // For Netless/Agora Whiteboard, tokens can be generated via API or locally if we had the SDK.
        // Using the API to get a room token is reliable.
        $response = Http::withHeaders([
            'token' => $this->sdkToken,
            'Content-Type' => 'application/json',
            'region' => $this->region,
        ])->post("{$this->baseUrl}/tokens/rooms/{$roomUuid}", [
            'lifespan' => 3600000, // 1 hour in ms
            'role' => 'admin',     // Allows full control
        ]);

        if ($response->successful()) {
            // The Netless API returns the room token as a JSON-encoded string (e.g. "NETLESSROOM_xxx").
            // json_decode on the raw body is the safest way to strip surrounding quotes.
            $body = $response->body();
            $decoded = json_decode($body, true);
            return is_string($decoded) ? $decoded : $body;
        }

        throw new Exception('فشل توليد توكن السبورة: ' . $response->body());
    }
}
