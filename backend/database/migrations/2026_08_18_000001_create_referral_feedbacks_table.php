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
        Schema::create('referral_feedbacks', function (Blueprint $table) {
            $table->id();
            $table->string('source_key', 50)->index(); // facebook, instagram, tiktok, friend_recommendation, etc.
            $table->string('source_label', 100);       // User-friendly Arabic name
            $table->text('custom_note')->nullable();   // Optional write-in or details
            $table->string('phone', 25)->nullable()->index();
            $table->string('device_type', 30)->nullable()->default('web'); // mobile, desktop, tablet
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('referral_feedbacks');
    }
};
