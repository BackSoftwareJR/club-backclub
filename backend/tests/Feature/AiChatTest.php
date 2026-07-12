<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\InteractsWithClubApi;
use Tests\TestCase;

class AiChatTest extends TestCase
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

    public function test_sommelier_message_returned_when_api_key_set(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();

        Config::set('canopywave.api_key', 'test-canopywave-key');

        Http::fake([
            self::CANOPYWAVE_URL => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'Pair this with a quiet evening and dim amber lighting.',
                        ],
                    ],
                ],
            ]),
        ]);

        $response = $this->withBearer($token)->postJson("/api/clubs/{$clubId}/ai/chat", [
            'message' => 'What pairs well tonight?',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Pair this with a quiet evening and dim amber lighting.')
            ->assertJsonPath('persona', 'sommelier');

        Http::assertSent(function ($request) {
            $body = $request->data();
            $messages = $body['messages'] ?? [];

            return $request->url() === self::CANOPYWAVE_URL
                && $request->hasHeader('Authorization', 'Bearer test-canopywave-key')
                && ($body['model'] ?? null) === 'moonshotai/kimi-k2.6'
                && ($body['temperature'] ?? null) === 0.6
                && is_array($messages)
                && count($messages) >= 3
                && str_contains((string) ($messages[1]['content'] ?? ''), 'Club tone:')
                && ($messages[2]['role'] ?? null) === 'user';
        });
    }

    public function test_sommelier_uses_product_context_when_product_id_provided(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();

        Config::set('canopywave.api_key', 'test-canopywave-key');

        Http::fake([
            self::CANOPYWAVE_URL => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'Savor one gram slowly with a single malt.',
                        ],
                    ],
                ],
            ]),
        ]);

        $product = Product::query()
            ->where('club_id', $clubId)
            ->where('selling_mode', 'weight')
            ->firstOrFail();

        $response = $this->withBearer($token)->postJson("/api/clubs/{$clubId}/ai/chat", [
            'message' => 'How should I enjoy this?',
            'product_id' => $product->id,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Savor one gram slowly with a single malt.')
            ->assertJsonPath('persona', 'sommelier');

        Http::assertSent(function ($request) use ($product) {
            $messages = $request->data()['messages'] ?? [];

            return str_contains((string) ($messages[0]['content'] ?? ''), $product->name);
        });
    }

    public function test_silent_fallback_when_api_key_empty(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();

        Config::set('canopywave.api_key', '');

        Http::fake();

        $response = $this->withBearer($token)->postJson("/api/clubs/{$clubId}/ai/chat", [
            'message' => 'Recommend something refined.',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', '')
            ->assertJsonPath('persona', 'sommelier');

        Http::assertNothingSent();
    }

    public function test_silent_fallback_when_http_request_fails(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();

        Config::set('canopywave.api_key', 'test-canopywave-key');

        Http::fake([
            self::CANOPYWAVE_URL => Http::response('Service unavailable', 503),
        ]);

        $response = $this->withBearer($token)->postJson("/api/clubs/{$clubId}/ai/chat", [
            'message' => 'What should I try?',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', '')
            ->assertJsonPath('persona', 'sommelier');
    }

    public function test_silent_fallback_when_response_content_empty(): void
    {
        $this->seedClub();
        $token = $this->ownerToken();
        $clubId = $this->clubId();

        Config::set('canopywave.api_key', 'test-canopywave-key');

        Http::fake([
            self::CANOPYWAVE_URL => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => '   ',
                        ],
                    ],
                ],
            ]),
        ]);

        $response = $this->withBearer($token)->postJson("/api/clubs/{$clubId}/ai/chat", [
            'message' => 'Any suggestions?',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', '')
            ->assertJsonPath('persona', 'sommelier');
    }
}
