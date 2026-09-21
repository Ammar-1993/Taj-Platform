<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Cache;
use Peterujah\Agora\Agora;
use Peterujah\Agora\Builders\RtcToken;
use Peterujah\Agora\Builders\RtmToken;
use Peterujah\Agora\Roles as AgoraRoles;
use Peterujah\Agora\User as AgoraUser;

class AgoraService
{
    protected ?string $appId;

    protected ?string $appCertificate;

    // Token TTL: 2 hours (7200 seconds)
    public const TOKEN_TTL_SECONDS = 7200;

    // Cache TTL: 110 minutes (Safety margin: refresh from cache 10 mins before Agora rejects it)
    public const CACHE_TTL_MINUTES = 110;

    public function __construct()
    {
        $this->appId = config('services.agora.app_id');
        $this->appCertificate = config('services.agora.app_certificate');
    }

    /**
     * Get or create an Agora RTC Token using atomic Redis caching.
     */
    public function getRtcToken(string $channelName, int $uid, string $role = 'publisher', ?int $bookingId = null): string
    {
        $roleKey = ($role === 'publisher' || $role === 'host') ? 'publisher' : 'subscriber';
        $cacheKey = "agora:rtc:{$channelName}:{$uid}:{$roleKey}";
        $legacyKey = $bookingId ? "agora_token_{$bookingId}_{$uid}" : null;

        if ($legacyKey && Cache::has($legacyKey)) {
            return (string) Cache::get($legacyKey);
        }

        return Cache::remember($cacheKey, now()->addMinutes(self::CACHE_TTL_MINUTES), function () use ($channelName, $uid, $role, $legacyKey) {
            $token = $this->generateRtcToken($channelName, $uid, $role);
            if ($legacyKey) {
                Cache::put($legacyKey, $token, now()->addMinutes(self::CACHE_TTL_MINUTES));
            }

            return $token;
        });
    }

    /**
     * Get or create an Agora RTM Token using atomic Redis caching.
     */
    public function getRtmToken(int|string $uid, ?int $bookingId = null): string
    {
        $cacheKey = "agora:rtm:{$uid}";
        $legacyKey = $bookingId ? "agora_rtm_token_{$bookingId}_{$uid}" : null;

        if ($legacyKey && Cache::has($legacyKey)) {
            return (string) Cache::get($legacyKey);
        }

        return Cache::remember($cacheKey, now()->addMinutes(self::CACHE_TTL_MINUTES), function () use ($uid, $legacyKey) {
            $token = $this->generateRtmToken((string) $uid);
            if ($legacyKey) {
                Cache::put($legacyKey, $token, now()->addMinutes(self::CACHE_TTL_MINUTES));
            }

            return $token;
        });
    }

    /**
     * Get or create a dedicated screen-sharing RTC Token.
     */
    public function getScreenToken(string $channelName, int $teacherUid, ?int $bookingId = null): string
    {
        $screenUid = $teacherUid + 1_000_000_000;
        $cacheKey = "agora:rtc:{$channelName}:{$screenUid}:publisher";
        $legacyKey = $bookingId ? "agora_token_{$bookingId}_screen" : null;

        if ($legacyKey && Cache::has($legacyKey)) {
            return (string) Cache::get($legacyKey);
        }

        return Cache::remember($cacheKey, now()->addMinutes(self::CACHE_TTL_MINUTES), function () use ($channelName, $screenUid, $legacyKey) {
            $token = $this->generateRtcToken($channelName, $screenUid, 'publisher');
            if ($legacyKey) {
                Cache::put($legacyKey, $token, now()->addMinutes(self::CACHE_TTL_MINUTES));
            }

            return $token;
        });
    }

    /**
     * Force-regenerate and overwrite cached tokens (used for mid-session token renewal).
     */
    public function refreshTokens(string $channelName, int $uid, bool $isTeacher = false, ?int $bookingId = null): array
    {
        $rtcToken = $this->generateRtcToken($channelName, $uid, 'publisher');
        $rtmToken = $this->generateRtmToken((string) $uid);

        Cache::put("agora:rtc:{$channelName}:{$uid}:publisher", $rtcToken, now()->addMinutes(self::CACHE_TTL_MINUTES));
        Cache::put("agora:rtm:{$uid}", $rtmToken, now()->addMinutes(self::CACHE_TTL_MINUTES));

        if ($bookingId) {
            Cache::put("agora_token_{$bookingId}_{$uid}", $rtcToken, now()->addMinutes(self::CACHE_TTL_MINUTES));
            Cache::put("agora_rtm_token_{$bookingId}_{$uid}", $rtmToken, now()->addMinutes(self::CACHE_TTL_MINUTES));
        }

        $screenToken = null;
        if ($isTeacher) {
            $screenUid = $uid + 1_000_000_000;
            $screenToken = $this->generateRtcToken($channelName, $screenUid, 'publisher');
            Cache::put("agora:rtc:{$channelName}:{$screenUid}:publisher", $screenToken, now()->addMinutes(self::CACHE_TTL_MINUTES));
            if ($bookingId) {
                Cache::put("agora_token_{$bookingId}_screen", $screenToken, now()->addMinutes(self::CACHE_TTL_MINUTES));
            }
        }

        return [
            'token' => $rtcToken,
            'rtm_token' => $rtmToken,
            'screen_token' => $screenToken,
        ];
    }

    /**
     * Invalidate all cached tokens for a channel and participants upon cancellation.
     */
    public function invalidateTokens(string $channelName, int $teacherId, int $studentId, ?int $bookingId = null): void
    {
        if ($channelName) {
            Cache::forget("agora:rtc:{$channelName}:{$teacherId}:publisher");
            Cache::forget("agora:rtc:{$channelName}:{$studentId}:publisher");
            Cache::forget("agora:rtc:{$channelName}:".($teacherId + 1_000_000_000).':publisher');
        }

        Cache::forget("agora:rtm:{$teacherId}");
        Cache::forget("agora:rtm:{$studentId}");

        if ($bookingId) {
            Cache::forget("agora_token_{$bookingId}_{$teacherId}");
            Cache::forget("agora_token_{$bookingId}_{$studentId}");
            Cache::forget("agora_token_{$bookingId}_screen");
            Cache::forget("agora_rtm_token_{$bookingId}_{$teacherId}");
            Cache::forget("agora_rtm_token_{$bookingId}_{$studentId}");
        }
    }

    // ── Internal Token Builders ──────────────────────────────────────────

    public function generateRtcToken(string $channelName, int $uid, string $role = 'publisher'): string
    {
        $this->ensureConfigured();

        $client = new Agora($this->appId, $this->appCertificate);
        $client->setExpiration(now()->addSeconds(self::TOKEN_TTL_SECONDS)->timestamp);

        $agoraUser = new AgoraUser($uid);
        $agoraUser->setChannel($channelName);
        $agoraUser->setRole(($role === 'publisher' || $role === 'host') ? AgoraRoles::RTC_PUBLISHER : AgoraRoles::RTC_SUBSCRIBER);
        $agoraUser->setPrivilegeExpire(now()->addSeconds(self::TOKEN_TTL_SECONDS)->timestamp);

        return RtcToken::buildTokenWithUid($client, $agoraUser);
    }

    public function generateRtmToken(string $uid): string
    {
        $this->ensureConfigured();

        $client = new Agora($this->appId, $this->appCertificate);
        $client->setExpiration(now()->addSeconds(self::TOKEN_TTL_SECONDS)->timestamp);

        $rtmUser = new AgoraUser((string) $uid);
        $rtmUser->setPrivilegeExpire(now()->addSeconds(self::TOKEN_TTL_SECONDS)->timestamp);

        return RtmToken::buildToken($client, $rtmUser);
    }

    protected function ensureConfigured(): void
    {
        if (! $this->appId || ! $this->appCertificate) {
            throw new Exception('Agora configuration missing');
        }
    }
}
