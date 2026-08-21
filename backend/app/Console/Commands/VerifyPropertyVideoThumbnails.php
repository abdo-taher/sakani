<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Property;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class VerifyPropertyVideoThumbnails extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'properties:verify-video-thumbnails
                            {--fix : Automatically fix missing or broken video thumbnails using YouTube posters or primary property images}
                            {--dry-run : Perform a dry run scan without modifying any database records}
                            {--force : Force updates in production environment}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verifies and fixes property video thumbnails (detects missing, broken 404, or unassigned video covers)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $fix = (bool) $this->option('fix');
        $dryRun = (bool) $this->option('dry-run');
        $force = (bool) $this->option('force');

        if (app()->environment('production') && $fix && !$dryRun && !$force) {
            $this->error('In production, please provide --force along with --fix to apply changes.');
            return self::FAILURE;
        }

        $this->info('Scanning properties with videos in the database...');
        $this->newLine();

        $properties = Property::with('images')
            ->where(function ($query) {
                $query->whereNotNull('video_url')
                    ->where('video_url', '!=', '');
            })
            ->get();

        if ($properties->isEmpty()) {
            $this->warn('No properties with video URLs found in the database.');
            return self::SUCCESS;
        }

        $tableRows = [];
        $stats = [
            'total' => $properties->count(),
            'valid' => 0,
            'fixed_youtube' => 0,
            'fixed_fallback' => 0,
            'broken' => 0,
            'missing' => 0,
        ];

        foreach ($properties as $property) {
            $videoUrl = (string) $property->getRawOriginal('video_url');
            $rawThumbnail = (string) $property->getRawOriginal('video_thumbnail_url');
            $resolvedThumbnail = (string) $property->video_thumbnail_url;
            $resolvedVideo = (string) $property->video_url;

            $status = 'UNKNOWN';
            $actionTaken = 'None';
            $proposedThumbnail = $rawThumbnail;

            $isYouTube = $this->isYouTubeUrl($videoUrl);
            $youtubeId = $isYouTube ? $this->extractYouTubeId($videoUrl) : null;

            // 1. YouTube Video Case
            if ($isYouTube && $youtubeId) {
                $expectedYtThumb = "https://img.youtube.com/vi/{$youtubeId}/hqdefault.jpg";
                
                if (empty($rawThumbnail) || !str_contains($rawThumbnail, $youtubeId)) {
                    $status = 'MISSING_YT_THUMBNAIL';
                    $proposedThumbnail = $expectedYtThumb;
                    if ($fix && !$dryRun) {
                        $property->video_thumbnail_url = $expectedYtThumb;
                        $property->save();
                        $status = 'FIXED_YOUTUBE';
                        $actionTaken = 'Generated YouTube poster';
                        $stats['fixed_youtube']++;
                    } else {
                        $stats['missing']++;
                    }
                } else {
                    $status = 'VALID_YOUTUBE';
                    $stats['valid']++;
                }
            } 
            // 2. Direct Video (R2 / Cloud / Local)
            else {
                $thumbnailValid = false;

                if (!empty($resolvedThumbnail)) {
                    $thumbnailValid = $this->verifyThumbnailAccessible($resolvedThumbnail, $rawThumbnail);
                }

                if ($thumbnailValid) {
                    $status = 'VALID';
                    $stats['valid']++;
                } else {
                    $status = empty($rawThumbnail) ? 'MISSING_THUMBNAIL' : 'BROKEN_404';
                    
                    // Fallback to first property photo if available
                    $fallbackImage = $this->findFallbackImage($property);
                    if ($fallbackImage) {
                        $proposedThumbnail = $fallbackImage;
                        if ($fix && !$dryRun) {
                            $property->video_thumbnail_url = $fallbackImage;
                            $property->save();
                            $status = 'FIXED_FALLBACK';
                            $actionTaken = 'Assigned primary photo as cover';
                            $stats['fixed_fallback']++;
                        } else {
                            $stats['missing']++;
                            $actionTaken = 'Fallback available: ' . $fallbackImage;
                        }
                    } else {
                        $stats['broken']++;
                        $actionTaken = 'No property image available';
                    }
                }
            }

            $tableRows[] = [
                'ID' => $property->id,
                'Title' => mb_strimwidth($property->title, 0, 25, '...'),
                'Type' => $isYouTube ? 'YouTube' : 'Direct/R2',
                'Video URL' => mb_strimwidth($resolvedVideo, 0, 35, '...'),
                'Thumbnail URL' => mb_strimwidth($proposedThumbnail ?: '(none)', 0, 35, '...'),
                'Status' => $status,
                'Action' => $actionTaken,
            ];
        }

        $this->table(
            ['ID', 'Title', 'Type', 'Video URL', 'Thumbnail URL', 'Status', 'Action'],
            $tableRows
        );

        $this->newLine();
        $this->info("=== Summary Statistics ===");
        $this->line("Total properties with videos: <comment>{$stats['total']}</comment>");
        $this->line("Valid & Accessible:           <info>{$stats['valid']}</info>");
        if ($fix && !$dryRun) {
            $this->line("Fixed with YouTube posters:   <info>{$stats['fixed_youtube']}</info>");
            $this->line("Fixed with Photo fallbacks:   <info>{$stats['fixed_fallback']}</info>");
        } else {
            $this->line("Missing / Unassigned:         <comment>{$stats['missing']}</comment>");
            $this->line("Broken / Unreachable:         <error>{$stats['broken']}</error>");
            if ($stats['missing'] > 0 || $stats['broken'] > 0) {
                $this->newLine();
                $this->warn("Run with `--fix` to automatically repair missing/broken thumbnails!");
            }
        }

        return self::SUCCESS;
    }

    /**
     * Check if a URL is a YouTube video
     */
    protected function isYouTubeUrl(string $url): bool
    {
        return (bool) preg_match('/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)/i', $url);
    }

    /**
     * Extract YouTube Video ID
     */
    protected function extractYouTubeId(string $url): ?string
    {
        if (preg_match('/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i', $url, $matches)) {
            return $matches[1];
        }
        return null;
    }

    /**
     * Verify if a thumbnail URL exists and is accessible
     */
    protected function verifyThumbnailAccessible(string $url, string $rawKey): bool
    {
        // 1. If it's a local storage path
        if (str_starts_with($rawKey, 'storage/') || str_starts_with($rawKey, '/storage/')) {
            $clean = preg_replace('#^/?storage/#', '', $rawKey);
            if (Storage::disk('public')->exists($clean)) {
                return true;
            }
        }

        // 2. If it's on R2 storage disk
        if (str_starts_with($rawKey, 'sakani/')) {
            try {
                if (config('filesystems.disks.r2.key') && Storage::disk('r2')->exists($rawKey)) {
                    return true;
                }
            } catch (\Throwable) {}
        }

        // 3. If it's a full HTTP/HTTPS URL
        if (preg_match('/^https?:\/\//i', $url)) {
            try {
                $response = Http::timeout(3)
                    ->withoutVerifying()
                    ->head($url);

                if ($response->successful()) {
                    return true;
                }

                // If HEAD method is rejected (e.g. 405), fallback to light GET
                if ($response->status() === 405 || $response->status() === 403) {
                    $getResponse = Http::timeout(3)
                        ->withoutVerifying()
                        ->withHeaders(['Range' => 'bytes=0-1024'])
                        ->get($url);
                    return $getResponse->successful();
                }
            } catch (\Throwable $e) {
                Log::debug("Thumbnail accessibility check failed for {$url}: " . $e->getMessage());
                return false;
            }
        }

        return false;
    }

    /**
     * Find a fallback image for the property
     */
    protected function findFallbackImage(Property $property): ?string
    {
        // Check primary image in relation
        $primary = $property->images->firstWhere('is_primary', true);
        if ($primary && !empty($primary->image_url)) {
            return $primary->image_url;
        }

        // Check first image in relation
        $first = $property->images->first();
        if ($first && !empty($first->image_url)) {
            return $first->image_url;
        }

        return null;
    }
}
