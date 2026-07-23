<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class CleanupTempVideos extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'videos:cleanup {--force : Force cleanup without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up temporary video files and expired chunks';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting video cleanup...');

        $cleaned = 0;

        // Clean up temporary files older than configured TTL
        $tempTtl = config('video_upload.cleanup.temp_file_ttl', 3600);
        $cutoffTime = Carbon::now()->subSeconds($tempTtl);

        // Clean up temp directory
        $tempPath = storage_path('app/temp');
        if (is_dir($tempPath)) {
            $cleaned += $this->cleanupDirectory($tempPath, $cutoffTime);
        }

        // Clean up temp chunks directory
        $chunksPath = storage_path('app/temp/chunks');
        if (is_dir($chunksPath)) {
            $cleaned += $this->cleanupDirectory($chunksPath, $cutoffTime);
        }

        // Clean up expired upload chunks from cache
        $this->cleanupExpiredCacheChunks();

        $this->info("Cleanup completed. Removed {$cleaned} files/directories.");

        return Command::SUCCESS;
    }

    /**
     * Clean up files in a directory older than cutoff time
     */
    private function cleanupDirectory(string $directory, Carbon $cutoffTime): int
    {
        $cleaned = 0;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($directory, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($iterator as $file) {
            $fileTime = Carbon::createFromTimestamp($file->getMTime());
            
            if ($fileTime->lt($cutoffTime)) {
                if ($file->isDir()) {
                    if ($this->isDirEmpty($file->getPathname())) {
                        rmdir($file->getPathname());
                        $cleaned++;
                        $this->line("Removed empty directory: {$file->getPathname()}");
                    }
                } else {
                    unlink($file->getPathname());
                    $cleaned++;
                    $this->line("Removed file: {$file->getPathname()}");
                }
            }
        }

        return $cleaned;
    }

    /**
     * Clean up expired cache chunks
     */
    private function cleanupExpiredCacheChunks(): void
    {
        // Note: This is a basic implementation
        // In production, you might want to implement a more sophisticated cleanup
        // based on your caching strategy (Redis patterns, database records, etc.)
        
        $this->info('Cache cleanup completed (automatic expiration handled by cache driver)');
    }

    /**
     * Check if directory is empty
     */
    private function isDirEmpty(string $dir): bool
    {
        $handle = opendir($dir);
        while (false !== ($entry = readdir($handle))) {
            if ($entry != "." && $entry != "..") {
                closedir($handle);
                return false;
            }
        }
        closedir($handle);
        return true;
    }
}
