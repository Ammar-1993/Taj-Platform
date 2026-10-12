<?php

namespace Tests\Feature\Auth;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class LoginRouteResilienceTest extends TestCase
{
    #[Test]
    public function unauthenticated_api_request_without_json_header_returns_401_json_not_500(): void
    {
        // Simulate a browser navigation or crawler request without 'Accept: application/json'
        $response = $this->get('/api/v1/auth/me', [
            'Accept' => 'text/html,application/xhtml+xml',
        ]);

        $response->assertStatus(401);
        $response->assertJson([
            'message' => 'Unauthenticated.',
        ]);
    }

    #[Test]
    public function named_login_route_exists_and_redirects_to_frontend(): void
    {
        $this->assertNotEmpty(route('login'));

        $response = $this->get(route('login'));

        $response->assertRedirect(env('FRONTEND_URL', 'https://www.taj-edu.online').'/login');
    }

    #[Test]
    public function unauthenticated_protected_api_route_never_throws_route_not_found(): void
    {
        $response = $this->get('/api/v1/wallet');

        $response->assertStatus(401);
        $response->assertJson([
            'message' => 'Unauthenticated.',
        ]);
    }
}
