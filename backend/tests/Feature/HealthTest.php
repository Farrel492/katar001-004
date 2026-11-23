<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthTest extends TestCase
{
    /**
     * Test health check endpoint returns success when database is reachable.
     */
    public function test_health_check_returns_ok_status(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'app_name',
                'server_time',
                'database',
            ])
            ->assertJson([
                'status' => 'ok',
                'database' => 'ok',
            ]);
    }
}

