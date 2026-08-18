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
            if (!Schema::hasColumn('properties', 'audience_type')) {
                $table->string('audience_type', 50)->default('families')->nullable()->after('furnishing')->index();
            }
            if (!Schema::hasColumn('properties', 'video_thumbnail_url')) {
                $table->string('video_thumbnail_url', 1000)->nullable()->after('video_url');
            }
            if (!Schema::hasColumn('properties', 'video_thumbnail_public_id')) {
                $table->string('video_thumbnail_public_id', 500)->nullable()->after('video_thumbnail_url');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            if (Schema::hasColumn('properties', 'audience_type')) {
                $table->dropColumn('audience_type');
            }
            if (Schema::hasColumn('properties', 'video_thumbnail_url')) {
                $table->dropColumn('video_thumbnail_url');
            }
            if (Schema::hasColumn('properties', 'video_thumbnail_public_id')) {
                $table->dropColumn('video_thumbnail_public_id');
            }
        });
    }
};
