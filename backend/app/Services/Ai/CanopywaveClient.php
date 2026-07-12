<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CanopywaveClient
{
    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     */
    public function chat(array $messages): ?string
    {
        if (! config('canopywave.enabled') || empty(config('canopywave.api_key'))) {
            return null;
        }

        $baseUrl = rtrim((string) config('canopywave.base_url'), '/');
        $url = $baseUrl.'/chat/completions';

        try {
            $response = Http::timeout(config('canopywave.timeout', 3))
                ->withToken((string) config('canopywave.api_key'))
                ->acceptJson()
                ->post($url, [
                    'model' => config('canopywave.model'),
                    'temperature' => config('canopywave.temperature'),
                    'max_tokens' => config('canopywave.max_tokens'),
                    'messages' => $messages,
                ]);

            if (! $response->successful()) {
                Log::warning('[Canopywave] Request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $content = $response->json('choices.0.message.content');

            if (! is_string($content) || trim($content) === '') {
                Log::warning('[Canopywave] Empty or missing response content', [
                    'body' => $response->json(),
                ]);

                return null;
            }

            return trim($content);
        } catch (\Throwable $exception) {
            Log::warning('[Canopywave] Request exception', [
                'message' => $exception->getMessage(),
            ]);

            return null;
        }
    }
}
