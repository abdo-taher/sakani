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
            if (!Schema::hasColumn('properties', 'latitude')) {
                $table->decimal('latitude', 10, 8)->nullable()->after('location_id');
            }
            if (!Schema::hasColumn('properties', 'longitude')) {
                $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            }
            if (!Schema::hasColumn('properties', 'submission_status')) {
                $table->string('submission_status')->default('approved')->after('status');
            }
            if (!Schema::hasColumn('properties', 'submitter_name')) {
                $table->string('submitter_name')->nullable()->after('submission_status');
            }
            if (!Schema::hasColumn('properties', 'submitter_phone')) {
                $table->string('submitter_phone')->nullable()->after('submitter_name');
            }
            if (!Schema::hasColumn('properties', 'submitter_notes')) {
                $table->text('submitter_notes')->nullable()->after('submitter_phone');
            }
            if (!Schema::hasColumn('properties', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('submitter_notes');
            }
            if (!Schema::hasColumn('properties', 'admin_notes')) {
                $table->text('admin_notes')->nullable()->after('rejection_reason');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropColumn([
                'latitude',
                'longitude',
                'submission_status',
                'submitter_name',
                'submitter_phone',
                'submitter_notes',
                'rejection_reason',
                'admin_notes',
            ]);
        });
    }
};
