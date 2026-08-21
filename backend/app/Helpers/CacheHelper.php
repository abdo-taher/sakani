<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CacheHelper
{
    /**
     * Clear all property related caches, stats, and locations cache when property data changes.
     */
    public static function clearPropertyCaches(): void
    {
        try {
            // Bump version to instantly invalidate all cached search/filter query results
            Cache::put('sakani_props_version', time(), 86400 * 30);
            
            // Invalidate location aggregations (counts & min prices)
            Cache::forget('sakani_locations_all');
            Cache::forget('sakani_locations_all_v2');
            
            // Invalidate public stats
            Cache::forget('sakani_public_stats_v2');
            
            // Invalidate dashboard stats
            self::clearDashboardCaches();
        } catch (\Exception $e) {
            Log::warning('CacheHelper::clearPropertyCaches error: ' . $e->getMessage());
        }
    }

    /**
     * Clear location caches when locations are created, modified or deleted.
     */
    public static function clearLocationCaches(): void
    {
        try {
            Cache::forget('sakani_locations_all');
            Cache::forget('sakani_locations_all_v2');
            Cache::forget('sakani_public_stats_v2');
            Cache::put('sakani_props_version', time(), 86400 * 30);
            self::clearDashboardCaches();
        } catch (\Exception $e) {
            Log::warning('CacheHelper::clearLocationCaches error: ' . $e->getMessage());
        }
    }

    /**
     * Clear application settings cache when settings are saved.
     */
    public static function clearSettingCaches(): void
    {
        try {
            Cache::forget('sakani_settings_merged');
        } catch (\Exception $e) {
            Log::warning('CacheHelper::clearSettingCaches error: ' . $e->getMessage());
        }
    }

    /**
     * Clear dashboard analytics caches across all time ranges.
     */
    public static function clearDashboardCaches(): void
    {
        try {
            Cache::forget('sakani_dashboard_stats_v2_all');
            Cache::forget('sakani_dashboard_stats_v2_today');
            Cache::forget('sakani_dashboard_stats_v2_7_days');
            Cache::forget('sakani_dashboard_stats_v2_30_days');
        } catch (\Exception $e) {
            Log::warning('CacheHelper::clearDashboardCaches error: ' . $e->getMessage());
        }
    }

    /**
     * Clear public statistics and metrics caches.
     */
    public static function clearStatsCaches(): void
    {
        try {
            Cache::forget('sakani_public_stats_v2');
            self::clearDashboardCaches();
        } catch (\Exception $e) {
            Log::warning('CacheHelper::clearStatsCaches error: ' . $e->getMessage());
        }
    }

    /**
     * Flush all Sakani cache keys.
     */
    public static function clearAll(): void
    {
        self::clearPropertyCaches();
        self::clearLocationCaches();
        self::clearSettingCaches();
        self::clearStatsCaches();
    }
}
