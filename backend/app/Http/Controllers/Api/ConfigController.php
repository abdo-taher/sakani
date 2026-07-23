<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DynamicConfigService;
use Illuminate\Http\JsonResponse;

class ConfigController extends Controller
{
    /**
     * Get dynamic configuration for frontend
     */
    public function getConfig(): JsonResponse
    {
        return response()->json([
            'api_url' => DynamicConfigService::getApiUrl(),
            'frontend_url' => DynamicConfigService::getFrontendUrl(),
            'app_name' => config('app.name'),
            'environment' => DynamicConfigService::getCurrentEnvironment(),
            'cors_origins' => DynamicConfigService::getCorsOrigins(),
        ]);
    }

    /**
     * Health check endpoint
     */
    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'message' => 'Sakani API is running',
            'environment' => app()->environment(),
            'timestamp' => now()->toISOString(),
            'api_url' => DynamicConfigService::getApiUrl(),
            'frontend_url' => DynamicConfigService::getFrontendUrl(),
        ]);
    }
}