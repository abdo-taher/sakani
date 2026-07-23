<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {

            if (Schema::hasColumn('properties', 'video')) {
                $table->dropColumn('video');
            }

            if (!Schema::hasColumn('properties', 'video_url')) {
                $table->string('video_url')->nullable()->after('rent_duration');
            }

            if (!Schema::hasColumn('properties', 'video_public_id')) {
                $table->string('video_public_id')->nullable()->after('video_url');
            }

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {

            if (Schema::hasColumn('properties', 'video_url')) {
                $table->dropColumn('video_url');
            }

            if (Schema::hasColumn('properties', 'video_public_id')) {
                $table->dropColumn('video_public_id');
            }

            if (!Schema::hasColumn('properties', 'video')) {
                $table->string('video')->nullable()->after('rent_duration');
            }

        });
    }
};