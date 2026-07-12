<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Canopywave Inference API (Kimi K2.6)
    |--------------------------------------------------------------------------
    |
    | OpenAI-compatible endpoint used by Canopywave for both monthly subscription
    | plans (Unlimited Token / Coding Plan) and pay-as-you-go serverless keys.
    | Club CRM expects a monthly subscription API key in CANOPYWAVE_API_KEY.
    |
    | When api_key is empty or enabled is false, AI endpoints silently fallback
    | without calling Canopywave (see CanopywaveClient).
    |
    */

    'base_url' => env('CANOPYWAVE_BASE_URL', 'https://inference.canopywave.io/v1'),

    'api_key' => env('CANOPYWAVE_API_KEY'),

    // Canopywave model ID for Kimi K2.6 (spec shorthand: kimi-2.6)
    'model' => env('CANOPYWAVE_MODEL', 'moonshotai/kimi-k2.6'),

    'temperature' => (float) env('CANOPYWAVE_TEMPERATURE', 0.6),

    'timeout' => (int) env('CANOPYWAVE_TIMEOUT', 3),

    'max_tokens' => (int) env('CANOPYWAVE_MAX_TOKENS', 512),

    'enabled' => (bool) env('CANOPYWAVE_ENABLED', true),

];
