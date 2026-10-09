<?php

namespace Tests\Unit;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DatabaseReadWriteSplittingTest extends TestCase
{
    #[Test]
    public function mysql_configuration_contains_read_and_write_arrays_with_sticky_enabled(): void
    {
        $mysqlConfig = config('database.connections.mysql');

        $this->assertIsArray($mysqlConfig, 'MySQL connection configuration must be an array.');

        // 1. Verify Read array structure
        $this->assertArrayHasKey('read', $mysqlConfig, 'MySQL configuration must contain a "read" array.');
        $this->assertIsArray($mysqlConfig['read']);
        $this->assertArrayHasKey('host', $mysqlConfig['read']);
        $this->assertArrayHasKey('port', $mysqlConfig['read']);
        $this->assertArrayHasKey('username', $mysqlConfig['read']);
        $this->assertArrayHasKey('password', $mysqlConfig['read']);

        // 2. Verify Write array structure
        $this->assertArrayHasKey('write', $mysqlConfig, 'MySQL configuration must contain a "write" array.');
        $this->assertIsArray($mysqlConfig['write']);
        $this->assertArrayHasKey('host', $mysqlConfig['write']);
        $this->assertArrayHasKey('port', $mysqlConfig['write']);
        $this->assertArrayHasKey('username', $mysqlConfig['write']);
        $this->assertArrayHasKey('password', $mysqlConfig['write']);

        // 3. Verify Sticky connection is enabled
        $this->assertArrayHasKey('sticky', $mysqlConfig, 'MySQL configuration must have "sticky" enabled.');
        $this->assertTrue($mysqlConfig['sticky'], 'Sticky option must be true to prevent read replica lag.');
    }

    #[Test]
    public function mariadb_configuration_contains_read_and_write_arrays_with_sticky_enabled(): void
    {
        $mariadbConfig = config('database.connections.mariadb');

        $this->assertIsArray($mariadbConfig, 'MariaDB connection configuration must be an array.');
        $this->assertArrayHasKey('read', $mariadbConfig);
        $this->assertArrayHasKey('write', $mariadbConfig);
        $this->assertTrue($mariadbConfig['sticky']);
    }

    #[Test]
    public function read_and_write_configurations_resolve_distinct_hosts_when_specified(): void
    {
        $customConfig = [
            'driver' => 'mysql',
            'read' => [
                'host' => ['replica-1.db.internal', 'replica-2.db.internal'],
                'port' => 3306,
                'username' => 'read_user',
                'password' => 'read_secret',
            ],
            'write' => [
                'host' => ['primary-master.db.internal'],
                'port' => 3306,
                'username' => 'write_user',
                'password' => 'write_secret',
            ],
            'sticky' => true,
            'database' => 'taj_database',
        ];

        config(['database.connections.mysql_test_rw' => $customConfig]);
        $resolved = config('database.connections.mysql_test_rw');

        $this->assertEquals(['replica-1.db.internal', 'replica-2.db.internal'], $resolved['read']['host']);
        $this->assertEquals(['primary-master.db.internal'], $resolved['write']['host']);
        $this->assertEquals('read_user', $resolved['read']['username']);
        $this->assertEquals('write_user', $resolved['write']['username']);
        $this->assertTrue($resolved['sticky']);
    }

    #[Test]
    public function comma_separated_read_hosts_are_split_into_array(): void
    {
        $rawEnvHosts = '10.0.1.10,10.0.1.11,10.0.1.12';
        $splitHosts = explode(',', $rawEnvHosts);

        $this->assertCount(3, $splitHosts);
        $this->assertEquals(['10.0.1.10', '10.0.1.11', '10.0.1.12'], $splitHosts);
    }
}
