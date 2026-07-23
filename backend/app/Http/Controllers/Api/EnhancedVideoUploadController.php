<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EnhancedVideoUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Exception;

class EnhancedVideoUploadController extends Controller
{
    protected EnhancedVideoUploadService $videoUploadService;

    public function __construct(EnhancedVideoUploadService $videoUploadService)
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
                'video' => 'required|file|mimes:mp4,mpeg,quicktime,avi,webm,flv,3gp,wmv|max:' . (config('video_upload.max_size') / 1024),
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
     * Initialize chunked upload - Enhanced version
     */
    public function initChunkedUpload(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'file_name' => 'required|string|max:255',
                'file_size' => 'required|integer|min:1|max:' . config('video_upload.max_size'),
                'chunk_size' => 'sometimes|integer|min:1024|max:' . config('video_upload.chunk_size'),
                'mime_type' => 'required|string|in:' . implode(',', config('video_upload.allowed_mime_types')),
                'folder' => 'sometimes|string|max:255',
                'use_multipart' => 'sometimes|boolean', // New option for direct multipart upload
            ]);

            $fileName = $request->input('file_name');
            $fileSize = $request->input('file_size');
            $chunkSize = $request->input('chunk_size', config('video_upload.chunk_size'));
            $mimeType = $request->input('mime_type');
            $folder = $request->input('folder', config('video_upload.folders.properties'));
            $useMultipart = $request->input('use_multipart', true);

            // Generate unique upload session ID
            $uploadId = uniqid('upload_', true);
            
            // Calculate total chunks needed
            $totalChunks = ceil($fileSize / $chunkSize);

            // Check if we can use S3 multipart upload
            $primaryDriver = config('video_upload.primary_driver');
            $supportsMultipart = in_array($primaryDriver, ['s3', 'r2']) && $useMultipart;

            // Store upload metadata
            $uploadMetadata = [
                'upload_id' => $uploadId,
                'file_name' => $fileName,
                'file_size' => $fileSize,
                'chunk_size' => $chunkSize,
                'total_chunks' => $totalChunks,
                'mime_type' => $mimeType,
                'folder' => $folder,
                'supports_multipart' => $supportsMultipart,
                'primary_driver' => $primaryDriver,
                'created_at' => now()->toISOString(),
            ];

            Cache::put("upload_metadata_{$uploadId}", $uploadMetadata, now()->addHours(24));

            // If using S3 multipart, initialize it
            $multipartData = null;
            if ($supportsMultipart) {
                try {
                    $multipartData = $this->initializeS3MultipartUpload($uploadId, $folder . '/' . $fileName, $mimeType);
                    $uploadMetadata['s3_upload_id'] = $multipartData['upload_id'];
                    Cache::put("upload_metadata_{$uploadId}", $uploadMetadata, now()->addHours(24));
                } catch (Exception $e) {
                    Log::warning("Failed to initialize S3 multipart upload: " . $e->getMessage());
                    $supportsMultipart = false;
                    $uploadMetadata['supports_multipart'] = false;
                }
            }

            Log::info('Chunked upload initialized', [
                'upload_id' => $uploadId,
                'file_name' => $fileName,
                'file_size' => $fileSize,
                'total_chunks' => $totalChunks,
                'supports_multipart' => $supportsMultipart
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Chunked upload initialized',
                'data' => [
                    'upload_id' => $uploadId,
                    'chunk_size' => $chunkSize,
                    'total_chunks' => $totalChunks,
                    'folder' => $folder,
                    'supports_multipart' => $supportsMultipart,
                    'upload_method' => $supportsMultipart ? 'multipart' : 'local_assembly',
                    's3_multipart_data' => $multipartData,
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
     * Upload a single chunk - Enhanced version
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

            // Get upload metadata
            $metadata = Cache::get("upload_metadata_{$uploadId}");
            if (!$metadata) {
                throw new Exception("Upload session not found or expired");
            }

            // If using S3 multipart, upload chunk directly to S3
            if ($metadata['supports_multipart'] && isset($metadata['s3_upload_id'])) {
                $result = $this->uploadChunkToS3Multipart($uploadId, $chunkIndex, $chunkData, $metadata);
            } else {
                // Store chunk in cache/storage for later assembly
                $result = $this->storeChunkForAssembly($uploadId, $chunkIndex, $chunkData);
            }

            Log::info('Chunk uploaded', [
                'upload_id' => $uploadId,
                'chunk_index' => $chunkIndex,
                'is_last_chunk' => $isLastChunk,
                'method' => $metadata['supports_multipart'] ? 'multipart' : 'local'
            ]);

            $response = [
                'success' => true,
                'message' => 'Chunk uploaded successfully',
                'data' => array_merge([
                    'upload_id' => $uploadId,
                    'chunk_index' => $chunkIndex,
                ], $result)
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
     * Complete chunked upload - Enhanced version
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

            // Get upload metadata
            $metadata = Cache::get("upload_metadata_{$uploadId}");
            if (!$metadata) {
                throw new Exception("Upload session not found or expired");
            }

            Log::info('Completing chunked upload', [
                'upload_id' => $uploadId,
                'file_name' => $fileName,
                'method' => $metadata['supports_multipart'] ? 'multipart' : 'local_assembly'
            ]);

            if ($metadata['supports_multipart'] && isset($metadata['s3_upload_id'])) {
                // Complete S3 multipart upload
                $result = $this->completeS3MultipartUpload($uploadId, $metadata);
            } else {
                // Retrieve all chunks for assembly
                $chunks = $this->getStoredChunks($uploadId);

                if (empty($chunks)) {
                    throw new Exception('No chunks found for upload ID: ' . $uploadId);
                }

                // Upload the assembled video
                $result = $this->videoUploadService->uploadChunkedVideo($chunks, $fileName, $folder);
            }

            // Cleanup stored chunks and metadata
            $this->cleanupUploadSession($uploadId);

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
     * Cancel chunked upload - Enhanced version
     */
    public function cancelChunkedUpload(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'upload_id' => 'required|string'
            ]);

            $uploadId = $request->input('upload_id');

            // Get upload metadata
            $metadata = Cache::get("upload_metadata_{$uploadId}");
            
            if ($metadata) {
                // If S3 multipart was in progress, abort it
                if ($metadata['supports_multipart'] && isset($metadata['s3_upload_id'])) {
                    $this->abortS3MultipartUpload($uploadId, $metadata);
                }
            }

            // Cleanup stored chunks and metadata
            $this->cleanupUploadSession($uploadId);

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
        $primaryDriver = config('video_upload.primary_driver');
        $supportsMultipart = in_array($primaryDriver, ['s3', 'r2']);

        return response()->json([
            'success' => true,
            'data' => [
                'max_file_size' => config('video_upload.max_size'),
                'chunk_size' => config('video_upload.chunk_size'),
                'allowed_mime_types' => config('video_upload.allowed_mime_types'),
                'primary_driver' => $primaryDriver,
                'fallback_driver' => config('video_upload.fallback_driver'),
                'supports_multipart' => $supportsMultipart,
                'multipart_threshold' => config('video_upload.multipart_threshold', 5 * 1024 * 1024), // 5MB
            ]
        ]);
    }

    /**
     * Initialize S3 multipart upload
     */
    protected function initializeS3MultipartUpload(string $uploadId, string $filePath, string $mimeType): array
    {
        $primaryDriver = config('video_upload.primary_driver');
        $config = config("filesystems.disks.{$primaryDriver}");
        
        $s3Client = new \Aws\S3\S3Client([
            'version' => 'latest',
            'region' => $config['region'],
            'endpoint' => $config['endpoint'] ?? null,
            'use_path_style_endpoint' => $config['use_path_style_endpoint'] ?? false,
            'credentials' => [
                'key' => $config['key'],
                'secret' => $config['secret'],
            ],
        ]);

        $result = $s3Client->createMultipartUpload([
            'Bucket' => $config['bucket'],
            'Key' => $filePath,
            'ContentType' => $mimeType,
            'ACL' => 'public-read',
        ]);

        return [
            'upload_id' => $result['UploadId'],
            'bucket' => $config['bucket'],
            'key' => $filePath,
        ];
    }

    /**
     * Upload chunk directly to S3 multipart
     */
    protected function uploadChunkToS3Multipart(string $uploadId, int $chunkIndex, string $chunkData, array $metadata): array
    {
        $primaryDriver = config('video_upload.primary_driver');
        $config = config("filesystems.disks.{$primaryDriver}");
        
        $s3Client = new \Aws\S3\S3Client([
            'version' => 'latest',
            'region' => $config['region'],
            'endpoint' => $config['endpoint'] ?? null,
            'use_path_style_endpoint' => $config['use_path_style_endpoint'] ?? false,
            'credentials' => [
                'key' => $config['key'],
                'secret' => $config['secret'],
            ],
        ]);

        $partNumber = $chunkIndex + 1; // S3 part numbers start from 1
        $decodedChunkData = base64_decode($chunkData);

        $result = $s3Client->uploadPart([
            'Bucket' => $config['bucket'],
            'Key' => $metadata['folder'] . '/' . $metadata['file_name'],
            'PartNumber' => $partNumber,
            'UploadId' => $metadata['s3_upload_id'],
            'Body' => $decodedChunkData,
        ]);

        // Store part info for later completion
        $partInfo = [
            'PartNumber' => $partNumber,
            'ETag' => $result['ETag'],
        ];

        $partsKey = "upload_parts_{$uploadId}";
        $existingParts = Cache::get($partsKey, []);
        $existingParts[] = $partInfo;
        Cache::put($partsKey, $existingParts, now()->addHours(24));

        return [
            'part_number' => $partNumber,
            'etag' => $result['ETag'],
            'method' => 'multipart'
        ];
    }

    /**
     * Complete S3 multipart upload
     */
    protected function completeS3MultipartUpload(string $uploadId, array $metadata): array
    {
        $primaryDriver = config('video_upload.primary_driver');
        $config = config("filesystems.disks.{$primaryDriver}");
        
        $s3Client = new \Aws\S3\S3Client([
            'version' => 'latest',
            'region' => $config['region'],
            'endpoint' => $config['endpoint'] ?? null,
            'use_path_style_endpoint' => $config['use_path_style_endpoint'] ?? false,
            'credentials' => [
                'key' => $config['key'],
                'secret' => $config['secret'],
            ],
        ]);

        // Get all uploaded parts
        $partsKey = "upload_parts_{$uploadId}";
        $parts = Cache::get($partsKey, []);

        if (empty($parts)) {
            throw new Exception("No uploaded parts found for multipart upload");
        }

        // Sort parts by part number
        usort($parts, function ($a, $b) {
            return $a['PartNumber'] <=> $b['PartNumber'];
        });

        $filePath = $metadata['folder'] . '/' . $metadata['file_name'];

        $result = $s3Client->completeMultipartUpload([
            'Bucket' => $config['bucket'],
            'Key' => $filePath,
            'UploadId' => $metadata['s3_upload_id'],
            'MultipartUpload' => [
                'Parts' => $parts,
            ],
        ]);

        $disk = \Storage::disk($primaryDriver);

        return [
            'driver' => $primaryDriver,
            'file_path' => $filePath,
            'url' => $disk->url($filePath),
            'size' => $metadata['file_size'],
            'mime_type' => $metadata['mime_type'],
        ];
    }

    /**
     * Abort S3 multipart upload
     */
    protected function abortS3MultipartUpload(string $uploadId, array $metadata): void
    {
        $primaryDriver = config('video_upload.primary_driver');
        $config = config("filesystems.disks.{$primaryDriver}");
        
        $s3Client = new \Aws\S3\S3Client([
            'version' => 'latest',
            'region' => $config['region'],
            'endpoint' => $config['endpoint'] ?? null,
            'use_path_style_endpoint' => $config['use_path_style_endpoint'] ?? false,
            'credentials' => [
                'key' => $config['key'],
                'secret' => $config['secret'],
            ],
        ]);

        $s3Client->abortMultipartUpload([
            'Bucket' => $config['bucket'],
            'Key' => $metadata['folder'] . '/' . $metadata['file_name'],
            'UploadId' => $metadata['s3_upload_id'],
        ]);
    }

    /**
     * Store chunk for local assembly
     */
    protected function storeChunkForAssembly(string $uploadId, int $chunkIndex, string $chunkData): array
    {
        $cacheKey = "upload_chunk_{$uploadId}_{$chunkIndex}";
        Cache::put($cacheKey, $chunkData, now()->addHour());

        // Track chunk indices
        $keysKey = "upload_keys_{$uploadId}";
        $existingKeys = Cache::get($keysKey, []);
        if (!in_array($chunkIndex, $existingKeys)) {
            $existingKeys[] = $chunkIndex;
            Cache::put($keysKey, $existingKeys, now()->addHour());
        }

        return [
            'method' => 'local_cache',
            'cached' => true
        ];
    }

    /**
     * Retrieve stored chunks
     */
    protected function getStoredChunks(string $uploadId): array
    {
        $chunks = [];
        $keysKey = "upload_keys_{$uploadId}";
        $chunkIndices = Cache::get($keysKey, []);
        
        foreach ($chunkIndices as $chunkIndex) {
            $cacheKey = "upload_chunk_{$uploadId}_{$chunkIndex}";
            $chunkData = Cache::get($cacheKey);
            if ($chunkData) {
                $chunks[] = [
                    'index' => $chunkIndex,
                    'data' => $chunkData
                ];
            }
        }

        return $chunks;
    }

    /**
     * Cleanup upload session
     */
    protected function cleanupUploadSession(string $uploadId): void
    {
        // Clean up metadata
        Cache::forget("upload_metadata_{$uploadId}");
        
        // Clean up parts info (for multipart uploads)
        Cache::forget("upload_parts_{$uploadId}");
        
        // Clean up chunk keys tracking
        $keysKey = "upload_keys_{$uploadId}";
        $chunkIndices = Cache::get($keysKey, []);
        Cache::forget($keysKey);
        
        // Clean up individual chunks
        foreach ($chunkIndices as $chunkIndex) {
            Cache::forget("upload_chunk_{$uploadId}_{$chunkIndex}");
        }
    }
}