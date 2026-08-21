<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            if (!Schema::hasColumn('properties', 'address')) {
                $table->string('address')->nullable()->after('location_id');
            }
            if (!Schema::hasColumn('properties', 'is_negotiable')) {
                $table->boolean('is_negotiable')->default(false)->after('price');
            }
        });
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $columns = array_values(array_filter(
                ['address', 'is_negotiable'],
                fn (string $column) => Schema::hasColumn('properties', $column)
            ));
            if ($columns) {
                $table->dropColumn($columns);
            }
        });
    }
};
