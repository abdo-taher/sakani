<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\VisitorLog;
use Illuminate\Support\Facades\Cache;

class TrackVisitor
{
    // Paths that should not be tracked
    private array $skipPaths = [
        'health',
        'config',
    ];

    public function handle(Request $request, Closure $next)
    {
        // Only track GET requests (page views)
        if ($request->method() !== 'GET') {
            return $next($request);
        }

        // Skip non-public paths (login, admin credentials, notifications, etc.)
        $path = $request->path();

        if (in_array($path, $this->skipPaths)) {
            return $next($request);
        }

        // Skip any path containing a dot (file extensions, asset requests)
        if (str_contains($path, '.')) {
            return $next($request);
        }

        $ip = $request->ip();

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
