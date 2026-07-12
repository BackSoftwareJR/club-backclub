<?php

return [

    'paths' => (static function (): array {
        $prefix = env('API_ROUTE_PREFIX');
        if ($prefix === null && ! isset($_ENV['API_ROUTE_PREFIX']) && ! isset($_SERVER['API_ROUTE_PREFIX'])) {
            $prefix = 'api';
        } else {
            $prefix = (string) ($prefix ?? '');
        }

        if ($prefix === '') {
            return ['entry/*', 'auth/*', 'clubs/*', 'up'];
        }

        return [trim($prefix, '/').'/*'];
    })(),

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173'))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
