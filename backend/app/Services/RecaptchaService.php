<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RecaptchaService
{
    /**
     * Verify the reCAPTCHA token with Google.
     */
    public function verify(?string $token, ?string $ip = null, ?string $expectedAction = null): bool
    {
        // 🟢 التعديل: السماح بالتسجيل بدون توكن في البيئة المحلية لتسهيل التطوير
        if (empty($token)) {
            return app()->environment('local');
        }

        $secret = config('services.recaptcha.secret') ?: env('RECAPTCHA_SECRET_KEY');

        if (empty($secret)) {
            Log::warning('reCAPTCHA secret key is not configured.');

            return app()->environment('local');
        }

        try {
            $response = Http::timeout(10)->asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => $secret,
                'response' => $token,
                'remoteip' => $ip,
            ]);

            $result = $response->json();

            $isSuccessful = isset($result['success']) && $result['success'] === true && isset($result['score']) && $result['score'] >= 0.5;

            if (! $isSuccessful) {
                return false;
            }

            if ($expectedAction !== null) {
                $returnedAction = $result['action'] ?? null;
                if ($returnedAction !== $expectedAction) {
                    Log::warning("reCAPTCHA action mismatch: expected '{$expectedAction}', got '{$returnedAction}'");

                    return false;
                }
            }

            return true;
        } catch (\Exception $e) {
            Log::error('reCAPTCHA verification failed: '.$e->getMessage());

            return false;
        }
    }
}
