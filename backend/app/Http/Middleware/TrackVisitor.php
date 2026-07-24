<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\VisitorLog;
use Illuminate\Support\Facades\Cache;

class TrackVisitor
{
    public function handle(Request $request, Closure $next)
    {
        $ip = $request->ip();
        $path = $request->path();

        // Skip admin/api/asset routes
        if (
            str_starts_with($path, 'api/') ||
            str_starts_with($path, 'admin/') ||
            str_contains($path, '.') ||
            $request->is('storage/*')
        ) {
            return $next($request);
        }

        // Deduplicate: one log per IP per 5 minutes per path
        $cacheKey = "visitor_{$ip}_" . md5($path);
        if (!Cache::has($cacheKey)) {
            Cache::put($cacheKey, true, 300);

            try {
                VisitorLog::create([
                    'ip'         => $ip,
                    'path'       => '/' . $path,
                    'user_agent' => $request->userAgent(),
                ]);
            } catch (\Exception $e) {
                // Silently fail — don't break the request
            }
        }

        return $next($request);
    }
}
