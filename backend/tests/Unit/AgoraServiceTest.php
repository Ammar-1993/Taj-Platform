<?php

namespace Tests\Unit;

use App\Services\AgoraService;
use Exception;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class AgoraServiceTest extends TestCase
{
    protected AgoraService $service;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.agora.app_id' => '12345678901234567890123456789012',
            'services.agora.app_certificate' => '12345678901234567890123456789012',
        ]);
        $this->service = new AgoraService;
    }

    #[Test]
    public function test_get_rtc_token_generates_token_and_caches_it(): void
    {
        $channel = 'test_channel_1';
        $uid = 101;

        $token = $this->service->getRtcToken($channel, $uid, 'publisher');

        $this->assertNotEmpty($token);
        $this->assertTrue(Cache::has("agora:rtc:{$channel}:{$uid}:publisher"));
        $this->assertSame($token, Cache::get("agora:rtc:{$channel}:{$uid}:publisher"));
    }

    #[Test]
    public function test_get_rtc_token_uses_cached_token_on_subsequent_calls(): void
    {
        $channel = 'test_channel_2';
        $uid = 102;

        Cache::put("agora:rtc:{$channel}:{$uid}:publisher", 'cached_rtc_token_xyz', now()->addHours(2));

        $token = $this->service->getRtcToken($channel, $uid, 'publisher');

        $this->assertSame('cached_rtc_token_xyz', $token);
    }

    #[Test]
    public function test_get_rtm_token_generates_token_and_caches_it(): void
    {
        $uid = 201;

        $token = $this->service->getRtmToken($uid);

        $this->assertNotEmpty($token);
        $this->assertTrue(Cache::has("agora:rtm:{$uid}"));
        $this->assertSame($token, Cache::get("agora:rtm:{$uid}"));
    }

    #[Test]
    public function test_get_screen_token_uses_offset_uid_and_caches_it(): void
    {
        $channel = 'test_screen_channel';
        $teacherUid = 50;
        $expectedScreenUid = 50 + 1_000_000_000;

        $screenToken = $this->service->getScreenToken($channel, $teacherUid);

        $this->assertNotEmpty($screenToken);
        $this->assertTrue(Cache::has("agora:rtc:{$channel}:{$expectedScreenUid}:publisher"));
    }

    #[Test]
    public function test_refresh_tokens_overwrites_cache_and_returns_tokens(): void
    {
        $channel = 'refresh_channel';
        $teacherUid = 77;
        $bookingId = 999;

        $result = $this->service->refreshTokens($channel, $teacherUid, isTeacher: true, bookingId: $bookingId);

        $this->assertArrayHasKey('token', $result);
        $this->assertArrayHasKey('rtm_token', $result);
        $this->assertArrayHasKey('screen_token', $result);
        $this->assertNotEmpty($result['token']);
        $this->assertNotEmpty($result['rtm_token']);
        $this->assertNotEmpty($result['screen_token']);

        $this->assertSame($result['token'], Cache::get("agora:rtc:{$channel}:{$teacherUid}:publisher"));
        $this->assertSame($result['rtm_token'], Cache::get("agora:rtm:{$teacherUid}"));
        $this->assertSame($result['token'], Cache::get("agora_token_{$bookingId}_{$teacherUid}"));
    }

    #[Test]
    public function test_invalidate_tokens_removes_all_related_keys(): void
    {
        $channel = 'invalidate_channel';
        $teacherId = 10;
        $studentId = 20;
        $bookingId = 55;

        // Populate tokens
        $this->service->getRtcToken($channel, $teacherId, 'publisher', $bookingId);
        $this->service->getRtcToken($channel, $studentId, 'publisher', $bookingId);
        $this->service->getRtmToken($teacherId, $bookingId);
        $this->service->getRtmToken($studentId, $bookingId);

        // Invalidate
        $this->service->invalidateTokens($channel, $teacherId, $studentId, $bookingId);

        $this->assertFalse(Cache::has("agora:rtc:{$channel}:{$teacherId}:publisher"));
        $this->assertFalse(Cache::has("agora:rtc:{$channel}:{$studentId}:publisher"));
        $this->assertFalse(Cache::has("agora:rtm:{$teacherId}"));
        $this->assertFalse(Cache::has("agora:rtm:{$studentId}"));
        $this->assertFalse(Cache::has("agora_token_{$bookingId}_{$teacherId}"));
    }

    #[Test]
    public function test_missing_credentials_throws_exception(): void
    {
        config(['services.agora.app_id' => null]);
        $service = new AgoraService;

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Agora configuration missing');

        $service->getRtcToken('test_chan', 1);
    }
}
