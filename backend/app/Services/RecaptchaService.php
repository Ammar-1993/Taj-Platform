<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RecaptchaService
{
    /**
     * Verify the reCAPTCHA token with Google.
     *
     * @param string|null $token
     * @param string|null $ip
     * @return bool
     */
    public function verify(?string $token, ?string $ip = null): bool
    {
        // 🟢 التعديل: السماح بالتسجيل بدون توكن في البيئة المحلية لتسهيل التطوير
        if (empty($token)) {
            return app()->environment('local');
        }

        $secret = config('services.recaptcha.secret') ?: env('RECAPTCHA_SECRET_KEY');

        if (empty($secret)) {
            Log::warning('reCAPTCHA secret key is not configured.');
            // If not configured, we might want to allow in dev, but for this task we assume it should be there.
            // Return true for local development if needed, but let's be strict.
            return app()->environment('local'); 
        }

        try {
            $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => $secret,
                'response' => $token,
                'remoteip' => $ip,
            ]);

            $result = $response->json();

            return isset($result['success']) && $result['success'] === true && isset($result['score']) && $result['score'] >= 0.5;
        } catch (\Exception $e) {
            Log::error('reCAPTCHA verification failed: ' . $e->getMessage());
            return false;
        }
    }
}
