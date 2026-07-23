<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\VideoUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Exception;

class VideoUploadController extends Controller
{
    protected VideoUploadService $videoUploadService;

    public function __construct(VideoUploadService $videoUploadService)
    {
        $this->videoUploadService = $videoUploadService;
    }

    /**
     * Upload a video file
     */
    public function upload(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'video' => 'required|file|mimes:mp4,mpeg,quicktime,avi,webm,flv,3gp,wmv|max:' . (config('video_upload.max_size') / 1024), // Convert to KB
                'folder' => 'sometimes|string|max:255'
            ]);

            $folder = $request->input('folder', config('video_upload.folders.properties'));
            $videoFile = $request->file('video');

            Log::info('Video upload started', [
                'original_name' => $videoFile->getClientOriginalName(),
                'size' => $videoFile->getSize(),
                'mime_type' => $videoFile->getMimeType()
            ]);

            $result = $this->videoUploadService->uploadVideo($videoFile, $folder);

            return response()->json([
                'success' => true,
                'message' => 'Video uploaded successfully',
                'data' => $result
            ], 201);

        } catch (Exception $e) {
            Log::error('Video upload failed', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Video upload failed: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Initialize chunked upload
     */
    public function initChunkedUpload(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'file_name' => 'required|string|max:255',
                'file_size' => 'required|integer|min:1|max:' . config('video_upload.max_size'),
                'chunk_size' => 'sometimes|integer|min:1024|max:' . config('video_upload.chunk_size'),
                'mime_type' => 'required|string|in:' . implode(',', config('video_upload.allowed_mime_types')),
                'folder' => 'sometimes|string|max:255'
            ]);

            $fileName = $request->input('file_name');
            $fileSize = $request->input('file_size');
            $chunkSize = $request->input('chunk_size', config('video_upload.chunk_size'));
            $mimeType = $request->input('mime_type');
            $folder = $request->input('folder', config('video_upload.folders.properties'));

            // Generate unique upload session ID
            $uploadId = uniqid('upload_', true);
            
            // Calculate total chunks needed
            $totalChunks = ceil($fileSize / $chunkSize);

            Log::info('Chunked upload initialized', [
                'upload_id' => $uploadId,
                'file_name' => $fileName,
                'file_size' => $fileSize,
                'total_chunks' => $totalChunks
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Chunked upload initialized',
                'data' => [
                    'upload_id' => $uploadId,
                    'chunk_size' => $chunkSize,
                    'total_chunks' => $totalChunks,
                    'folder' => $folder
                ]
            ]);

        } catch (Exception $e) {
            Log::error('Chunked upload initialization failed', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Chunked upload initialization failed: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Upload a single chunk
     */
    public function uploadChunk(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'upload_id' => 'required|string',
                'chunk_index' => 'required|integer|min:0',
                'chunk_data' => 'required|string', // Base64 encoded chunk data
                'is_last_chunk' => 'sometimes|boolean'
            ]);

            $uploadId = $request->input('upload_id');
            $chunkIndex = $request->input('chunk_index');
            $chunkData = $request->input('chunk_data');
            $isLastChunk = $request->input('is_last_chunk', false);

            // Store chunk in cache/session/database
            $this->storeChunk($uploadId, $chunkIndex, $chunkData);

            Log::info('Chunk uploaded', [
                'upload_id' => $uploadId,
                'chunk_index' => $chunkIndex,
                'is_last_chunk' => $isLastChunk
            ]);

            $response = [
                'success' => true,
                'message' => 'Chunk uploaded successfully',
                'data' => [
                    'upload_id' => $uploadId,
                    'chunk_index' => $chunkIndex
                ]
            ];

            // If this is the last chunk, provide completion info
            if ($isLastChunk) {
                $response['message'] = 'All chunks uploaded successfully';
                $response['data']['ready_for_assembly'] = true;
            }

            return response()->json($response);

        } catch (Exception $e) {
            Log::error('Chunk upload failed', [
                'error' => $e->getMessage(),
                'upload_id' => $request->input('upload_id'),
                'chunk_index' => $request->input('chunk_index')
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Chunk upload failed: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Complete chunked upload by assembling chunks
     */
    public function completeChunkedUpload(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'upload_id' => 'required|string',
                'file_name' => 'required|string',
                'folder' => 'sometimes|string|max:255'
            ]);

            $uploadId = $request->input('upload_id');
            $fileName = $request->input('file_name');
            $folder = $request->input('folder', config('video_upload.folders.properties'));

            // Retrieve all chunks for this upload
            $chunks = $this->getStoredChunks($uploadId);

            if (empty($chunks)) {
                throw new Exception('No chunks found for upload ID: ' . $uploadId);
            }

            Log::info('Completing chunked upload', [
                'upload_id' => $uploadId,
                'file_name' => $fileName,
                'chunks_count' => count($chunks)
            ]);

            // Upload the assembled video
            $result = $this->videoUploadService->uploadChunkedVideo($chunks, $fileName, $folder);

            // Cleanup stored chunks
            $this->cleanupStoredChunks($uploadId);

            return response()->json([
                'success' => true,
                'message' => 'Video assembled and uploaded successfully',
                'data' => $result
            ], 201);

        } catch (Exception $e) {
            Log::error('Chunked upload completion failed', [
                'error' => $e->getMessage(),
                'upload_id' => $request->input('upload_id')
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Chunked upload completion failed: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Cancel chunked upload
     */
    public function cancelChunkedUpload(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'upload_id' => 'required|string'
            ]);

            $uploadId = $request->input('upload_id');

            // Cleanup stored chunks
            $this->cleanupStoredChunks($uploadId);

            Log::info('Chunked upload cancelled', ['upload_id' => $uploadId]);

            return response()->json([
                'success' => true,
                'message' => 'Chunked upload cancelled successfully'
            ]);

        } catch (Exception $e) {
            Log::error('Chunked upload cancellation failed', [
                'error' => $e->getMessage(),
                'upload_id' => $request->input('upload_id')
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Chunked upload cancellation failed: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Get upload configuration
     */
    public function getConfig(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'max_file_size' => config('video_upload.max_size'),
                'chunk_size' => config('video_upload.chunk_size'),
                'allowed_mime_types' => config('video_upload.allowed_mime_types'),
                'primary_driver' => config('video_upload.primary_driver'),
                'fallback_driver' => config('video_upload.fallback_driver')
            ]
        ]);
    }

    /**
     * Store chunk data (implement based on your preferred storage method)
     */
    protected function storeChunk(string $uploadId, int $chunkIndex, string $chunkData): void
    {
        // Option 1: Store in cache (Redis/Memcached)
        $cacheKey = "upload_chunk_{$uploadId}_{$chunkIndex}";
        cache()->put($cacheKey, $chunkData, now()->addHour());

        // Option 2: Store in database (create uploads table)
        // DB::table('upload_chunks')->insert([
        //     'upload_id' => $uploadId,
        //     'chunk_index' => $chunkIndex,
        //     'chunk_data' => $chunkData,
        //     'created_at' => now()
        // ]);

        // Option 3: Store in temporary files
        // $chunkPath = storage_path("app/temp/chunks/{$uploadId}/{$chunkIndex}");
        // file_put_contents($chunkPath, base64_decode($chunkData));
    }

    /**
     * Retrieve stored chunks
     */
    protected function getStoredChunks(string $uploadId): array
    {
        // Option 1: Retrieve from cache
        $chunks = [];
        $cacheKeys = cache()->get("upload_keys_{$uploadId}", []);
        
        foreach ($cacheKeys as $chunkIndex) {
            $cacheKey = "upload_chunk_{$uploadId}_{$chunkIndex}";
            $chunkData = cache()->get($cacheKey);
            if ($chunkData) {
                $chunks[] = [
                    'index' => $chunkIndex,
                    'data' => $chunkData
                ];
            }
        }

        // If no chunks in cache, try to build from pattern
        if (empty($chunks)) {
            for ($i = 0; $i < 1000; $i++) { // Max 1000 chunks
                $cacheKey = "upload_chunk_{$uploadId}_{$i}";
                $chunkData = cache()->get($cacheKey);
                if ($chunkData) {
                    $chunks[] = [
                        'index' => $i,
                        'data' => $chunkData
                    ];
                } elseif ($i > 10) { // Stop checking after 10 consecutive misses
                    break;
                }
            }
        }

        return $chunks;
    }

    /**
     * Cleanup stored chunks
     */
    protected function cleanupStoredChunks(string $uploadId): void
    {
        // Option 1: Clear from cache
        for ($i = 0; $i < 1000; $i++) {
            $cacheKey = "upload_chunk_{$uploadId}_{$i}";
            cache()->forget($cacheKey);
        }
        cache()->forget("upload_keys_{$uploadId}");

        // Option 2: Delete from database
        // DB::table('upload_chunks')->where('upload_id', $uploadId)->delete();

        // Option 3: Delete temporary files
        // $chunkDir = storage_path("app/temp/chunks/{$uploadId}");
        // if (is_dir($chunkDir)) {
        //     array_map('unlink', glob("$chunkDir/*"));
        //     rmdir($chunkDir);
        // }
    }
}