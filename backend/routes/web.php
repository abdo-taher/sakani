<?php

use Illuminate\Support\Facades\Route;

// Serve the React frontend for all non-API routes (if index.html exists)
Route::get('/{any}', function () {
    $path = public_path('index.html');

    if (file_exists($path)) {
        return response()->file($path);
    }

    return response()->json([
        'message' => 'Sakani API is running.',
        'docs'    => url('/api'),
    ], 200);
})->where('any', '^(?!api).*$');
