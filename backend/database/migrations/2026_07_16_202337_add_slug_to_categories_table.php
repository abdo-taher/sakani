<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('name');
        });

        DB::table('categories')->where('name', 'إيجار')->update(['slug' => 'rent']);
        DB::table('categories')->where('name', 'شراء')->update(['slug' => 'buy']);
        DB::table('categories')->where('name', 'بيع')->update(['slug' => 'sell']);
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};