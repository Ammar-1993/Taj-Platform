<?php

namespace App\Support;

use Illuminate\Contracts\Database\LostConnectionDetector as LostConnectionDetectorContract;
use Illuminate\Database\LostConnectionDetector;
use Illuminate\Support\Str;
use Predis\Connection\ConnectionException as PredisConnectionException;
use Throwable;

class CustomLostConnectionDetector implements LostConnectionDetectorContract
{
    protected LostConnectionDetector $baseDetector;

    public function __construct()
    {
        $this->baseDetector = new LostConnectionDetector;
    }

    /**
     * Determine if the given exception was caused by a lost connection.
     */
    public function causedByLostConnection(Throwable $e): bool
    {
        if ($this->baseDetector->causedByLostConnection($e)) {
            return true;
        }

        if ($e instanceof PredisConnectionException) {
            return true;
        }

        $message = $e->getMessage();

        return Str::contains($message, [
            'Stream is already at the end',
            'Connection closed',
            'Connection lost',
            'Error while reading line from the server',
            'Redis server went away',
            'Connection refused',
            'Failed to read from the socket',
            'Temporary failure in name resolution',
            'php_network_getaddresses',
            'Failed to connect to',
            'Network is unreachable',
        ], ignoreCase: true);
    }
}
