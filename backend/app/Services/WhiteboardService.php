<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Exception;

class WhiteboardService
{
    protected string $sdkToken;
    protected string $baseUrl = 'https://api.netless.link/v1';

    public function __construct()
    {
        $this->sdkToken = config('services.whiteboard.sdk_token');
        
        if (empty($this->sdkToken)) {
            // Fallback for development if config not set yet
            $this->sdkToken = env('WHITEBOARD_SDK_TOKEN');
        }
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
        $response = Http::withHeaders([
            'token' => $this->sdkToken,
            'Content-Type' => 'application/json',
            'region' => 'us-sv', // Default region, can be adjusted
        ])->post("{$this->baseUrl}/rooms", [
            'name' => $name,
            'limit' => 0, // No limit on users
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
            'region' => 'us-sv',
        ])->post("{$this->baseUrl}/tokens/rooms/{$roomUuid}", [
            'lifespan' => 3600000, // 1 hour in ms
            'role' => 'admin',     // Allows full control
        ]);

        if ($response->successful()) {
            return $response->json(); // The token string
        }

        throw new Exception('فشل توليد توكن السبورة: ' . $response->body());
    }
}
