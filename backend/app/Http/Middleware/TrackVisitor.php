<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\VisitorLog;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;

class TrackVisitor
{
    private array $skipPaths = [
        'health',
        'config',
        'login',
        'login-status',
    ];

    public function handle(Request $request, Closure $next)
    {
        if ($request->method() !== 'GET') {
            return $next($request);
        }

        // Skip authenticated admin users — they are not visitors
        if ($request->user() || $request->bearerToken()) {
            return $next($request);
        }

        $path = $request->path();

        if (in_array($path, $this->skipPaths)) {
            return $next($request);
        }

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
                // Silently fail
            }
        }

        return $next($request);
    }
}
