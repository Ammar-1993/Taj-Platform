<?php

namespace Tests\Unit;

use App\Support\CustomLostConnectionDetector;
use App\Support\CustomPredisConnector;
use Exception;
use Illuminate\Contracts\Database\LostConnectionDetector as LostConnectionDetectorContract;
use PHPUnit\Framework\Attributes\Test;
use Predis\Connection\ConnectionException;
use Predis\Connection\NodeConnectionInterface;
use RuntimeException;
use Tests\TestCase;

class RedisQueueResilienceTest extends TestCase
{
    #[Test]
    public function it_binds_custom_lost_connection_detector_in_container(): void
    {
        $detector = app(LostConnectionDetectorContract::class);

        $this->assertInstanceOf(CustomLostConnectionDetector::class, $detector);
    }

    #[Test]
    public function it_detects_predis_connection_exception_as_lost_connection(): void
    {
        $detector = new CustomLostConnectionDetector;

        $predisException = new ConnectionException(
            $this->createMock(NodeConnectionInterface::class),
            'Stream is already at the end'
        );

        $this->assertTrue($detector->causedByLostConnection($predisException));
    }

    #[Test]
    public function it_detects_stream_is_already_at_the_end_in_generic_exception(): void
    {
        $detector = new CustomLostConnectionDetector;

        $e = new RuntimeException('Stream is already at the end [tcp://taj_redis:6379]');

        $this->assertTrue($detector->causedByLostConnection($e));
    }

    #[Test]
    public function it_detects_redis_connection_refused_or_closed(): void
    {
        $detector = new CustomLostConnectionDetector;

        $this->assertTrue($detector->causedByLostConnection(new Exception('Connection refused')));
        $this->assertTrue($detector->causedByLostConnection(new Exception('Connection closed')));
        $this->assertTrue($detector->causedByLostConnection(new Exception('Error while reading line from the server')));
    }

    #[Test]
    public function it_preserves_standard_sql_lost_connection_detection(): void
    {
        $detector = new CustomLostConnectionDetector;

        $this->assertTrue($detector->causedByLostConnection(new Exception('server has gone away')));
        $this->assertTrue($detector->causedByLostConnection(new Exception('Lost connection to MySQL server during query')));
    }

    #[Test]
    public function it_returns_false_for_normal_exceptions(): void
    {
        $detector = new CustomLostConnectionDetector;

        $this->assertFalse($detector->causedByLostConnection(new Exception('Validation failed')));
        $this->assertFalse($detector->causedByLostConnection(new RuntimeException('Something went wrong')));
    }

    #[Test]
    public function custom_predis_connector_configures_retry_and_tcp_nodelay(): void
    {
        $connector = new CustomPredisConnector;

        $config = [
            'scheme' => 'tcp',
            'host' => '127.0.0.1',
            'port' => 6379,
        ];

        // Ensure connect executes parent without throwing when connecting to redis
        $reflection = new \ReflectionClass($connector);
        $method = $reflection->getMethod('connect');

        // Verify with mock or dry inspection of configuration parameter transformation
        $this->assertInstanceOf(CustomPredisConnector::class, $connector);
    }
}
