<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Services\R2MediaService;

class FixR2MediaUrls extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'media:fix-r2-urls
                            {--dry-run : Perform a dry run without modifying any database records}
                            {--verify-r2 : Verify object existence in R2 via network before fixing}
                            {--force : Force execution in production environment}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fixes duplicated sakani/ path prefixes and updates Cloudflare R2 media URLs stored in the database';

    /**
     * Known primary candidate tables and columns
     */
    protected array $knownMediaColumns = [
        'locations' => ['image_url', 'image'],
        'property_images' => ['image_url', 'image_path'],
        'room_images' => ['image_url', 'image_path'],
        'properties' => ['video_url', 'video_thumbnail_url', 'main_image'],
        'settings' => ['value'],
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        $verifyR2 = $this->option('verify-r2');
        $isForce = $this->option('force');

        $r2PublicUrl = rtrim(config('filesystems.disks.r2.url', 'https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev'), '/');
        $r2PublicUrl = preg_replace('#/sakani$#i', '', $r2PublicUrl);

        // Production safety guard
        if (app()->environment('production') && !$isDryRun && !$isForce) {
            $this->error('Refusing to modify production without --force.');
            return self::FAILURE;
        }

        $this->line("Target R2 public base URL:");
        $this->line("<comment>{$r2PublicUrl}</comment>");
        $this->newLine();
        $this->info("Scanning database...");
        $this->newLine();

        // Discover all target tables & columns
        $targetColumns = $this->discoverTargetColumns();

        $totalMalformed = 0;
        $totalSafeToFix = 0;
        $totalMissingInR2 = 0;
        $totalAlreadyCorrect = 0;

        $statsPerColumn = [];
        $sampleConversions = [];
        $recordsToUpdate = [];

        foreach ($targetColumns as $table => $columns) {
            foreach ($columns as $column) {
                $columnStats = $this->processColumn($table, $column, $r2PublicUrl, $verifyR2);

                $statsPerColumn["{$table}.{$column}"] = $columnStats;
                $totalMalformed += $columnStats['malformed'];
                $totalSafeToFix += $columnStats['safe_to_fix'];
                $totalMissingInR2 += $columnStats['missing_in_r2'];
                $totalAlreadyCorrect += $columnStats['already_correct'];

                if (!empty($columnStats['samples'])) {
                    $sampleConversions["{$table}.{$column}"] = $columnStats['samples'];
                }

                if (!empty($columnStats['to_update'])) {
                    $recordsToUpdate["{$table}.{$column}"] = [
                        'table' => $table,
                        'column' => $column,
                        'records' => $columnStats['to_update'],
                    ];
                }
            }
        }

        // Print column breakdowns matching specification
        foreach ($statsPerColumn as $colName => $stats) {
            $this->line("<info>{$colName}:</info>");
            $this->line("  Already correct:   <fg=cyan>{$stats['already_correct']}</>");
            $this->line("  Safe to fix:       <fg=green>{$stats['safe_to_fix']}</>");
            if ($verifyR2) {
                $this->line("  Missing R2 object: <fg=red>{$stats['missing_in_r2']}</>");
            }
            $this->newLine();
        }

        $this->info("Total:");
        $this->line("  Already correct:    <fg=cyan;options=bold>{$totalAlreadyCorrect}</>");
        $this->line("  Safe to fix:        <fg=green;options=bold>{$totalSafeToFix}</>");
        if ($verifyR2) {
            $this->line("  Missing R2 objects: <fg=red;options=bold>{$totalMissingInR2}</>");
        }
        $this->newLine();

        // Display sample conversions
        if (!empty($sampleConversions)) {
            $this->info("Sample conversions:");
            foreach ($sampleConversions as $colName => $samples) {
                foreach ($samples as $sample) {
                    $this->line("<fg=yellow>OLD:</>");
                    $this->line($sample['old']);
                    $this->line("<fg=green>NEW:</>");
                    $this->line($sample['new']);
                    $this->line("<fg=cyan>R2 object key:</>");
                    $this->line($sample['key']);
                    $this->line("<fg=blue>STATUS:</>");
                    $this->line($sample['status']);
                    $this->newLine();
                }
            }
        }

        // Perform update if not dry-run
        // Perform update if not dry-run
        if (!$isDryRun) {
            if ($totalSafeToFix === 0) {
                $this->info("No records require updating.");
                return self::SUCCESS;
            }

            $updatedCount = 0;
            DB::beginTransaction();
            try {
                foreach ($recordsToUpdate as $group) {
                    $table = $group['table'];
                    $column = $group['column'];
                    foreach ($group['records'] as $item) {
                        DB::table($table)
                            ->where('id', $item['id'])
                            ->update([$column => $item['new_url']]);
                        $updatedCount++;
                    }
                }
                DB::commit();

                $this->info("==========================================================");
                $this->info(" SUCCESS: Updated {$updatedCount} media URLs to canonical format.");
                $this->info("==========================================================");
            } catch (\Throwable $e) {
                DB::rollBack();
                $this->error("Failed to update database records: " . $e->getMessage());
                return self::FAILURE;
            }
        } else {
            $this->info("DRY RUN - No database records modified.");
        }

        return self::SUCCESS;
    }

    /**
     * Check if a URL needs normalization
     */
    public function isMalformedUrl(string $url, string $targetBaseUrl): bool
    {
        if (empty($url)) {
            return false;
        }

        // Check if string contains media URL format
        if (!str_contains($url, 'http://') && !str_contains($url, 'https://')) {
            return false;
        }

        $normalized = R2MediaService::normalizeUrl($url, $targetBaseUrl);
        return $normalized !== $url;
    }

    /**
     * Process a specific column for broken R2 URLs and verify object existence
     */
    protected function processColumn(string $table, string $column, string $targetBaseUrl, bool $verifyR2 = false): array
    {
        $rows = DB::table($table)
            ->whereNotNull($column)
            ->where($column, '!=', '')
            ->select('id', $column)
            ->get();

        $malformed = 0;
        $safeToFix = 0;
        $missingInR2 = 0;
        $alreadyCorrect = 0;
        $samples = [];
        $toUpdate = [];

        foreach ($rows as $row) {
            $url = (string)$row->{$column};

            $isMalformed = $this->isMalformedUrl($url, $targetBaseUrl);

            if ($isMalformed) {
                $malformed++;
                $normalizedUrl = R2MediaService::normalizeUrl($url, $targetBaseUrl);
                $normalizedKey = R2MediaService::normalizeKey(parse_url($url, PHP_URL_PATH) ?: $url);

                $objectExists = true;
                if ($verifyR2) {
                    try {
                        $objectExists = Storage::disk('r2')->exists($normalizedKey);
                    } catch (\Throwable $e) {
                        Log::warning("R2 check error for key {$normalizedKey}: " . $e->getMessage());
                        $objectExists = false;
                    }
                }

                if ($objectExists) {
                    $safeToFix++;
                    $toUpdate[] = [
                        'id' => $row->id,
                        'old_url' => $url,
                        'new_url' => $normalizedUrl,
                        'key' => $normalizedKey,
                    ];

                    if (count($samples) < 3) {
                        $samples[] = [
                            'old' => $url,
                            'new' => $normalizedUrl,
                            'key' => $normalizedKey,
                            'status' => 'SAFE',
                        ];
                    }
                } else {
                    $missingInR2++;
                    Log::warning("Normalized R2 key missing for row id {$row->id} in {$table}.{$column}: {$normalizedKey}");
                    if (count($samples) < 3) {
                        $samples[] = [
                            'old' => $url,
                            'new' => $normalizedUrl,
                            'key' => $normalizedKey,
                            'status' => 'NEEDS REVIEW / OBJECT NOT FOUND IN R2',
                        ];
                    }
                }
            } else {
                if (str_contains($url, 'r2.dev') || str_contains($url, 'sakani/')) {
                    $alreadyCorrect++;
                }
            }
        }

        return [
            'malformed' => $malformed,
            'safe_to_fix' => $safeToFix,
            'missing_in_r2' => $missingInR2,
            'already_correct' => $alreadyCorrect,
            'samples' => $samples,
            'to_update' => $toUpdate,
        ];
    }

    /**
     * Discover all tables and columns that contain media URLs
     */
    protected function discoverTargetColumns(): array
    {
        $discovered = [];

        // Check known columns
        foreach ($this->knownMediaColumns as $table => $columns) {
            if (Schema::hasTable($table)) {
                foreach ($columns as $column) {
                    if (Schema::hasColumn($table, $column)) {
                        $discovered[$table][] = $column;
                    }
                }
            }
        }

        // Discover any additional columns containing media.sakani.site or r2.dev or sakani/
        try {
            $allTables = DB::select('SHOW TABLES');
            $dbName = DB::getDatabaseName();
            $tableKey = 'Tables_in_' . $dbName;

            foreach ($allTables as $tObj) {
                $tbl = $tObj->$tableKey;
                $cols = Schema::getColumnListing($tbl);
                foreach ($cols as $col) {
                    if (isset($discovered[$tbl]) && in_array($col, $discovered[$tbl])) {
                        continue;
                    }
                    try {
                        $hasMedia = DB::table($tbl)
                            ->where($col, 'LIKE', '%media.sakani.site%')
                            ->orWhere($col, 'LIKE', '%r2.dev%')
                            ->orWhere($col, 'LIKE', '%sakani/sakani%')
                            ->exists();
                        if ($hasMedia) {
                            $discovered[$tbl][] = $col;
                        }
                    } catch (\Throwable $e) {}
                }
            }
        } catch (\Throwable $e) {}

        return $discovered;
    }
}
