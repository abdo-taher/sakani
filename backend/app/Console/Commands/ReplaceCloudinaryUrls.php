<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

class ReplaceCloudinaryUrls extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'media:replace-cloudinary-urls
                            {--dry-run : Perform a dry run without modifying any database records}
                            {--force : Force execution in production environment}
                            {--public-url= : Override the Cloudflare R2 public base URL}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Safely replaces existing Cloudinary media URLs with Cloudflare R2 URLs in the database';

    /**
     * Known candidate media tables and columns to scan
     */
    protected array $knownMediaColumns = [
        'locations' => ['image_url'],
        'property_images' => ['image_url'],
        'room_images' => ['image_url'],
        'properties' => ['video_url'],
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        $isForce = $this->option('force');
        $customPublicUrl = $this->option('public-url');

        $this->info("==========================================================");
        $this->info("      Sakani Media Storage Migration: Cloudinary -> R2    ");
        $this->info("==========================================================");

        // Production safety guard
        if (app()->environment('production') && !$isDryRun && !$isForce) {
            $this->error('Refusing to run in production without --force option.');
            return self::FAILURE;
        }

        // Determine R2 Public Base URL
        $configuredUrl = config('filesystems.disks.r2.url') ?: env('R2_PUBLIC_URL', env('CLOUDFLARE_R2_PUBLIC_URL'));
        $r2PublicUrl = rtrim($customPublicUrl ?: ($configuredUrl ?: 'https://media.sakani.site'), '/');
        if (empty($configuredUrl) && empty($customPublicUrl)) {
            $this->warn("Note: R2_PUBLIC_URL is not set in .env. Using default: {$r2PublicUrl}");
            $this->warn("You can override this with: --public-url=https://your-r2-domain.com or setting R2_PUBLIC_URL in .env");
        }

        $this->line("Target R2 Public Base URL: <comment>{$r2PublicUrl}</comment>");
        $this->line("Mode: " . ($isDryRun ? "<fg=yellow;options=bold>DRY RUN (Read-Only)</>" : "<fg=green;options=bold>LIVE MIGRATION</>"));
        $this->newLine();

        // 1. Discover all tables and columns containing Cloudinary URLs
        $targetColumns = $this->discoverCloudinaryColumns();

        if (empty($targetColumns)) {
            $this->info("No Cloudinary URLs found in the database. All media URLs are already migrated!");
            return self::SUCCESS;
        }

        $totalCloudinaryCount = 0;
        $statsPerColumn = [];
        $sampleConversions = [];

        // 2. Process each table and column
        foreach ($targetColumns as $table => $columns) {
            foreach ($columns as $column) {
                $columnStats = $this->processColumn($table, $column, $r2PublicUrl, $isDryRun);
                $statsPerColumn["{$table}.{$column}"] = $columnStats['count'];
                $totalCloudinaryCount += $columnStats['count'];

                if (!empty($columnStats['samples'])) {
                    $sampleConversions["{$table}.{$column}"] = $columnStats['samples'];
                }
            }
        }

        $this->newLine();
        $this->info("--- Summary of Detected URLs ---");
        foreach ($statsPerColumn as $colName => $count) {
            $this->line("<info>{$colName}</info>: <comment>{$count}</comment>");
        }

        $this->newLine();
        $this->line("Total URLs to update: <fg=cyan;options=bold>{$totalCloudinaryCount}</>");
        $this->newLine();

        // Display sample conversions
        if (!empty($sampleConversions)) {
            $this->info("--- Sample URL Conversions ---");
            foreach ($sampleConversions as $colName => $samples) {
                $this->line("<options=underscore>{$colName}</> samples:");
                foreach ($samples as $sample) {
                    $this->line("  <fg=red>FROM:</> {$sample['old']}");
                    $this->line("  <fg=green>TO:  </> {$sample['new']}");
                    $this->newLine();
                }
            }
        }

        if ($isDryRun) {
            $this->info("==========================================================");
            $this->info(" DRY RUN - No database records were modified.");
            $this->info(" To execute the migration, run without --dry-run.");
            $this->info("==========================================================");
        } else {
            $this->info("==========================================================");
            $this->info(" SUCCESS: All {$totalCloudinaryCount} Cloudinary URLs have been updated to R2.");
            $this->info("==========================================================");
        }

        return self::SUCCESS;
    }

    /**
     * Convert a Cloudinary URL to a Cloudflare R2 URL preserving the object path.
     *
     * Example input:
     * https://fa2563a8d14a805b9e8ff652de6e51cf.r2.cloudflarestorage.com/mbspzmww/image/upload/v1784878608/sakani/locations/yid3petxmx3oq4weubjj.jpg
     *
     * Example output:
     * https://media.sakani.site/sakani/locations/yid3petxmx3oq4weubjj.jpg
     */
    public function convertCloudinaryUrlToR2(string $url, string $r2PublicUrl): ?string
    {
        // Must contain cloudinary or res.cloudinary.com
        if (!str_contains($url, 'cloudinary.com') && !str_contains($url, 'res.cloudinary.com')) {
            return null;
        }

        $cleanBase = preg_replace('#/sakani$#i', '', rtrim($r2PublicUrl, '/'));

        // Regex explanation:
        // Match protocol and domain: https?://res\.cloudinary\.com/[^/]+/(?:image|video|raw)/upload/
        // Optional transformations: (?:(?:[a-z]_[^/,]+,?)+/)?
        // Optional version segment: (?:v\d+/)?
        // Capture remaining object path: (.+)
        $pattern = '#https?://res\.cloudinary\.com/[^/]+/(?:image|video|raw)/upload/(?:(?:[a-z0-9]_[^/,]+,?)+/)?(?:v\d+/)?(.+)#i';

        if (preg_match($pattern, $url, $matches)) {
            $objectKey = \App\Services\R2MediaService::normalizeKey($matches[1]);
            return $cleanBase . '/' . $objectKey;
        }

        // Fallback for non-standard Cloudinary URLs containing /sakani/...
        if (preg_match('#/(sakani/.+)$#i', $url, $matches)) {
            $objectKey = \App\Services\R2MediaService::normalizeKey($matches[1]);
            return $cleanBase . '/' . $objectKey;
        }

        return null;
    }

    /**
     * Discover all tables and columns containing Cloudinary URLs in database
     */
    protected function discoverCloudinaryColumns(): array
    {
        $discovered = [];

        // Check known columns first
        foreach ($this->knownMediaColumns as $table => $columns) {
            if (Schema::hasTable($table)) {
                foreach ($columns as $column) {
                    if (Schema::hasColumn($table, $column)) {
                        $count = DB::table($table)->where($column, 'LIKE', '%fa2563a8d14a805b9e8ff652de6e51cf.r2.cloudflarestorage.com%')->count();
                        if ($count > 0) {
                            $discovered[$table][] = $column;
                        }
                    }
                }
            }
        }

        // Also inspect all remaining tables/columns dynamically
        try {
            $tables = DB::select('SHOW TABLES');
            $dbName = DB::getDatabaseName();
            $key = 'Tables_in_' . $dbName;

            foreach ($tables as $tableObj) {
                $table = $tableObj->$key ?? null;
                if (!$table) continue;

                $columns = Schema::getColumnListing($table);
                foreach ($columns as $column) {
                    // Skip if already in discovered list
                    if (isset($discovered[$table]) && in_array($column, $discovered[$table])) {
                        continue;
                    }

                    try {
                        $count = DB::table($table)->where($column, 'LIKE', '%fa2563a8d14a805b9e8ff652de6e51cf.r2.cloudflarestorage.com%')->count();
                        if ($count > 0) {
                            $discovered[$table][] = $column;
                        }
                    } catch (\Throwable $e) {
                        // Skip binary/non-searchable columns
                    }
                }
            }
        } catch (\Throwable $e) {
            // If dynamic scan fails, use known columns
        }

        return $discovered;
    }

    /**
     * Process a specific table column using chunking for performance and safety
     */
    protected function processColumn(string $table, string $column, string $r2PublicUrl, bool $isDryRun): array
    {
        $samples = [];
        $count = 0;

        // Determine primary key for chunkById
        $primaryKey = 'id';
        $hasPrimaryKey = Schema::hasColumn($table, $primaryKey);

        if ($hasPrimaryKey) {
            $query = DB::table($table)
                ->where($column, 'LIKE', '%fa2563a8d14a805b9e8ff652de6e51cf.r2.cloudflarestorage.com%')
                ->orderBy($primaryKey);

            $query->chunkById(100, function ($rows) use ($table, $column, $r2PublicUrl, $isDryRun, &$count, &$samples, $primaryKey) {
                if (!$isDryRun) {
                    DB::beginTransaction();
                }

                try {
                    foreach ($rows as $row) {
                        $oldUrl = $row->$column;
                        $newUrl = $this->convertCloudinaryUrlToR2($oldUrl, $r2PublicUrl);

                        if ($newUrl && $newUrl !== $oldUrl) {
                            $count++;

                            if (count($samples) < 3) {
                                $samples[] = [
                                    'old' => $oldUrl,
                                    'new' => $newUrl,
                                ];
                            }

                            if (!$isDryRun) {
                                DB::table($table)
                                    ->where($primaryKey, $row->$primaryKey)
                                    ->update([$column => $newUrl]);
                            }
                        }
                    }

                    if (!$isDryRun) {
                        DB::commit();
                    }
                } catch (\Throwable $e) {
                    if (!$isDryRun) {
                        DB::rollBack();
                    }
                    Log::error("Error updating {$table}.{$column}: " . $e->getMessage());
                    throw $e;
                }
            }, $primaryKey);
        } else {
            // Fallback for tables without standard integer id
            $rows = DB::table($table)->where($column, 'LIKE', '%fa2563a8d14a805b9e8ff652de6e51cf.r2.cloudflarestorage.com%')->get();
            foreach ($rows as $row) {
                $oldUrl = $row->$column;
                $newUrl = $this->convertCloudinaryUrlToR2($oldUrl, $r2PublicUrl);

                if ($newUrl && $newUrl !== $oldUrl) {
                    $count++;

                    if (count($samples) < 3) {
                        $samples[] = [
                            'old' => $oldUrl,
                            'new' => $newUrl,
                        ];
                    }

                    if (!$isDryRun) {
                        DB::table($table)
                            ->where($column, $oldUrl)
                            ->update([$column => $newUrl]);
                    }
                }
            }
        }

        return [
            'count' => $count,
            'samples' => $samples,
        ];
    }
}
