<?php

namespace App\Support;

use Illuminate\Redis\Connections\PredisConnection;
use Illuminate\Redis\Connectors\PredisConnector;
use Predis\Retry\Retry;
use Predis\Retry\Strategy\EqualBackoff;

class CustomPredisConnector extends PredisConnector
{
    /**
     * Create a new connection with built-in auto-retry and optimized socket parameters.
     *
     * @return PredisConnection
     */
    public function connect(array $config, array $options)
    {
        if (class_exists(Retry::class)) {
            $config['retry'] = new Retry(new EqualBackoff(150), 3);
        }

        $config['tcp_nodelay'] = true;

        return parent::connect($config, $options);
    }
}
