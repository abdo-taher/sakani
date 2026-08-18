<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Exception;

class VideoUploadService
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
     * Upload chunked video file (for large files)
     */
    public function uploadChunkedVideo(array $chunks, string $fileName, string $folder = 'properties/videos'): array
    {
        $this->validateChunks($chunks);

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
        if ($driver === 'r2') {
            return (new R2MediaService())->getUrl($filePath);
        }
        return Storage::disk($driver)->url($filePath);
    }

    /**
     * Upload to primary driver (Cloudflare R2)
     */
    protected function uploadToPrimaryDriver(UploadedFile $file, string $filePath): array
    {
        $normalizedFolder = R2MediaService::normalizeFolder(dirname($filePath));
        $fileName = basename($filePath);

        $storedPath = Storage::disk($this->primaryDriver)->putFileAs(
            $normalizedFolder,
            $file,
            $fileName,
            'public'
        );

        $key = $storedPath ? R2MediaService::normalizeKey($storedPath) : ($normalizedFolder . '/' . $fileName);
        $url = (new R2MediaService())->getUrl($key);

        return [
            'driver' => $this->primaryDriver,
            'file_path' => $key,
            'url' => $url,
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