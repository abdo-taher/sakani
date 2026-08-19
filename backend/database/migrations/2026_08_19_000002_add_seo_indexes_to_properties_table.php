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
            // Composite indexes for fast public catalog queries and filters
            $table->index(['status', 'submission_status', 'is_uploading'], 'idx_props_public_status');
            $table->index(['location_id', 'status', 'is_uploading'], 'idx_props_location_status');
            $table->index(['category_id', 'status', 'is_uploading'], 'idx_props_category_status');
            $table->index(['property_type_id', 'status', 'is_uploading'], 'idx_props_type_status');
            $table->index(['audience_type', 'status', 'is_uploading'], 'idx_props_audience_status');
            $table->index(['featured', 'status', 'is_uploading'], 'idx_props_featured_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropIndex('idx_props_public_status');
            $table->dropIndex('idx_props_location_status');
            $table->dropIndex('idx_props_category_status');
            $table->dropIndex('idx_props_type_status');
            $table->dropIndex('idx_props_audience_status');
            $table->dropIndex('idx_props_featured_status');
        });
    }
};
