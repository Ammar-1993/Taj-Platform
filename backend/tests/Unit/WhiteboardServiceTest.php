<?php

namespace Tests\Unit;

use App\Services\WhiteboardService;
use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * WhiteboardServiceTest
 *
 * اختبارات الوحدة لـ WhiteboardService تغطي:
 * - إنشاء غرفة السبورة (createRoom): النجاح والفشل
 * - الحصول على توكن الغرفة (getRoomToken): من الكاش ومن API
 * - تجديد التوكن (refreshRoomToken)
 * - منطق إعادة المحاولة عند أخطاء 5xx
 */
class WhiteboardServiceTest extends TestCase
{
    protected WhiteboardService $service;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.whiteboard.sdk_token' => 'NETLESSSDK_YWs9xxxxxxxxxxxxtest']);
        config(['services.whiteboard.region' => 'sg']);
        $this->service = new WhiteboardService;
    }

    // ─── createRoom ────────────────────────────────────────────────────────────

    #[Test]
    public function test_create_room_returns_uuid_on_success(): void
    {
        Http::fake([
            'api.netless.link/v5/rooms' => Http::response(['uuid' => 'test-room-uuid-abc123'], 201),
        ]);

        $uuid = $this->service->createRoom('غرفة اختبار');

        $this->assertSame('test-room-uuid-abc123', $uuid);
    }

    #[Test]
    public function test_create_room_throws_exception_on_permanent_server_error(): void
    {
        $this->expectException(Exception::class);
        $this->expectExceptionMessageMatches('/فشل إنشاء غرفة السبورة/u');

        Http::fake([
            'api.netless.link/v5/rooms' => Http::sequence()
                ->push('Server Error', 500)
                ->push('Server Error', 500)
                ->push('Server Error', 500),
        ]);

        $this->service->createRoom('غرفة اختبار');
    }

    #[Test]
    public function test_create_room_succeeds_after_retry(): void
    {
        Http::fake([
            'api.netless.link/v5/rooms' => Http::sequence()
                ->push('Server Error', 500)
                ->push('Server Error', 500)
                ->push(['uuid' => 'retry-uuid'], 201),
        ]);

        $uuid = $this->service->createRoom('غرفة');

        $this->assertSame('retry-uuid', $uuid);
    }

    #[Test]
    public function test_create_room_does_not_retry_on_client_error(): void
    {
        $this->expectException(Exception::class);

        Http::fake([
            'api.netless.link/v5/rooms' => Http::sequence()
                ->push('Unauthorized', 401),
        ]);

        $this->service->createRoom('غرفة');

        Http::assertSentCount(1);
    }

    // ─── getRoomToken ───────────────────────────────────────────────────────────

    #[Test]
    public function test_get_room_token_uses_cache_when_available(): void
    {
        $uuid = 'cached-room-uuid';
        $role = 'admin';
        $cacheKey = "whiteboard_token_{$uuid}_{$role}";

        Cache::put($cacheKey, 'cached-token-value', now()->addHour());

        Http::fake();

        $token = $this->service->getRoomToken($uuid, $role);

        $this->assertSame('cached-token-value', $token);
        Http::assertNothingSent();
    }

    #[Test]
    public function test_get_room_token_fetches_from_api_on_cache_miss(): void
    {
        $uuid = 'fresh-room-uuid';
        $role = 'reader';
        $cacheKey = "whiteboard_token_{$uuid}_{$role}";

        Cache::forget($cacheKey);

        Http::fake([
            "api.netless.link/v5/tokens/rooms/{$uuid}" => Http::response('NETLESSROOM_fresh-token-string', 201),
        ]);

        $token = $this->service->getRoomToken($uuid, $role);

        $this->assertNotEmpty($token);
        $this->assertNotNull(Cache::get($cacheKey));
    }

    #[Test]
    public function test_get_room_token_throws_exception_on_api_failure(): void
    {
        $this->expectException(Exception::class);
        $this->expectExceptionMessageMatches('/فشل الحصول على توكن/u');

        $uuid = 'failing-room-uuid';
        $role = 'admin';
        $cacheKey = "whiteboard_token_{$uuid}_{$role}";
        Cache::forget($cacheKey);

        Http::fake([
            "api.netless.link/v5/tokens/rooms/{$uuid}" => Http::response('Server Error', 500),
        ]);

        $this->service->getRoomToken($uuid, $role);
    }

    // ─── refreshRoomToken ───────────────────────────────────────────────────────

    #[Test]
    public function test_refresh_room_token_bypasses_cache_and_updates_it(): void
    {
        $uuid = 'refresh-room-uuid';
        $role = 'admin';
        $cacheKey = "whiteboard_token_{$uuid}_{$role}";

        Cache::put($cacheKey, 'old-token', now()->addHour());

        Http::fake([
            "api.netless.link/v5/tokens/rooms/{$uuid}" => Http::response('NETLESSROOM_brand-new-token', 201),
        ]);

        $newToken = $this->service->refreshRoomToken($uuid, $role);

        $this->assertNotSame('old-token', $newToken);
        $this->assertSame($newToken, Cache::get($cacheKey));
        Http::assertSentCount(1);
    }
}
