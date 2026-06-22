<?php

namespace Tests\Unit;

use App\Services\WhiteboardService;
use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WhiteboardServiceTest extends TestCase
{
    protected WhiteboardService $service;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.netless.access_key' => 'test-key']);
        config(['services.netless.secret_key' => 'test-secret']);
        $this->service = new WhiteboardService();
    }

    public function test_create_room_returns_uuid_on_success()
    {
        Http::fake([
            'api.netless.link/v5/rooms' => Http::response(['uuid' => 'test-room-uuid'], 201),
        ]);

        $uuid = $this->service->createRoom('Test Room');

        $this->assertEquals('test-room-uuid', $uuid);
    }

    public function test_create_room_throws_exception_on_failure()
    {
        $this->expectException(Exception::class);

        Http::fake([
            'api.netless.link/v5/rooms' => Http::response('Server Error', 500),
        ]);

        $this->service->createRoom('Test Room');
    }
}
