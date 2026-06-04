<?php

return [

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        'broadcasting/auth',
        '/login',
        '/register',
        '/logout',
        '/user',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:3000'),
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:4321',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
    ],

    // ✅ Allow any local network IP (192.168.x.x or 10.x.x.x)
    'allowed_origins_patterns' => [
        '/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/',  // 192.168.x.x
        '/^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/', // 10.x.x.x
        '/^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/', // 172.16-31.x.x
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
