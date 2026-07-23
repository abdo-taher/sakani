<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // For SQLite compatibility, we'll use Laravel's schema builder
        if (DB::getDriverName() === 'sqlite') {
            // SQLite doesn't support MODIFY, so we create a new table and copy data
            Schema::create('reservations_new', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('property_id');
                $table->string('guest_name');
                $table->string('guest_phone');
                $table->string('guest_email')->nullable();
                $table->text('message')->nullable();
                $table->date('check_in_date');
                $table->date('check_out_date')->nullable();
                $table->integer('guests_count')->default(1);
                $table->enum('status', ['pending', 'contacted'])->default('pending');
                $table->timestamps();
                
                $table->foreign('property_id')->references('id')->on('properties')->onDelete('cascade');
            });
            
            // Copy existing data
            DB::statement('INSERT INTO reservations_new SELECT id, property_id, guest_name, guest_phone, guest_email, message, check_in_date, check_out_date, guests_count, CASE WHEN status IN ("pending", "contacted") THEN status ELSE "pending" END, created_at, updated_at FROM reservations');
            
            // Drop old table and rename new one
            Schema::dropIfExists('reservations');
            Schema::rename('reservations_new', 'reservations');
        } else {
            // MySQL/PostgreSQL syntax
            DB::statement("
                ALTER TABLE reservations
                MODIFY status
                ENUM('pending','contacted')
                NOT NULL
                DEFAULT 'pending'
            ");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            // Revert SQLite changes
            Schema::create('reservations_old', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('property_id');
                $table->string('guest_name');
                $table->string('guest_phone');
                $table->string('guest_email')->nullable();
                $table->text('message')->nullable();
                $table->date('check_in_date');
                $table->date('check_out_date')->nullable();
                $table->integer('guests_count')->default(1);
                $table->enum('status', ['pending', 'accepted', 'rejected'])->default('pending');
                $table->timestamps();
                
                $table->foreign('property_id')->references('id')->on('properties')->onDelete('cascade');
            });
            
            DB::statement('INSERT INTO reservations_old SELECT * FROM reservations');
            Schema::dropIfExists('reservations');
            Schema::rename('reservations_old', 'reservations');
        } else {
            DB::statement("
                ALTER TABLE reservations
                MODIFY status
                ENUM('pending','accepted','rejected')
                NOT NULL
                DEFAULT 'pending'
            ");
        }
    }
};