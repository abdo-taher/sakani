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
        Schema::table('property_images', function (Blueprint $table) {
            $table->integer('sort_order')->default(0)->after('image_public_id');
            $table->string('image_type')->default('property')->after('sort_order'); // property, balcony, kitchen, bathroom, etc.
            $table->string('caption')->nullable()->after('image_type');
            $table->boolean('is_primary')->default(false)->after('caption'); // Main property image
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('property_images', function (Blueprint $table) {
            $table->dropColumn(['sort_order', 'image_type', 'caption', 'is_primary']);
        });
    }
};
