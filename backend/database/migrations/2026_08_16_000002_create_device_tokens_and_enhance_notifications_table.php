<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create device_tokens table for FCM push notifications
        if (!Schema::hasTable('device_tokens')) {
            Schema::create('device_tokens', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->string('phone', 25)->nullable()->index();
                $table->string('token', 500)->unique();
                $table->string('device_type', 50)->default('web'); // web, android, ios
                $table->timestamp('last_used_at')->nullable();
                $table->timestamps();

                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            });
        }

        // 2. Enhance notifications table for customer & admin targeting
        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table) {
                if (!Schema::hasColumn('notifications', 'recipient_type')) {
                    $table->string('recipient_type', 30)->default('admin')->after('type')->index();
                }
                if (!Schema::hasColumn('notifications', 'recipient_id')) {
                    $table->unsignedBigInteger('recipient_id')->nullable()->after('recipient_type')->index();
                }
                if (!Schema::hasColumn('notifications', 'customer_phone')) {
                    $table->string('customer_phone', 25)->nullable()->after('recipient_id')->index();
                }
                if (!Schema::hasColumn('notifications', 'entity_type')) {
                    $table->string('entity_type', 50)->nullable()->after('customer_phone');
                }
                if (!Schema::hasColumn('notifications', 'entity_id')) {
                    $table->unsignedBigInteger('entity_id')->nullable()->after('entity_type');
                }
                if (!Schema::hasColumn('notifications', 'data')) {
                    $table->json('data')->nullable()->after('link');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('device_tokens');

        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table) {
                $columns = ['recipient_type', 'recipient_id', 'customer_phone', 'entity_type', 'entity_id', 'data'];
                foreach ($columns as $col) {
                    if (Schema::hasColumn('notifications', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
