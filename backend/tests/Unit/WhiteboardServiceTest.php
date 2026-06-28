<?php

namespace Tests\Unit;

use App\Services\WhiteboardService;
use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
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
        // تهيئة الإعدادات اللازمة للاختبار
        config(['services.whiteboard.sdk_token' => 'NETLESSSDK_YWs9xxxxxxxxxxxxtest']);
        config(['services.whiteboard.region' => 'sg']);
        $this->service = new WhiteboardService();
    }

    // ─── createRoom ────────────────────────────────────────────────────────────

    /**
     * @test
     * createRoom يجب أن يُعيد UUID الغرفة عند نجاح الاستجابة.
     */
    public function test_create_room_returns_uuid_on_success(): void
    {
        Http::fake([
            'api.netless.link/v5/rooms' => Http::response(['uuid' => 'test-room-uuid-abc123'], 201),
        ]);

        $uuid = $this->service->createRoom('غرفة اختبار');

        $this->assertSame('test-room-uuid-abc123', $uuid);
    }

    /**
     * @test
     * createRoom يجب أن يرفع Exception عند استجابة 5xx نهائية (بعد كل المحاولات).
     */
    public function test_create_room_throws_exception_on_permanent_server_error(): void
    {
        $this->expectException(Exception::class);
        $this->expectExceptionMessageMatches('/فشل إنشاء غرفة السبورة/u');

        // الاستجابة 500 لكل المحاولات (3 محاولات)
        Http::fake([
            'api.netless.link/v5/rooms' => Http::sequence()
                ->push('Server Error', 500)
                ->push('Server Error', 500)
                ->push('Server Error', 500),
        ]);

        $this->service->createRoom('غرفة اختبار');
    }

    /**
     * @test
     * createRoom يجب أن ينجح في المحاولة الثالثة إذا فشلت الأولى والثانية.
     */
    public function test_create_room_succeeds_after_retry(): void
    {
        Http::fake([
            'api.netless.link/v5/rooms' => Http::sequence()
                ->push('Server Error', 500)     // المحاولة 1: فشل
                ->push('Server Error', 500)     // المحاولة 2: فشل
                ->push(['uuid' => 'retry-uuid'], 201), // المحاولة 3: نجاح
        ]);

        $uuid = $this->service->createRoom('غرفة');

        $this->assertSame('retry-uuid', $uuid);
    }

    /**
     * @test
     * createRoom لا يجب أن يعيد المحاولة عند خطأ 4xx (خطأ العميل/المصادقة).
     */
    public function test_create_room_does_not_retry_on_client_error(): void
    {
        $this->expectException(Exception::class);

        Http::fake([
            'api.netless.link/v5/rooms' => Http::sequence()
                ->push('Unauthorized', 401),    // خطأ 4xx — لا إعادة محاولة
        ]);

        $this->service->createRoom('غرفة');

        // التحقق من أنه أرسل طلبًا واحدًا فقط
        Http::assertSentCount(1);
    }

    // ─── getRoomToken ───────────────────────────────────────────────────────────

    /**
     * @test
     * getRoomToken يجب أن يستخدم الكاش إذا كان موجودًا ولا يستدعي API.
     */
    public function test_get_room_token_uses_cache_when_available(): void
    {
        $uuid     = 'cached-room-uuid';
        $role     = 'admin';
        $cacheKey = "whiteboard_token_{$uuid}_{$role}";

        Cache::put($cacheKey, 'cached-token-value', now()->addHour());

        Http::fake(); // لا يجب أن يُرسل أي طلب HTTP

        $token = $this->service->getRoomToken($uuid, $role);

        $this->assertSame('cached-token-value', $token);
        Http::assertNothingSent();
    }

    /**
     * @test
     * getRoomToken يجب أن يستدعي Netless API ويخزن النتيجة في الكاش إذا لم يكن موجودًا.
     */
    public function test_get_room_token_fetches_from_api_on_cache_miss(): void
    {
        $uuid     = 'fresh-room-uuid';
        $role     = 'reader';
        $cacheKey = "whiteboard_token_{$uuid}_{$role}";

        Cache::forget($cacheKey);

        Http::fake([
            "api.netless.link/v5/tokens/rooms/{$uuid}" => Http::response('NETLESSROOM_fresh-token-string', 201),
        ]);

        $token = $this->service->getRoomToken($uuid, $role);

        $this->assertNotEmpty($token);
        // التحقق من أن الكاش قد خُزّن
        $this->assertNotNull(Cache::get($cacheKey));
    }

    /**
     * @test
     * getRoomToken يجب أن يرفع Exception عند استجابة 5xx نهائية من API.
     */
    public function test_get_room_token_throws_exception_on_api_failure(): void
    {
        $this->expectException(Exception::class);
        $this->expectExceptionMessageMatches('/فشل الحصول على توكن/u');

        $uuid     = 'failing-room-uuid';
        $role     = 'admin';
        $cacheKey = "whiteboard_token_{$uuid}_{$role}";
        Cache::forget($cacheKey);

        Http::fake([
            "api.netless.link/v5/tokens/rooms/{$uuid}" => Http::response('Server Error', 500),
        ]);

        $this->service->getRoomToken($uuid, $role);
    }

    // ─── refreshRoomToken ───────────────────────────────────────────────────────

    /**
     * @test
     * refreshRoomToken يجب أن يتجاوز الكاش ويُولّد توكنًا جديدًا ويُحدّث الكاش.
     */
    public function test_refresh_room_token_bypasses_cache_and_updates_it(): void
    {
        $uuid     = 'refresh-room-uuid';
        $role     = 'admin';
        $cacheKey = "whiteboard_token_{$uuid}_{$role}";

        // ضع توكنًا قديمًا في الكاش
        Cache::put($cacheKey, 'old-token', now()->addHour());

        Http::fake([
            "api.netless.link/v5/tokens/rooms/{$uuid}" => Http::response('NETLESSROOM_brand-new-token', 201),
        ]);

        $newToken = $this->service->refreshRoomToken($uuid, $role);

        $this->assertNotSame('old-token', $newToken);
        // التحقق من تحديث الكاش بالتوكن الجديد
        $this->assertSame($newToken, Cache::get($cacheKey));
        Http::assertSentCount(1);
    }
}
