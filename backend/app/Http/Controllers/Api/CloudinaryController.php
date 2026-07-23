<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CloudinaryController extends Controller
{
 public function signature(Request $request)
{
    $timestamp = time();
    $folder = $request->folder;

    $apiSecret = config('cloudinary.api_secret');

    $signature = sha1(
        "folder={$folder}&timestamp={$timestamp}" . $apiSecret
    );

    return response()->json([
        'timestamp'  => $timestamp,
        'signature'  => $signature,
        'cloud_name' => config('cloudinary.cloud_name'),
        'api_key'    => config('cloudinary.api_key'),
    ]);
}
}