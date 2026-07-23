<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Video Upload Configuration
    |--------------------------------------------------------------------------
    |
    | This configuration controls video upload behavior including drivers,
    | file size limits, and chunked upload settings.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Primary Upload Driver
    |--------------------------------------------------------------------------
    |
    | The primary driver to use for video uploads. This should be 'r2' for
    | Cloudflare R2 or another configured filesystem disk.
    |
    */

    'primary_driver' => env('VIDEO_UPLOAD_PRIMARY_DRIVER', 'r2'),

    /*
    |--------------------------------------------------------------------------
    | Fallback Upload Driver
    |--------------------------------------------------------------------------
    |
    | The fallback driver to use when the primary driver fails. This should
    | typically be a local storage driver.
    |
    */

    'fallback_driver' => env('VIDEO_UPLOAD_FALLBACK_DRIVER', 'videos'),

    /*
    |--------------------------------------------------------------------------
    | Maximum File Size
    |--------------------------------------------------------------------------
    |
    | The maximum file size allowed for video uploads in bytes.
    | Default: 104857600 (100MB)
    |
    */

    'max_size' => env('VIDEO_UPLOAD_MAX_SIZE', 104857600),

    /*
    |--------------------------------------------------------------------------
    | Chunk Size
    |--------------------------------------------------------------------------
    |
    | The size of each chunk for chunked uploads in bytes.
    | Default: 1048576 (1MB)
    |
    */

    'chunk_size' => env('VIDEO_CHUNK_SIZE', 1048576),

    /*
    |--------------------------------------------------------------------------
    | Multipart Upload Threshold
    |--------------------------------------------------------------------------
    |
    | File size threshold above which to use multipart uploads directly to
    | external storage (S3/R2) instead of local assembly. Default: 5MB
    |
    */

    'multipart_threshold' => env('VIDEO_MULTIPART_THRESHOLD', 5242880),

    /*
    |--------------------------------------------------------------------------
    | Allowed MIME Types
    |--------------------------------------------------------------------------
    |
    | The MIME types allowed for video uploads.
    |
    */

    'allowed_mime_types' => [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo',
        'video/webm',
        'video/x-flv',
        'video/3gpp',
        'video/x-ms-wmv'
    ],

    /*
    |--------------------------------------------------------------------------
    | Upload Folders
    |--------------------------------------------------------------------------
    |
    | Default folders for different types of video uploads.
    |
    */

    'folders' => [
        'properties' => 'properties/videos',
        'temp' => 'temp/videos',
    ],

    /*
    |--------------------------------------------------------------------------
    | Cleanup Settings
    |--------------------------------------------------------------------------
    |
    | Settings for cleaning up temporary files and failed uploads.
    |
    */

    'cleanup' => [
        'temp_file_ttl' => 3600, // 1 hour
        'failed_upload_ttl' => 86400, // 24 hours
    ],

];