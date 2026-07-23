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
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
                $table->foreignId('property_id')
          ->constrained()
          ->cascadeOnDelete();

    $table->string('name');

    $table->string('phone');

    $table->text('message')->nullable();

    $table->enum('status', [
    'pending',
    'contacted'
])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
