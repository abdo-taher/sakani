<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Exception;

class R2MediaService
{
    protected string $disk;
    protected ?string $publicUrl;

    public function __construct()
    {
        $this->disk = config('filesystems.media_disk', 'r2');
        $this->publicUrl = config('filesystems.disks.r2.url', 'https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev');
    }

    /**
     * Get the active storage disk instance
     */
    public function getStorageDisk()
    {
        return Storage::disk($this->disk);
    }

    /**
     * Check if R2 is configured
     */
    public function isConfigured(): bool
    {
        if ($this->disk !== 'r2') {
            return true;
        }

        return $this->missingConfigurationKeys() === [];
    }

    /** Return safe configuration labels only; never return credential values. */
    public function missingConfigurationKeys(): array
    {
        $required = [
            'access_key' => config('filesystems.disks.r2.key'),
            'secret_key' => config('filesystems.disks.r2.secret'),
            'bucket' => config('filesystems.disks.r2.bucket'),
            'endpoint_or_account_id' => config('filesystems.disks.r2.endpoint'),
            'public_url' => config('filesystems.disks.r2.url'),
        ];

        return array_keys(array_filter($required, fn ($value) => empty($value)));
    }

    /**
     * Normalize an R2 object key to ensure the canonical format:
     * sakani/{category}/{filename}
     *
     * Strips leading slashes and any repeated 'sakani/' prefixes,
     * ensuring exactly ONE 'sakani/' prefix at the root.
     *
     * Examples:
     * 'sakani/locations/a.jpg'              -> 'sakani/locations/a.jpg'
     * 'sakani/sakani/locations/a.jpg'       -> 'sakani/locations/a.jpg'
     * 'sakani/sakani/sakani/locations/a.jpg' -> 'sakani/locations/a.jpg'
     * '/sakani/sakani/properties/v.mp4'     -> 'sakani/properties/v.mp4'
     * 'locations/a.jpg'                     -> 'sakani/locations/a.jpg'
     */
    public static function normalizeKey(string $key): string
    {
        $clean = ltrim(trim($key), '/');
        // Collapse any leading sequence of 'sakani/'
        $clean = preg_replace('#^(sakani/)+#i', '', $clean);

        return 'sakani/' . $clean;
    }

    /**
     * Normalize folder path before uploading, ensuring it begins with 'sakani/' exactly once.
     */
    public static function normalizeFolder(string $folder): string
    {
        $clean = ltrim(trim($folder), '/');
        $clean = preg_replace('#^(sakani/)+#i', '', $clean);

        return 'sakani/' . $clean;
    }

    /**
     * Normalize an entire public media URL to the configured public R2 base URL
     * and collapse any repeated '/sakani/' in the path to exactly one.
     *
     * Examples:
     * 'https://media.sakani.site/sakani/sakani/locations/a.jpg'
     *   -> 'https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev/sakani/locations/a.jpg'
     *
     * 'https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev/sakani/sakani/properties/videos/a.mp4'
     *   -> 'https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev/sakani/properties/videos/a.mp4'
     */
    public static function normalizeUrl(string $url, ?string $targetBaseUrl = null): string
    {
        if (empty($url)) {
            return $url;
        }

        $base = rtrim($targetBaseUrl ?: config('filesystems.disks.r2.url', 'https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev'), '/');
        $base = preg_replace('#/sakani$#i', '', $base);

        // 1. If it's on media.sakani.site, r2.dev, or r2.cloudflarestorage.com
        if (preg_match('#^https?://(?:media\.sakani\.site|[^/]+\.r2\.dev|[^/]+\.r2\.cloudflarestorage\.com)(?:/sakani)*/(.+)#i', $url, $matches)) {
            $subPath = preg_replace('#^(sakani/)+#i', '', ltrim($matches[1], '/'));
            return $base . '/sakani/' . $subPath;
        }

        // 2. If it's a Cloudinary URL with /sakani/...
        if (preg_match('#https?://res\.cloudinary\.com/[^/]+/(?:image|video|raw)/upload/(?:(?:[a-z0-9]_[^/,]+,?)+/)?(?:v\d+/)?(?:sakani/)?(.+)#i', $url, $matches)) {
            $subPath = preg_replace('#^(sakani/)+#i', '', ltrim($matches[1], '/'));
            return $base . '/sakani/' . $subPath;
        }

        // 3. If it contains duplicate /sakani/ on any domain
        if (preg_match('#^(https?://[^/]+)(?:/sakani){2,}/(.+)#i', $url, $matches)) {
            $subPath = preg_replace('#^(sakani/)+#i', '', ltrim($matches[2], '/'));
            return $base . '/sakani/' . $subPath;
        }

        return $url;
    }

    /**
     * Centralized public URL generator.
     * R2_PUBLIC_URL + "/" + canonical_key
     *
     * Example:
     * key: sakani/properties/videos/example.mp4
     * URL: https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev/sakani/properties/videos/example.mp4
     */
    public function publicUrl(string $key): string
    {
        return $this->getUrl($key);
    }

    /**
     * Generate the canonical public URL for an R2 object key.
     */
    public function getUrl(string $key): string
    {
        $normalizedKey = self::normalizeKey($key);
        if ($this->disk !== 'r2') {
            return Storage::disk($this->disk)->url($normalizedKey);
        }
        $publicBase = rtrim($this->publicUrl ?: config('filesystems.disks.r2.url', 'https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev'), '/');
        // Strip trailing /sakani from base if present to prevent duplication
        $publicBase = preg_replace('#/sakani$#i', '', $publicBase);

        if (!empty($publicBase)) {
            return $publicBase . '/' . $normalizedKey;
        }

        return Storage::disk('r2')->url($normalizedKey);
    }

    /**
     * Upload an image file to Cloudflare R2
     *
     * @param UploadedFile $file
     * @param string $folder e.g. 'sakani/properties/images'
     * @return array
     */
    public function uploadImage(UploadedFile $file, string $folder = 'sakani/properties/images'): array
    {
        return $this->uploadFile($file, $folder);
    }

    /**
     * Upload a video file to Cloudflare R2
     *
     * @param UploadedFile $file
     * @param string $folder e.g. 'sakani/properties/videos'
     * @return array
     */
    public function uploadVideo(UploadedFile $file, string $folder = 'sakani/properties/videos'): array
    {
        return $this->uploadFile($file, $folder);
    }

    /**
     * Upload any file to Cloudflare R2 preserving canonical key structure
     *
     * @param UploadedFile $file
     * @param string $folder e.g. 'sakani/properties/images'
     * @return array
     */
    public function uploadFile(UploadedFile $file, string $folder = 'sakani/properties/images'): array
    {
        $canonicalFolder = self::normalizeFolder($folder);
        $extension = $file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'bin';
        $fileName = Str::random(24) . '.' . strtolower($extension);

        $targetDisk = $this->disk;
        if ($targetDisk === 'r2' && !$this->isConfigured()) {
            Log::warning(
                'Cloudflare R2 storage is not fully configured (Missing: ' .
                implode(', ', $this->missingConfigurationKeys()) .
                '). Falling back to local public disk.'
            );
            $targetDisk = 'public';
        }

        try {
            $storage = Storage::disk($targetDisk);
            // Put file on active disk
            $storedPath = $storage->putFileAs(
                $canonicalFolder,
                $file,
                $fileName
            );

            if (!$storedPath) {
                throw new Exception("The storage driver ({$targetDisk}) did not persist the uploaded file.");
            }

            if ($targetDisk === 'r2') {
                $key = self::normalizeKey($storedPath);
                if (!$storage->exists($key)) {
                    throw new Exception("Uploaded object could not be verified on {$targetDisk}: {$key}");
                }
                $url = $this->publicUrl($key);
            } else {
                $key = self::normalizeKey($storedPath);
                $url = $storage->url($storedPath);
                if (!str_starts_with($url, 'http://') && !str_starts_with($url, 'https://')) {
                    $appUrl = rtrim(config('app.url', 'https://api.sakani.site'), '/');
                    $url = $appUrl . '/' . ltrim($url, '/');
                }
            }

            Log::info("File uploaded successfully to disk [{$targetDisk}]: {$key}");

            return [
                'success' => true,
                'url' => $url,
                'key' => $key,
                'file_path' => $key,
                'public_id' => $key,
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'original_name' => $file->getClientOriginalName(),
                'storage_disk' => $targetDisk,
            ];
        } catch (Exception $e) {
            Log::error("Failed to upload file to disk [{$targetDisk}]: " . $e->getMessage(), [
                'folder' => $canonicalFolder,
                'original_name' => $file->getClientOriginalName(),
            ]);

            throw $e;
        }
    }

    /**
     * Extract the canonical R2 object key from a full public URL or return normalized key
     */
    public function extractKeyFromUrl(string $urlOrKey): string
    {
        // If it's already an object key like 'sakani/properties/images/abc.jpg'
        if (!str_starts_with($urlOrKey, 'http://') && !str_starts_with($urlOrKey, 'https://')) {
            return self::normalizeKey($urlOrKey);
        }

        $parsed = parse_url($urlOrKey, PHP_URL_PATH);
        if ($parsed) {
            $path = ltrim($parsed, '/');
            return self::normalizeKey($path);
        }

        return self::normalizeKey(basename($urlOrKey));
    }

    /**
     * Delete an object from Cloudflare R2
     *
     * @param string $keyOrUrl Object key or full URL
     * @return bool
     */
    public function delete(string $keyOrUrl): bool
    {
        if (empty($keyOrUrl)) {
            return false;
        }

        try {
            $objectKey = $this->extractKeyFromUrl($keyOrUrl);
            
            if (empty($objectKey)) {
                return false;
            }

            Log::info("Deleting object from R2: {$objectKey}");
            return Storage::disk('r2')->delete($objectKey);
        } catch (Exception $e) {
            Log::warning("Failed to delete object from R2 ({$keyOrUrl}): " . $e->getMessage());
            return false;
        }
    }
}
