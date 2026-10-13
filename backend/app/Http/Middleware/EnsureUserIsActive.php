<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * Handle an incoming request.
     * Ensures that authenticated users have an active account status.
     * If inactive, immediately revokes the token and aborts with 403.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ($user->is_active !== null && ! (bool) $user->is_active)) {
            // Revoke current token immediately so this session cannot be reused
            if (method_exists($user, 'currentAccessToken') && $user->currentAccessToken()) {
                $token = $user->currentAccessToken();
                if (method_exists($token, 'delete')) {
                    $token->delete();
                }
            }

            return response()->json([
                'status' => 'error',
                'message' => 'تم إيقاف حسابك مؤقتاً. يرجى التواصل مع فريق الدعم.',
            ], 403);
        }

        return $next($request);
    }
}
