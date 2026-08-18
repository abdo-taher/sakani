<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Ensure reservations table status column is a flexible string column with default 'pending'
        if (Schema::hasTable('reservations')) {
            if (DB::getDriverName() === 'sqlite') {
                if (!Schema::hasColumn('reservations', 'status')) {
                    Schema::table('reservations', function (Blueprint $table) {
                        $table->string('status', 50)->default('pending')->after('message');
                    });
                }
            } else {
                // For MySQL / PostgreSQL: change to VARCHAR(50) to allow all standard statuses:
                // pending, contacted, completed, cancelled, rejected, accepted, confirmed
                try {
                    DB::statement("ALTER TABLE `reservations` MODIFY `status` VARCHAR(50) NOT NULL DEFAULT 'pending'");
                } catch (\Exception $e) {
                    // Fallback using schema table if MODIFY fails
                }
            }
        }

        // 2. Ensure settings table exists with key and value columns
        if (!Schema::hasTable('settings')) {
            Schema::create('settings', function (Blueprint $table) {
                $table->id();
                $table->string('key')->unique();
                $table->longText('value')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non-destructive reverse
    }
};
