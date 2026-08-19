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
        if (Schema::hasTable('feedback_campaigns')) {
            Schema::table('feedback_campaigns', function (Blueprint $table) {
                if (!Schema::hasColumn('feedback_campaigns', 'start_date')) {
                    $table->dateTime('start_date')->nullable()->after('target_page');
                }
                if (!Schema::hasColumn('feedback_campaigns', 'end_date')) {
                    $table->dateTime('end_date')->nullable()->after('start_date');
                }
                if (!Schema::hasColumn('feedback_campaigns', 'delay_seconds')) {
                    $table->integer('delay_seconds')->default(60)->after('end_date');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('feedback_campaigns')) {
            Schema::table('feedback_campaigns', function (Blueprint $table) {
                if (Schema::hasColumn('feedback_campaigns', 'start_date')) {
                    $table->dropColumn('start_date');
                }
                if (Schema::hasColumn('feedback_campaigns', 'end_date')) {
                    $table->dropColumn('end_date');
                }
                if (Schema::hasColumn('feedback_campaigns', 'delay_seconds')) {
                    $table->dropColumn('delay_seconds');
                }
            });
        }
    }
};
