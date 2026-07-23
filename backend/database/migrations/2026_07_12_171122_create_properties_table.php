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
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->string('title');

    $table->text('description');

    $table->decimal('price', 12, 2);


    $table->foreignId('category_id')
          ->constrained()
          ->cascadeOnDelete();

          $table->foreignId('property_type_id')
      ->constrained()
      ->cascadeOnDelete();

      
    $table->foreignId('location_id')
          ->constrained()
          ->cascadeOnDelete();

    $table->integer('area');

    $table->integer('rooms');

    $table->integer('bathrooms');

    $table->integer('floor')->nullable();
     $table->integer('balconies')->nullable();

$table->string('rent_duration')->nullable();

  $table->string('video_url')->nullable();

$table->string('video_public_id')->nullable();

    $table->enum('finishing', [
        'super_lux',
        'lux',
        'semi_finished',
        'red_brick'
    ]);

    $table->enum('furnishing', [
        'furnished',
        'unfurnished'
    ]);

    $table->enum('status', [
    'available',
    'reserved',
    'sold',
    'rented'
])->default('available');
    $table->boolean('featured')->default(false);

    $table->integer('views')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};
