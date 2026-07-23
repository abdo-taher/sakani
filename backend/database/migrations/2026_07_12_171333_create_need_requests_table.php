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
        Schema::create('need_requests', function (Blueprint $table) {

    $table->id();

    // بيانات العميل
    $table->string('name');
    $table->string('phone');

    // نوع الطلب
    $table->enum('listing_type', [
        'buy',
        'rent'
    ]);

   $table->string('property_type');

    // المنطقة
   $table->string('location');

    // الميزانية
    $table->decimal('budget', 12, 2);

    // المساحة
    $table->integer('area')->nullable();

    // عدد الغرف
    $table->integer('rooms')->nullable();

    // مدة الإيجار (للإيجار فقط)
    $table->string('rent_duration')->nullable();

    // ملاحظات
    $table->text('notes')->nullable();

    // حالة الطلب
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
        Schema::dropIfExists('need_requests');
    }
};
