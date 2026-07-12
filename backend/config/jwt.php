<?php

return [

    // Empty JWT_SECRET= in .env must fall back to APP_KEY (env() default does not apply).
    'secret' => env('JWT_SECRET') ?: env('APP_KEY'),

    'ttl' => (int) env('JWT_TTL', 7200),

    'algorithm' => 'HS256',

];
