<?php

return [

    'paths' => (static function (): array {
        $prefix = env('API_ROUTE_PREFIX', 'api');

        if ($prefix === '' || $prefix === null) {
            return ['entry/*', 'auth/*', 'clubs/*', 'up'];
        }

        return [trim((string) $prefix, '/').'/*'];
    })(),

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173'))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
