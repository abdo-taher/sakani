<?php

$firstFilledEnvironmentValue = static function (array $keys, mixed $default = null): mixed {
    foreach ($keys as $key) {
        $value = env($key);
        if ($value !== null && $value !== '') {
            return $value;
        }
    }

    return $default;
};

$r2AccountId = $firstFilledEnvironmentValue([
    'R2_ACCOUNT_ID',
    'CLOUDFLARE_R2_ACCOUNT_ID',
    'CLOUDFLARE_ACCOUNT_ID',
    'CF_ACCOUNT_ID',
]);

$r2Endpoint = $firstFilledEnvironmentValue(['R2_ENDPOINT', 'CLOUDFLARE_R2_ENDPOINT']);
if (!$r2Endpoint && $r2AccountId) {
    $r2Endpoint = 'https://' . $r2AccountId . '.r2.cloudflarestorage.com';
}

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    'media_disk' => env('MEDIA_DISK', 'r2'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

        'r2' => [
            'driver' => 's3',
            'key' => $firstFilledEnvironmentValue(['R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_ACCESS_KEY_ID']),
            'secret' => $firstFilledEnvironmentValue(['R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY']),
            'region' => $firstFilledEnvironmentValue(['R2_REGION', 'CLOUDFLARE_R2_REGION'], 'auto'),
            'bucket' => $firstFilledEnvironmentValue(['R2_BUCKET', 'CLOUDFLARE_R2_BUCKET'], 'sakani'),
            'endpoint' => $r2Endpoint,
            'url' => $firstFilledEnvironmentValue(
                ['R2_PUBLIC_URL', 'CLOUDFLARE_R2_PUBLIC_URL'],
                'https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev'
            ),
            'use_path_style_endpoint' => env('R2_USE_PATH_STYLE_ENDPOINT', true),
            'throw' => true,
            'report' => true,
        ],

        'videos' => [
            'driver' => 'local',
            'root' => storage_path('app/public/videos'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage/videos',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
