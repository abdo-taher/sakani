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
        if (!Schema::hasTable('feedback_campaigns')) {
            Schema::create('feedback_campaigns', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('type')->default('rating');
                $table->string('question');
                $table->json('options')->nullable();
                $table->string('target_page')->default('all');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('feedback_responses')) {
            Schema::create('feedback_responses', function (Blueprint $table) {
                $table->id();
                $table->string('campaign_id')->nullable();
                $table->string('campaign_title')->nullable();
                $table->string('client_name')->nullable();
                $table->string('client_phone')->nullable();
                $table->tinyInteger('rating')->nullable();
                $table->string('selected_option_id')->nullable();
                $table->string('selected_option_label')->nullable();
                $table->text('comment')->nullable();
                $table->string('page_url')->nullable();
                $table->string('device_type')->nullable();
                $table->string('ip_address')->nullable();
                $table->text('user_agent')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedback_responses');
        Schema::dropIfExists('feedback_campaigns');
    }
};
