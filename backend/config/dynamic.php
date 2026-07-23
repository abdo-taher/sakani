<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Dynamic Environment Configuration
    |--------------------------------------------------------------------------
    | This configuration automatically detects the current environment
    | and sets appropriate URLs and settings dynamically.
    */

    'auto_detect_urls' => env('AUTO_DETECT_URLS', true),
    
    'environments' => [
        'local' => [
            'frontend_url' => 'http://localhost:3000',
            'api_url' => 'http://localhost:8000',
            'domains' => ['localhost', '127.0.0.1'],
        ],
        'staging' => [
            'frontend_url' => 'https://staging.sakani.site',
            'api_url' => 'https://api-staging.sakani.site',
            'domains' => ['staging.sakani.site'],
        ],
        'production' => [
            'frontend_url' => 'https://sakani.site',
            'api_url' => 'https://api.sakani.site',
            'domains' => ['sakani.site', 'www.sakani.site'],
        ],
    ],

    'fallback_urls' => [
        'frontend' => env('APP_URL', 'https://sakani.site'),
        'api' => env('APP_URL', 'https://api.sakani.site'),
    ],
];