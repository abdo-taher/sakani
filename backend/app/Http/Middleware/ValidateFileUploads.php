<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateFileUploads
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Define allowed file types
        $allowedImageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $allowedVideoTypes = ['mp4', 'avi', 'mov', 'wmv'];
        $maxImageSize = 10 * 1024 * 1024; // 10MB
        $maxVideoSize = 100 * 1024 * 1024; // 100MB

        // Validate uploaded files
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                if (!$this->validateFile($file, $allowedImageTypes, $maxImageSize)) {
                    return response()->json([
                        'message' => 'Invalid image file. Allowed types: ' . implode(', ', $allowedImageTypes) . '. Max size: 10MB.'
                    ], 422);
                }
            }
        }

        if ($request->hasFile('video')) {
            $file = $request->file('video');
            if (!$this->validateFile($file, $allowedVideoTypes, $maxVideoSize)) {
                return response()->json([
                    'message' => 'Invalid video file. Allowed types: ' . implode(', ', $allowedVideoTypes) . '. Max size: 100MB.'
                ], 422);
            }
        }

        // Check for potential malicious files
        foreach ($request->allFiles() as $files) {
            if (is_array($files)) {
                foreach ($files as $file) {
                    if ($this->isMaliciousFile($file)) {
                        return response()->json(['message' => 'Malicious file detected.'], 422);
                    }
                }
            } else {
                if ($this->isMaliciousFile($files)) {
                    return response()->json(['message' => 'Malicious file detected.'], 422);
                }
            }
        }

        return $next($request);
    }

    private function validateFile($file, $allowedTypes, $maxSize)
    {
        if (!$file->isValid()) {
            return false;
        }

        $extension = strtolower($file->getClientOriginalExtension());
        
        if (!in_array($extension, $allowedTypes)) {
            return false;
        }

        if ($file->getSize() > $maxSize) {
            return false;
        }

        return true;
    }

    private function isMaliciousFile($file)
    {
        $filename = $file->getClientOriginalName();
        $extension = strtolower($file->getClientOriginalExtension());
        
        // Check for executable extensions
        $dangerousExtensions = ['php', 'exe', 'bat', 'sh', 'cmd', 'scr', 'js', 'jar'];
        
        if (in_array($extension, $dangerousExtensions)) {
            return true;
        }

        // Check for double extensions (e.g., image.jpg.php)
        if (substr_count($filename, '.') > 1) {
            $parts = explode('.', $filename);
            foreach ($parts as $part) {
                if (in_array(strtolower($part), $dangerousExtensions)) {
                    return true;
                }
            }
        }

        return false;
    }
}