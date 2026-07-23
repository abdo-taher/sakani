<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();

        array_walk_recursive($input, function (&$value) {
            if (is_string($value)) {
                // Remove potentially dangerous HTML tags and JavaScript
                $value = strip_tags($value, '<p><br><strong><em><ul><li><ol>');
                // Remove script tags and event handlers
                $value = preg_replace('/\<script\b[^>]*\>(.*?)\<\/script\>/is', '', $value);
                $value = preg_replace('/on\w+\s*=\s*"[^"]*"/i', '', $value);
                $value = preg_replace('/on\w+\s*=\s*\'[^\']*\'/i', '', $value);
                // Trim whitespace
                $value = trim($value);
            }
        });

        $request->merge($input);

        return $next($request);
    }
}