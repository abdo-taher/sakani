<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Exception;
use Aws\S3\S3Client;
use Aws\S3\MultipartUploader;
use Aws\Exception\MultipartUploadException;

class EnhancedVideoUploadService
{
    protected $primaryDriver;
    protected $fallbackDriver;
    protected $maxFileSize;
    protected $chunkSize;
    protected $allowedMimeTypes = [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo',
        'video/webm'
    ];

    public function __construct()
    {
        $this->primaryDriver = config('video_upload.primary_driver', 'r2');
        $this->fallbackDriver = config('video_upload.fallback_driver', 'videos');
        $this->maxFileSize = config('video_upload.max_size', 104857600); // 100MB
        $this->chunkSize = config('video_upload.chunk_size', 1048576); // 1MB
    }

    /**
     * Upload video using primary driver with fallback to local
     */
    public function uploadVideo(UploadedFile $file, string $folder = 'properties/videos'): array
    {
        $this->validateVideo($file);

        $fileName = $this->generateFileName($file);
        $filePath = $folder . '/' . $fileName;

        // Try primary driver (Cloudflare R2)
        try {
            Log::info("Attempting video upload to primary driver: {$this->primaryDriver}");
            
            $result = $this->uploadToPrimaryDriver($file, $filePath);
            
            Log::info("Video uploaded successfully to primary driver", $result);
            return $result;
            
        } catch (Exception $e) {
            Log::warning("Primary driver upload failed: " . $e->getMessage());
            
            // Fallback to local chunked upload
            try {
                Log::info("Attempting fallback to local chunked upload");
                
                $result = $this->uploadToFallbackDriver($file, $filePath);
                
                Log::info("Video uploaded successfully to fallback driver", $result);
                return $result;
                
            } catch (Exception $fallbackException) {
                Log::error("Both primary and fallback uploads failed", [
                    'primary_error' => $e->getMessage(),
                    'fallback_error' => $fallbackException->getMessage()
                ]);
                
                throw new Exception("Video upload failed: " . $fallbackException->getMessage());
            }
        }
    }

    /**
     * Enhanced chunked upload that can use S3 multipart for external storage
     */
    public function uploadChunkedVideo(array $chunks, string $fileName, string $folder = 'properties/videos'): array
    {
        $this->validateChunks($chunks);

        $filePath = $folder . '/' . $fileName;

        // Try multipart upload to primary driver (R2/S3) first
        if ($this->supportsMultipartUpload($this->primaryDriver)) {
            try {
                Log::info("Using S3 multipart upload for chunked video");
                return $this->uploadMultipartToS3($chunks, $filePath, $this->primaryDriver);
            } catch (Exception $e) {
                Log::warning("S3 multipart upload failed: " . $e->getMessage());
                // Fall through to local assembly method
            }
        }

        // Fallback to local assembly method
        return $this->uploadChunkedViaLocalAssembly($chunks, $fileName, $folder);
    }

    /**
     * Upload chunks directly to S3/R2 using multipart upload
     */
    protected function uploadMultipartToS3(array $chunks, string $filePath, string $driver): array
    {
        $disk = Storage::disk($driver);
        $config = config("filesystems.disks.{$driver}");
        
        // Create S3 client
        $s3Client = new S3Client([
            'version' => 'latest',
            'region' => $config['region'],
            'endpoint' => $config['endpoint'] ?? null,
            'use_path_style_endpoint' => $config['use_path_style_endpoint'] ?? false,
            'credentials' => [
                'key' => $config['key'],
                'secret' => $config['secret'],
            ],
        ]);

        $bucket = $config['bucket'];

        try {
            // Initialize multipart upload
            $result = $s3Client->createMultipartUpload([
                'Bucket' => $bucket,
                'Key' => $filePath,
                'ContentType' => $this->getMimeTypeFromChunks($chunks),
                'ACL' => 'public-read',
            ]);

            $uploadId = $result['UploadId'];
            $parts = [];
            $totalSize = 0;

            // Sort chunks by index
            usort($chunks, function ($a, $b) {
                return $a['index'] <=> $b['index'];
            });

            // Upload each chunk as a part
            foreach ($chunks as $chunk) {
                $chunkData = base64_decode($chunk['data']);
                $partNumber = $chunk['index'] + 1; // S3 part numbers start from 1
                $totalSize += strlen($chunkData);

                Log::info("Uploading part {$partNumber} to S3");

                $partResult = $s3Client->uploadPart([
                    'Bucket' => $bucket,
                    'Key' => $filePath,
                    'PartNumber' => $partNumber,
                    'UploadId' => $uploadId,
                    'Body' => $chunkData,
                ]);

                $parts[] = [
                    'PartNumber' => $partNumber,
                    'ETag' => $partResult['ETag'],
                ];
            }

            // Complete multipart upload
            $completeResult = $s3Client->completeMultipartUpload([
                'Bucket' => $bucket,
                'Key' => $filePath,
                'UploadId' => $uploadId,
                'MultipartUpload' => [
                    'Parts' => $parts,
                ],
            ]);

            Log::info("S3 multipart upload completed successfully");

            return [
                'driver' => $driver,
                'file_path' => $filePath,
                'url' => $disk->url($filePath),
                'size' => $totalSize,
                'mime_type' => $this->getMimeTypeFromChunks($chunks),
            ];

        } catch (Exception $e) {
            // Abort multipart upload on error
            if (isset($uploadId)) {
                try {
                    $s3Client->abortMultipartUpload([
                        'Bucket' => $bucket,
                        'Key' => $filePath,
                        'UploadId' => $uploadId,
                    ]);
                } catch (Exception $abortException) {
                    Log::error("Failed to abort multipart upload: " . $abortException->getMessage());
                }
            }

            throw $e;
        }
    }

    /**
     * Upload chunked video via local assembly (original method)
     */
    protected function uploadChunkedViaLocalAssembly(array $chunks, string $fileName, string $folder): array
    {
        $filePath = $folder . '/' . $fileName;
        $tempPath = storage_path('app/temp/' . $fileName);

        try {
            // Ensure temp directory exists
            $tempDir = dirname($tempPath);
            if (!is_dir($tempDir)) {
                mkdir($tempDir, 0755, true);
            }

            // Combine chunks
            $this->combineChunks($chunks, $tempPath);

            // Validate combined file
            $this->validateCombinedFile($tempPath);

            // Try to upload to primary driver
            try {
                Log::info("Uploading combined chunked file to primary driver");
                
                $result = $this->uploadFileFromPath($tempPath, $filePath, $this->primaryDriver);
                
                // Cleanup temp file
                unlink($tempPath);
                
                Log::info("Chunked video uploaded successfully to primary driver", $result);
                return $result;
                
            } catch (Exception $e) {
                Log::warning("Primary driver upload failed for chunked file: " . $e->getMessage());
                
                // Fallback to local storage
                $result = $this->uploadFileFromPath($tempPath, $filePath, $this->fallbackDriver);
                
                // Cleanup temp file
                unlink($tempPath);
                
                Log::info("Chunked video uploaded successfully to fallback driver", $result);
                return $result;
            }
            
        } catch (Exception $e) {
            // Cleanup temp file if it exists
            if (file_exists($tempPath)) {
                unlink($tempPath);
            }
            
            Log::error("Chunked video upload failed: " . $e->getMessage());
            throw new Exception("Chunked video upload failed: " . $e->getMessage());
        }
    }

    /**
     * Check if driver supports multipart upload
     */
    protected function supportsMultipartUpload(string $driver): bool
    {
        $s3CompatibleDrivers = ['s3', 'r2'];
        return in_array($driver, $s3CompatibleDrivers);
    }

    /**
     * Get MIME type from chunks (first chunk should contain file header)
     */
    protected function getMimeTypeFromChunks(array $chunks): string
    {
        // Sort chunks to get the first one
        usort($chunks, function ($a, $b) {
            return $a['index'] <=> $b['index'];
        });

        if (empty($chunks)) {
            return 'video/mp4'; // Default fallback
        }

        $firstChunkData = base64_decode($chunks[0]['data']);
        
        // Try to detect MIME type from first chunk
        $tempFile = tempnam(sys_get_temp_dir(), 'mime_detect');
        file_put_contents($tempFile, $firstChunkData);
        
        $mimeType = mime_content_type($tempFile);
        unlink($tempFile);
        
        return $mimeType ?: 'video/mp4';
    }

    /**
     * Enhanced direct chunked upload to S3 (stream chunks without local assembly)
     */
    public function uploadChunkedVideoStream(string $uploadId, array $chunkStreams, string $fileName, string $folder = 'properties/videos'): array
    {
        $filePath = $folder . '/' . $fileName;

        if ($this->supportsMultipartUpload($this->primaryDriver)) {
            try {
                Log::info("Using streaming S3 multipart upload");
                return $this->uploadStreamMultipartToS3($chunkStreams, $filePath, $this->primaryDriver);
            } catch (Exception $e) {
                Log::warning("Streaming S3 multipart upload failed: " . $e->getMessage());
            }
        }

        // Fallback to regular chunked upload
        throw new Exception("Streaming upload not supported for driver: " . $this->primaryDriver);
    }

    /**
     * Stream chunks directly to S3 without storing locally
     */
    protected function uploadStreamMultipartToS3(array $chunkStreams, string $filePath, string $driver): array
    {
        $disk = Storage::disk($driver);
        $config = config("filesystems.disks.{$driver}");
        
        $s3Client = new S3Client([
            'version' => 'latest',
            'region' => $config['region'],
            'endpoint' => $config['endpoint'] ?? null,
            'use_path_style_endpoint' => $config['use_path_style_endpoint'] ?? false,
            'credentials' => [
                'key' => $config['key'],
                'secret' => $config['secret'],
            ],
        ]);

        $bucket = $config['bucket'];

        // Use multipart uploader for streaming
        $uploader = new MultipartUploader($s3Client, $this->createStreamFromChunks($chunkStreams), [
            'bucket' => $bucket,
            'key' => $filePath,
            'ACL' => 'public-read',
        ]);

        try {
            $result = $uploader->upload();
            
            return [
                'driver' => $driver,
                'file_path' => $filePath,
                'url' => $disk->url($filePath),
                'size' => $this->calculateStreamSize($chunkStreams),
                'mime_type' => 'video/mp4', // Default for streaming
            ];
        } catch (MultipartUploadException $e) {
            Log::error("Multipart upload exception: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Create a stream resource from chunk streams
     */
    protected function createStreamFromChunks(array $chunkStreams): resource
    {
        $stream = fopen('php://temp', 'r+');
        
        foreach ($chunkStreams as $chunkStream) {
            stream_copy_to_stream($chunkStream, $stream);
        }
        
        rewind($stream);
        return $stream;
    }

    /**
     * Calculate total size from chunk streams
     */
    protected function calculateStreamSize(array $chunkStreams): int
    {
        $totalSize = 0;
        foreach ($chunkStreams as $chunkStream) {
            $stats = fstat($chunkStream);
            $totalSize += $stats['size'] ?? 0;
        }
        return $totalSize;
    }

    /**
     * Delete video from storage
     */
    public function deleteVideo(string $driver, string $filePath): bool
    {
        try {
            if ($driver === $this->primaryDriver || $driver === $this->fallbackDriver) {
                return Storage::disk($driver)->delete($filePath);
            }
            return false;
        } catch (Exception $e) {
            Log::error("Failed to delete video: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get video URL
     */
    public function getVideoUrl(string $driver, string $filePath): string
    {
        return Storage::disk($driver)->url($filePath);
    }

    /**
     * Upload to primary driver (Cloudflare R2)
     */
    protected function uploadToPrimaryDriver(UploadedFile $file, string $filePath): array
    {
        $url = Storage::disk($this->primaryDriver)->putFileAs(
            dirname($filePath),
            $file,
            basename($filePath),
            'public'
        );

        return [
            'driver' => $this->primaryDriver,
            'file_path' => $url,
            'url' => Storage::disk($this->primaryDriver)->url($url),
            'size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
        ];
    }

    /**
     * Upload to fallback driver (local with chunked support)
     */
    protected function uploadToFallbackDriver(UploadedFile $file, string $filePath): array
    {
        $url = Storage::disk($this->fallbackDriver)->putFileAs(
            dirname($filePath),
            $file,
            basename($filePath),
            'public'
        );

        return [
            'driver' => $this->fallbackDriver,
            'file_path' => $url,
            'url' => Storage::disk($this->fallbackDriver)->url($url),
            'size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
        ];
    }

    /**
     * Upload file from path
     */
    protected function uploadFileFromPath(string $tempPath, string $filePath, string $driver): array
    {
        $fileContents = file_get_contents($tempPath);
        $mimeType = mime_content_type($tempPath);
        $fileSize = filesize($tempPath);

        $success = Storage::disk($driver)->put($filePath, $fileContents, 'public');
        
        if (!$success) {
            throw new Exception("Failed to upload file to {$driver} driver");
        }

        return [
            'driver' => $driver,
            'file_path' => $filePath,
            'url' => Storage::disk($driver)->url($filePath),
            'size' => $fileSize,
            'mime_type' => $mimeType,
        ];
    }

    /**
     * Validate video file
     */
    protected function validateVideo(UploadedFile $file): void
    {
        if (!$file->isValid()) {
            throw new Exception("Invalid video file uploaded");
        }

        if ($file->getSize() > $this->maxFileSize) {
            throw new Exception("Video file size exceeds maximum allowed size of " . $this->formatBytes($this->maxFileSize));
        }

        if (!in_array($file->getMimeType(), $this->allowedMimeTypes)) {
            throw new Exception("Video file type not supported. Allowed types: " . implode(', ', $this->allowedMimeTypes));
        }
    }

    /**
     * Validate chunks array
     */
    protected function validateChunks(array $chunks): void
    {
        if (empty($chunks)) {
            throw new Exception("No chunks provided for upload");
        }

        foreach ($chunks as $index => $chunk) {
            if (!isset($chunk['data']) || !isset($chunk['index'])) {
                throw new Exception("Invalid chunk format at index {$index}");
            }
        }
    }

    /**
     * Combine chunks into single file
     */
    protected function combineChunks(array $chunks, string $outputPath): void
    {
        // Sort chunks by index
        usort($chunks, function ($a, $b) {
            return $a['index'] <=> $b['index'];
        });

        $outputHandle = fopen($outputPath, 'wb');
        if (!$outputHandle) {
            throw new Exception("Cannot create output file: {$outputPath}");
        }

        try {
            foreach ($chunks as $chunk) {
                $chunkData = base64_decode($chunk['data']);
                if ($chunkData === false) {
                    throw new Exception("Invalid base64 data in chunk {$chunk['index']}");
                }
                
                fwrite($outputHandle, $chunkData);
            }
        } finally {
            fclose($outputHandle);
        }
    }

    /**
     * Validate combined file
     */
    protected function validateCombinedFile(string $filePath): void
    {
        if (!file_exists($filePath)) {
            throw new Exception("Combined file does not exist");
        }

        $mimeType = mime_content_type($filePath);
        if (!in_array($mimeType, $this->allowedMimeTypes)) {
            throw new Exception("Combined file has invalid MIME type: {$mimeType}");
        }

        $fileSize = filesize($filePath);
        if ($fileSize > $this->maxFileSize) {
            throw new Exception("Combined file size exceeds maximum allowed size");
        }
    }

    /**
     * Generate unique filename
     */
    protected function generateFileName(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        return Str::uuid() . '.' . $extension;
    }

    /**
     * Format bytes to human readable format
     */
    protected function formatBytes(int $size): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $unitIndex = 0;
        
        while ($size >= 1024 && $unitIndex < count($units) - 1) {
            $size /= 1024;
            $unitIndex++;
        }
        
        return round($size, 2) . ' ' . $units[$unitIndex];
    }
}