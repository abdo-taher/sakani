<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleVideoUploads
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Increase execution time and memory limit for video uploads
        if ($request->hasFile('video') || $request->is('api/videos/*')) {
            ini_set('max_execution_time', 600); // 10 minutes
            ini_set('memory_limit', '512M');
            ini_set('post_max_size', '200M');
            ini_set('upload_max_filesize', '200M');
        }

        return $next($request);
    }
}