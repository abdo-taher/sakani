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
            if (!Schema::hasColumn('properties', 'has_offer')) {
                $table->boolean('has_offer')->default(false)->after('price');
            }
            if (!Schema::hasColumn('properties', 'offer_price')) {
                $table->decimal('offer_price', 12, 2)->nullable()->after('has_offer');
            }
            if (!Schema::hasColumn('properties', 'offer_discount_percentage')) {
                $table->unsignedSmallInteger('offer_discount_percentage')->nullable()->after('offer_price');
            }
            if (!Schema::hasColumn('properties', 'offer_start_date')) {
                $table->date('offer_start_date')->nullable()->after('offer_discount_percentage');
            }
            if (!Schema::hasColumn('properties', 'offer_end_date')) {
                $table->date('offer_end_date')->nullable()->after('offer_start_date');
            }
            if (!Schema::hasColumn('properties', 'offer_title')) {
                $table->string('offer_title')->nullable()->after('offer_end_date');
            }
            if (!Schema::hasColumn('properties', 'offer_badge')) {
                $table->string('offer_badge', 100)->nullable()->after('offer_title');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $columns = [
                'has_offer',
                'offer_price',
                'offer_discount_percentage',
                'offer_start_date',
                'offer_end_date',
                'offer_title',
                'offer_badge',
            ];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('properties', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
