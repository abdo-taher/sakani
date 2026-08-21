<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\R2MediaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Exception;

class MediaUploadController extends Controller
{
    protected R2MediaService $r2Service;

    public function __construct(R2MediaService $r2Service)
    {
        $this->r2Service = $r2Service;
    }

    /**
     * Upload a single media file to Cloudflare R2
     */
    public function upload(Request $request)
    {
        // 1. Check if file was uploaded or dropped by PHP limits before validation
        if (!$request->hasFile('file')) {
            $maxUpload = ini_get('upload_max_filesize');
            $maxPost = ini_get('post_max_size');
            return response()->json([
                'success' => false,
                'message' => "لم يتم استلام الملف أو أن حجمه يتجاوز الحد الأقصى لسيرفر PHP (upload_max_filesize: {$maxUpload}, post_max_size: {$maxPost}). يرجى رفع ملف أصغر أو زيادة الحد في php.ini.",
            ], 422);
        }

        $file = $request->file('file');
        if (!$file->isValid()) {
            return response()->json([
                'success' => false,
                'message' => 'فشل رفع الملف: ' . $file->getErrorMessage(),
            ], 422);
        }

        $request->validate([
            'file' => 'required|file|max:1048576', // up to 1GB in KB
            'folder' => 'sometimes|string|max:255',
            'media_type' => 'sometimes|string|in:image,video,raw,document',
        ]);

        $folder = $request->input('folder', 'sakani/properties/images');

        try {
            $result = $this->r2Service->uploadFile($file, $folder);

            return response()->json([
                'success' => true,
                'message' => 'Media uploaded successfully',
                'url' => $result['url'],
                'key' => $result['key'],
                'public_id' => $result['public_id'],
                'file_path' => $result['file_path'],
                'size' => $result['size'],
                'mime_type' => $result['mime_type'],
                'storage_disk' => $result['storage_disk'] ?? 'r2',
            ], 201);
        } catch (Exception $e) {
            Log::error("Media upload endpoint error: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to upload media: ' . $e->getMessage(),
            ], 502);
        }
    }

    /**
     * Delete an object from Cloudflare R2
     */
    public function destroy(Request $request)
    {
        $request->validate([
            'key' => 'required_without:url|string',
            'url' => 'required_without:key|string',
        ]);

        $target = $request->input('key') ?: $request->input('url');

        $deleted = $this->r2Service->delete($target);

        return response()->json([
            'success' => $deleted,
            'message' => $deleted ? 'Object deleted from R2' : 'Failed to delete object from R2',
        ]);
    }
}
