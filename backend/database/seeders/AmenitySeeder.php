<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Amenity;

class AmenitySeeder extends Seeder
{
    public function run(): void
    {
        $amenities = [
            ['name' => 'مكيفات', 'icon' => 'snowflake'],
            ['name' => 'مطبخ مجهز', 'icon' => 'chef-hat'],
            ['name' => 'غرف نوم', 'icon' => 'bed-double'],
            ['name' => 'شرفة', 'icon' => 'balcony'],
            ['name' => 'موقف سيارات', 'icon' => 'car'],
            ['name' => 'أمن 24/7', 'icon' => 'shield'],
            ['name' => 'حمام سباحة', 'icon' => 'waves'],
            ['name' => 'نادي صحي', 'icon' => 'dumbbell'],
            ['name' => 'مساحات خضراء', 'icon' => 'trees'],
            ['name' => 'محلات تجارية', 'icon' => 'store'],
            ['name' => 'مسجد', 'icon' => 'landmark'],
            ['name' => 'مدارس', 'icon' => 'graduation-cap'],
            ['name' => 'مصعد', 'icon' => 'arrow-up-down'],
            ['name' => 'كهرباء UPS', 'icon' => 'zap'],
            ['name' => 'خزان مياه', 'icon' => 'droplets'],
            ['name' => 'إنترنت', 'icon' => 'wifi'],
        ];

        foreach ($amenities as $amenity) {
            Amenity::updateOrCreate(
                ['name' => $amenity['name']],
                $amenity
            );
        }
    }
}
