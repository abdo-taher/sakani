<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // For SQLite compatibility, we'll use Laravel's schema builder
        if (DB::getDriverName() === 'sqlite') {
            // Check if table exists and has the expected structure
            if (Schema::hasTable('reservations')) {
                // Get current table columns
                $columns = DB::select("PRAGMA table_info(reservations)");
                $columnNames = collect($columns)->pluck('name')->toArray();
                
                // Check if we need to update the status column
                $hasStatus = in_array('status', $columnNames);
                
                if ($hasStatus) {
                    // Simple approach: just ensure status can accept our values
                    // SQLite is flexible with text values, so we don't need to recreate the table
                    echo "✅ Reservations table already exists with compatible structure\n";
                } else {
                    echo "⚠️ Reservations table exists but needs status column\n";
                    Schema::table('reservations', function (Blueprint $table) {
                        $table->string('status')->default('pending');
                    });
                }
            } else {
                // Create table if it doesn't exist
                Schema::create('reservations', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('property_id');
                    $table->string('guest_name');
                    $table->string('guest_phone');
                    $table->string('guest_email')->nullable();
                    $table->text('message')->nullable();
                    $table->date('check_in_date');
                    $table->date('check_out_date')->nullable();
                    $table->integer('guests_count')->default(1);
                    $table->string('status')->default('pending');
                    $table->timestamps();
                    
                    $table->foreign('property_id')->references('id')->on('properties')->onDelete('cascade');
                });
            }
        } else {
            // MySQL/PostgreSQL syntax
            DB::statement("
                ALTER TABLE reservations
                MODIFY status
                ENUM('pending','contacted')
                NOT NULL
                DEFAULT 'pending'
            ");
        }
    }

    public function down(): void
    {
        // For rollback, we'll keep it simple for SQLite
        if (DB::getDriverName() === 'sqlite') {
            // Don't do anything destructive in rollback for SQLite
            echo "⚠️ SQLite rollback skipped to preserve data\n";
        } else {
            DB::statement("
                ALTER TABLE reservations
                MODIFY status
                ENUM('pending','accepted','rejected')
                NOT NULL
                DEFAULT 'pending'
            ");
        }
    }
};