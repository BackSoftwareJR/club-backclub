<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use App\Models\UserWallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\InteractsWithClubApi;
use Tests\TestCase;

class AiInterveneTest extends TestCase
{
    use InteractsWithClubApi;
    use RefreshDatabase;

    private const CANOPYWAVE_URL = 'https://inference.canopywave.io/v1/chat/completions';

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('canopywave.enabled', true);
        Config::set('canopywave.base_url', 'https://inference.canopywave.io/v1');
        Config::set('canopywave.model', 'moonshotai/kimi-k2.6');
        Config::set('canopywave.temperature', 0.6);
        Config::set('canopywave.timeout', 3);
        Config::set('canopywave.max_tokens', 512);
    }

    public function test_coach_message_returned_when_weekly_spend_exceeds_threshold(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();

        $this->seedWeeklySpendAboveThreshold($clubId);

        Config::set('canopywave.api_key', 'test-canopywave-key');

        Http::fake([
            self::CANOPYWAVE_URL => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'Are you sure? This purchase pushes your weekly total even higher.',
                        ],
                    ],
                ],
            ]),
        ]);

        $product = Product::query()
            ->where('club_id', $clubId)
            ->where('selling_mode', 'unit')
            ->firstOrFail();

        $response = $this->withBearer($token)->postJson("/api/clubs/{$clubId}/ai/intervene", [
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $response->assertOk()
            ->assertJsonPath('intervention_required', true)
            ->assertJsonPath('message', 'Are you sure? This purchase pushes your weekly total even higher.')
            ->assertJsonPath('persona', 'coach');

        Http::assertSent(function ($request) {
            $body = $request->data();
            $messages = $body['messages'] ?? [];

            return $request->url() === self::CANOPYWAVE_URL
                && $request->hasHeader('Authorization', 'Bearer test-canopywave-key')
                && ($body['model'] ?? null) === 'moonshotai/kimi-k2.6'
                && ($body['temperature'] ?? null) === 0.6
                && ($body['max_tokens'] ?? null) === 512
                && is_array($messages)
                && count($messages) >= 3
                && ($messages[0]['role'] ?? null) === 'system'
                && ($messages[2]['role'] ?? null) === 'user';
        });
    }

    public function test_silent_fallback_when_api_key_empty(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();

        $this->seedWeeklySpendAboveThreshold($clubId);

        Config::set('canopywave.api_key', '');

        Http::fake();

        $product = Product::query()
            ->where('club_id', $clubId)
            ->where('selling_mode', 'unit')
            ->firstOrFail();

        $response = $this->withBearer($token)->postJson("/api/clubs/{$clubId}/ai/intervene", [
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $response->assertOk()
            ->assertJsonPath('intervention_required', false);

        Http::assertNothingSent();
    }

    public function test_silent_fallback_when_http_request_fails(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();

        $this->seedWeeklySpendAboveThreshold($clubId);

        Config::set('canopywave.api_key', 'test-canopywave-key');

        Http::fake([
            self::CANOPYWAVE_URL => Http::response('Service unavailable', 503),
        ]);

        $product = Product::query()
            ->where('club_id', $clubId)
            ->where('selling_mode', 'unit')
            ->firstOrFail();

        $response = $this->withBearer($token)->postJson("/api/clubs/{$clubId}/ai/intervene", [
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $response->assertOk()
            ->assertJsonPath('intervention_required', false);
    }

    public function test_silent_fallback_when_response_content_empty(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();

        $this->seedWeeklySpendAboveThreshold($clubId);

        Config::set('canopywave.api_key', 'test-canopywave-key');

        Http::fake([
            self::CANOPYWAVE_URL => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => '',
                        ],
                    ],
                ],
            ]),
        ]);

        $product = Product::query()
            ->where('club_id', $clubId)
            ->where('selling_mode', 'unit')
            ->firstOrFail();

        $response = $this->withBearer($token)->postJson("/api/clubs/{$clubId}/ai/intervene", [
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $response->assertOk()
            ->assertJsonPath('intervention_required', false);
    }

    public function test_no_intervention_when_weekly_spend_below_threshold(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();

        Config::set('canopywave.api_key', 'test-canopywave-key');

        Http::fake();

        $product = Product::query()
            ->where('club_id', $clubId)
            ->where('selling_mode', 'unit')
            ->firstOrFail();

        $response = $this->withBearer($token)->postJson("/api/clubs/{$clubId}/ai/intervene", [
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $response->assertOk()
            ->assertJsonPath('intervention_required', false);

        Http::assertNothingSent();
    }

    private function seedWeeklySpendAboveThreshold(int $clubId): void
    {
        $wallet = UserWallet::query()
            ->where('club_id', $clubId)
            ->whereHas('user', fn ($query) => $query->where('email', 'owner@velvet.club'))
            ->firstOrFail();

        $product = Product::query()
            ->where('club_id', $clubId)
            ->firstOrFail();

        WalletTransaction::query()->create([
            'wallet_id' => $wallet->id,
            'product_id' => $product->id,
            'amount_deducted' => '20.00',
            'metadata' => [
                'quantity' => 1,
                'unit_label' => 'pack',
            ],
            'created_at' => now()->subDays(2),
        ]);

        WalletTransaction::query()->create([
            'wallet_id' => $wallet->id,
            'product_id' => $product->id,
            'amount_deducted' => '15.00',
            'metadata' => [
                'quantity' => 1,
                'unit_label' => 'pack',
            ],
            'created_at' => now()->subDay(),
        ]);
    }
}
