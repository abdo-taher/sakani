<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CloudinaryController extends Controller
{
    public function signature(Request $request)
    {
        $apiSecret = config('cloudinary.api_secret');
        $cloudName = config('cloudinary.cloud_name');
        $apiKey    = config('cloudinary.api_key');

        if (empty($cloudName) || empty($apiKey) || empty($apiSecret)) {
            return response()->json([
                'message' => 'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.',
            ], 503);
        }

        $timestamp = time();
        $folder    = $request->folder;

        $signature = sha1(
            "folder={$folder}&timestamp={$timestamp}" . $apiSecret
        );

        return response()->json([
            'timestamp'  => $timestamp,
            'signature'  => $signature,
            'cloud_name' => $cloudName,
            'api_key'    => $apiKey,
        ]);
    }
}