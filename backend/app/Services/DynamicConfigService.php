<?php

namespace App\Services;

class DynamicConfigService
{
    /**
     * Get the current environment based on request
     */
    public static function getCurrentEnvironment(): string
    {
        $host = request()->getHost();
        $environments = config('dynamic.environments', []);
        
        foreach ($environments as $env => $config) {
            if (in_array($host, $config['domains'] ?? [])) {
                return $env;
            }
        }
        
        // Fallback based on APP_ENV
        return config('app.env', 'production');
    }
    
    /**
     * Get dynamic frontend URL
     */
    public static function getFrontendUrl(): string
    {
        if (!config('dynamic.auto_detect_urls', true)) {
            return config('dynamic.fallback_urls.frontend');
        }
        
        $env = self::getCurrentEnvironment();
        $envConfig = config("dynamic.environments.{$env}", []);
        
        if (isset($envConfig['frontend_url'])) {
            return $envConfig['frontend_url'];
        }
        
        // Auto-detect from current request
        $request = request();
        $host = $request->getHost();
        $scheme = $request->getScheme();
        
        // Remove 'api.' prefix if present
        $frontendHost = preg_replace('/^api\./', '', $host);
        
        return "{$scheme}://{$frontendHost}";
    }
    
    /**
     * Get dynamic API URL
     */
    public static function getApiUrl(): string
    {
        if (!config('dynamic.auto_detect_urls', true)) {
            return config('dynamic.fallback_urls.api');
        }
        
        $env = self::getCurrentEnvironment();
        $envConfig = config("dynamic.environments.{$env}", []);
        
        if (isset($envConfig['api_url'])) {
            return $envConfig['api_url'];
        }
        
        // Auto-detect from current request
        $request = request();
        $host = $request->getHost();
        $scheme = $request->getScheme();
        
        // Add 'api.' prefix if not present and not localhost
        if (!str_starts_with($host, 'api.') && !in_array($host, ['localhost', '127.0.0.1'])) {
            $host = "api.{$host}";
        }
        
        return "{$scheme}://{$host}";
    }
    
    /**
     * Get CORS allowed origins dynamically
     */
    public static function getCorsOrigins(): array
    {
        $origins = [
            self::getFrontendUrl(),
            self::getApiUrl(),
        ];
        
        // Add environment-specific origins
        $env = self::getCurrentEnvironment();
        $envConfig = config("dynamic.environments.{$env}", []);
        
        if (isset($envConfig['additional_origins'])) {
            $origins = array_merge($origins, $envConfig['additional_origins']);
        }
        
        return array_unique($origins);
    }
    
    /**
     * Get Sanctum stateful domains
     */
    public static function getSanctumDomains(): array
    {
        $request = request();
        $host = $request->getHost();
        
        $domains = [$host];
        
        // Add common variations
        if (!str_starts_with($host, 'api.')) {
            $domains[] = "api.{$host}";
        }
        
        if (!str_starts_with($host, 'www.')) {
            $domains[] = "www.{$host}";
        }
        
        // Remove api. prefix for main domain
        $mainDomain = preg_replace('/^api\./', '', $host);
        $domains[] = $mainDomain;
        
        return array_unique($domains);
    }
}