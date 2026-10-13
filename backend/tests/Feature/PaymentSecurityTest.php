<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PaymentSecurityTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'test-webhook-secret';

    private const URL = '/api/v1/webhooks/payment';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.moyasar.webhook_secret' => self::SECRET,
            'services.moyasar.secret_key' => 'sk_test_dummy',
        ]);
    }

    private function balance(User $user): float
    {
        return (float) (Wallet::where('user_id', $user->id)->value('balance') ?? 0);
    }

    /** يحاكي ردود ميسر: دفعة + فاتورة مرتبطة */
    private function fakeMoyasar(User $user, array $payment = [], array $invoice = []): void
    {
        $paymentBody = array_merge([
            'id' => 'pay_1',
            'status' => 'paid',
            'amount' => 5000,
            'currency' => 'SAR',
            'invoice_id' => 'inv_1',
            'metadata' => null,
        ], $payment);

        $invoiceBody = array_merge([
            'id' => 'inv_1',
            'status' => 'paid',
            'amount' => 5000,
            'currency' => 'SAR',
            'metadata' => ['user_id' => $user->id, 'type' => 'wallet_topup'],
            'payments' => [['id' => 'pay_1', 'status' => 'paid']],
        ], $invoice);

        Http::fake([
            'api.moyasar.com/v1/payments/pay_1' => Http::response($paymentBody),
            'api.moyasar.com/v1/invoices/inv_1' => Http::response($invoiceBody),
            'api.moyasar.com/*' => Http::response(['message' => 'not found'], 404),
        ]);
    }

    /** إرسال Webhook موقّع بـ HMAC على الجسم الخام */
    private function postSignedWebhook(array $payload, ?string $secret = self::SECRET)
    {
        $raw = json_encode($payload);
        $server = ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'];

        if ($secret !== null) {
            $server['HTTP_X_MOYASAR_SIGNATURE'] = hash_hmac('sha256', $raw, $secret);
        }

        return $this->call('POST', self::URL, [], [], [], $server, $raw);
    }

    private function payload(array $data = []): array
    {
        return ['type' => 'payment_paid', 'data' => array_merge(['id' => 'pay_1', 'status' => 'paid', 'amount' => 99999999], $data)];
    }

    #[Test]
    public function webhook_is_rejected_when_secret_is_not_configured(): void
    {
        config(['services.moyasar.webhook_secret' => null]);
        $user = User::factory()->create();
        $this->fakeMoyasar($user);

        $this->postSignedWebhook($this->payload(), 'anything')->assertStatus(503);

        $this->assertSame(0.0, $this->balance($user));
    }

    #[Test]
    public function webhook_is_rejected_without_signature_or_secret_token(): void
    {
        $user = User::factory()->create();
        $this->fakeMoyasar($user);

        $this->postSignedWebhook($this->payload(), null)->assertStatus(401);

        $this->assertSame(0.0, $this->balance($user));
        Http::assertNothingSent();
    }

    #[Test]
    public function webhook_is_rejected_with_wrong_signature_and_wrong_secret_token(): void
    {
        $user = User::factory()->create();
        $this->fakeMoyasar($user);

        $this->postSignedWebhook($this->payload(), 'wrong-secret')->assertStatus(401);

        $payload = $this->payload();
        $payload['secret_token'] = 'wrong-token';
        $this->postJson(self::URL, $payload)->assertStatus(401);

        $this->assertSame(0.0, $this->balance($user));
    }

    #[Test]
    public function valid_hmac_webhook_credits_the_amount_confirmed_by_moyasar_not_the_payload(): void
    {
        $user = User::factory()->create();
        $this->fakeMoyasar($user);

        // الـ payload يدّعي مبلغاً ضخماً، لكن المعتمد هو 5000 هللة = 50 ريال من ميسر
        $this->postSignedWebhook($this->payload())->assertOk();

        $this->assertSame(50.0, $this->balance($user));
        $this->assertDatabaseHas('wallet_transactions', [
            'type' => 'deposit',
            'provider_reference' => 'moyasar:invoice:inv_1',
        ]);
    }

    #[Test]
    public function webhook_with_moyasar_body_secret_token_is_accepted(): void
    {
        $user = User::factory()->create();
        $this->fakeMoyasar($user);

        $payload = $this->payload();
        $payload['secret_token'] = self::SECRET;

        $this->postJson(self::URL, $payload)->assertOk();

        $this->assertSame(50.0, $this->balance($user));
    }

    #[Test]
    public function replayed_webhook_credits_only_once(): void
    {
        $user = User::factory()->create();
        $this->fakeMoyasar($user);

        $this->postSignedWebhook($this->payload())->assertOk();
        $this->postSignedWebhook($this->payload())->assertOk();
        $this->postSignedWebhook($this->payload())->assertOk();

        $this->assertSame(50.0, $this->balance($user));
        $this->assertSame(1, WalletTransaction::where('provider_reference', 'moyasar:invoice:inv_1')->count());
    }

    #[Test]
    public function webhook_followed_by_manual_verification_credits_only_once(): void
    {
        $user = User::factory()->create();
        $this->fakeMoyasar($user);

        $this->postSignedWebhook($this->payload())->assertOk();

        Sanctum::actingAs($user);
        $this->postJson('/api/v1/payments/verify', ['id' => 'pay_1'])
            ->assertOk()
            ->assertJsonPath('status', 'success');

        $this->assertSame(50.0, $this->balance($user));
        $this->assertSame(1, WalletTransaction::where('type', 'deposit')->count());
    }

    #[Test]
    public function manual_verification_followed_by_webhook_credits_only_once(): void
    {
        $user = User::factory()->create();
        $this->fakeMoyasar($user);

        Sanctum::actingAs($user);
        $this->postJson('/api/v1/payments/verify', ['id' => 'pay_1'])->assertOk();
        $this->postJson('/api/v1/payments/verify', ['id' => 'pay_1'])->assertOk();

        $this->postSignedWebhook($this->payload())->assertOk();

        $this->assertSame(50.0, $this->balance($user));
    }

    #[Test]
    public function manual_verification_by_invoice_id_and_webhook_credit_only_once(): void
    {
        $user = User::factory()->create();
        $this->fakeMoyasar($user);
        // المعرّف المُرسَل هو معرّف الفاتورة (لا توجد دفعة بهذا المعرّف في ميسر → ينتقل لمسار الفاتورة)

        Sanctum::actingAs($user);
        $this->postJson('/api/v1/payments/verify', ['id' => 'inv_1'])->assertOk()->assertJsonPath('status', 'success');

        $this->postSignedWebhook($this->payload())->assertOk();

        $this->assertSame(50.0, $this->balance($user));
    }

    #[Test]
    public function payment_already_credited_by_legacy_description_is_not_credited_again(): void
    {
        $user = User::factory()->create();
        app(WalletService::class)->processTransaction($user, 50.0, 'deposit', 'شحن المحفظة عبر ميسر - عملية رقم: pay_1');
        $this->fakeMoyasar($user);

        $this->postSignedWebhook($this->payload())->assertOk();

        $this->assertSame(50.0, $this->balance($user));
    }

    #[Test]
    public function webhook_rejects_non_sar_currency_and_unpaid_status(): void
    {
        $user = User::factory()->create();

        $this->fakeMoyasar($user, ['currency' => 'USD']);
        $this->postSignedWebhook($this->payload())->assertStatus(400);

        $this->fakeMoyasar($user, ['status' => 'failed']);
        $this->postSignedWebhook($this->payload())->assertStatus(400);

        $this->assertSame(0.0, $this->balance($user));
    }

    #[Test]
    public function webhook_rejects_metadata_that_is_not_a_wallet_topup(): void
    {
        $user = User::factory()->create();
        $this->fakeMoyasar($user, [], ['metadata' => ['user_id' => $user->id, 'type' => 'other']]);

        $this->postSignedWebhook($this->payload())->assertStatus(400);

        $this->assertSame(0.0, $this->balance($user));
    }

    #[Test]
    public function webhook_returns_503_so_moyasar_retries_when_moyasar_api_is_down(): void
    {
        $user = User::factory()->create();
        Http::fake(['api.moyasar.com/*' => Http::response([], 500)]);

        $this->postSignedWebhook($this->payload())->assertStatus(503);

        $this->assertSame(0.0, $this->balance($user));
    }

    #[Test]
    public function manual_verification_does_not_credit_a_payment_owned_by_another_user(): void
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();
        $this->fakeMoyasar($owner);

        Sanctum::actingAs($attacker);
        $this->postJson('/api/v1/payments/verify', ['id' => 'pay_1'])->assertJsonPath('status', 'pending');

        $this->assertSame(0.0, $this->balance($attacker));
        $this->assertSame(0.0, $this->balance($owner));
    }

    #[Test]
    public function deposit_once_is_idempotent_per_provider_reference(): void
    {
        $user = User::factory()->create();
        $wallets = app(WalletService::class);

        $this->assertNotNull($wallets->depositOnce($user, 20.0, 'first', 'ref-1'));
        $this->assertNull($wallets->depositOnce($user, 20.0, 'again', 'ref-1'));
        $this->assertNotNull($wallets->depositOnce($user, 5.0, 'other', 'ref-2'));

        $this->assertSame(25.0, $this->balance($user));
    }

    #[Test]
    public function payment_create_accepts_valid_two_decimal_amount_and_normalizes_halalas(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        Http::fake([
            'api.moyasar.com/v1/invoices' => Http::response([
                'id' => 'inv_test_123',
                'url' => 'https://moyasar.com/checkout/123',
                'status' => 'initiated',
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/payments/create', ['amount' => 10.50]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.payment_id', 'inv_test_123')
            ->assertJsonPath('data.amount', 10.5);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://api.moyasar.com/v1/invoices'
                && $request['amount'] === 1050; // 10.50 SAR = 1050 halalas
        });
    }

    #[Test]
    public function payment_create_rejects_sub_halalas_decimal_precision(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/payments/create', ['amount' => 10.001]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);
    }

    #[Test]
    public function payment_create_sanitizes_gateway_error_and_does_not_leak_raw_details(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        Http::fake([
            'api.moyasar.com/v1/invoices' => Http::response([
                'type' => 'invalid_request_error',
                'message' => 'Internal sensitive merchant error with secret details',
            ], 400),
        ]);

        $response = $this->postJson('/api/v1/payments/create', ['amount' => 50.00]);

        $response->assertStatus(400)
            ->assertJsonMissing(['moyasar_error_details'])
            ->assertJsonPath('error', 'تعذر إنشاء جلسة الدفع لدى مزود الخدمة، يُرجى المحاولة لاحقاً.');
    }
}
