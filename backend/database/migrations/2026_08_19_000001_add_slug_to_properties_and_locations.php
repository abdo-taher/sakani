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
        if (!Schema::hasColumn('properties', 'slug')) {
            Schema::table('properties', function (Blueprint $table) {
                $table->string('slug')->nullable()->after('title')->index();
                $table->string('seo_title')->nullable()->after('description');
                $table->text('seo_description')->nullable()->after('seo_title');
            });
        }

        if (!Schema::hasColumn('locations', 'slug')) {
            Schema::table('locations', function (Blueprint $table) {
                $table->string('slug')->nullable()->after('name')->index();
                $table->string('seo_title')->nullable()->after('address');
                $table->text('seo_description')->nullable()->after('seo_title');
            });
        }

        // Populate slugs for existing properties
        $properties = DB::table('properties')->select('id', 'title')->get();
        foreach ($properties as $prop) {
            $cleanTitle = preg_replace('/[^\p{Arabic}\p{L}\p{N}\s-]/u', '', (string)$prop->title);
            $clean = preg_replace('/[\s-]+/', '-', trim($cleanTitle));
            $clean = trim($clean, '-');
            $slug = $clean ? "{$prop->id}-{$clean}" : (string)$prop->id;
            
            DB::table('properties')->where('id', $prop->id)->update([
                'slug' => $slug
            ]);
        }

        // Populate slugs for existing locations
        $locations = DB::table('locations')->select('id', 'name')->get();
        foreach ($locations as $loc) {
            $cleanName = preg_replace('/[^\p{Arabic}\p{L}\p{N}\s-]/u', '', (string)$loc->name);
            $clean = preg_replace('/[\s-]+/', '-', trim($cleanName));
            $clean = trim($clean, '-');
            $slug = $clean ? "{$loc->id}-{$clean}" : (string)$loc->id;

            DB::table('locations')->where('id', $loc->id)->update([
                'slug' => $slug
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('properties', 'slug')) {
            Schema::table('properties', function (Blueprint $table) {
                $table->dropColumn(['slug', 'seo_title', 'seo_description']);
            });
        }

        if (Schema::hasColumn('locations', 'slug')) {
            Schema::table('locations', function (Blueprint $table) {
                $table->dropColumn(['slug', 'seo_title', 'seo_description']);
            });
        }
    }
};
