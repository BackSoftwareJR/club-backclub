<?php

return [

    'secret' => env('JWT_SECRET', env('APP_KEY')),

    'ttl' => (int) env('JWT_TTL', 7200),

    'algorithm' => 'HS256',

];
