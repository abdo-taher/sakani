<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Location;

class EgyptLocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $egyptGovernorates = [
            ['name' => 'القاهرة', 'latitude' => 30.0444, 'longitude' => 31.2357, 'address' => 'محافظة القاهرة، مصر'],
            ['name' => 'الجيزة', 'latitude' => 30.0131, 'longitude' => 31.2089, 'address' => 'محافظة الجيزة، مصر'],
            ['name' => 'الإسكندرية', 'latitude' => 31.2001, 'longitude' => 29.9187, 'address' => 'محافظة الإسكندرية، مصر'],
            ['name' => 'الشرقية', 'latitude' => 30.7327, 'longitude' => 31.7195, 'address' => 'محافظة الشرقية، مصر'],
            ['name' => 'المنوفية', 'latitude' => 30.5972, 'longitude' => 30.9876, 'address' => 'محافظة المنوفية، مصر'],
            ['name' => 'القليوبية', 'latitude' => 30.1792, 'longitude' => 31.2045, 'address' => 'محافظة القليوبية، مصر'],
            ['name' => 'البحيرة', 'latitude' => 30.8481, 'longitude' => 30.3436, 'address' => 'محافظة البحيرة، مصر'],
            ['name' => 'الغربية', 'latitude' => 30.8754, 'longitude' => 31.0335, 'address' => 'محافظة الغربية، مصر'],
            ['name' => 'المنيا', 'latitude' => 28.0871, 'longitude' => 30.7618, 'address' => 'محافظة المنيا، مصر'],
            ['name' => 'بني سويف', 'latitude' => 29.0661, 'longitude' => 31.0994, 'address' => 'محافظة بني سويف، مصر'],
            ['name' => 'الفيوم', 'latitude' => 29.3084, 'longitude' => 30.8428, 'address' => 'محافظة الفيوم، مصر'],
            ['name' => 'أسيوط', 'latitude' => 27.1809, 'longitude' => 31.1837, 'address' => 'محافظة أسيوط، مصر'],
            ['name' => 'سوهاج', 'latitude' => 26.5569, 'longitude' => 31.6948, 'address' => 'محافظة سوهاج، مصر'],
            ['name' => 'قنا', 'latitude' => 26.1551, 'longitude' => 32.7160, 'address' => 'محافظة قنا، مصر'],
            ['name' => 'الأقصر', 'latitude' => 25.6872, 'longitude' => 32.6396, 'address' => 'محافظة الأقصر، مصر'],
            ['name' => 'أسوان', 'latitude' => 24.0889, 'longitude' => 32.8998, 'address' => 'محافظة أسوان، مصر'],
            ['name' => 'البحر الأحمر', 'latitude' => 26.0618, 'longitude' => 33.8116, 'address' => 'محافظة البحر الأحمر، مصر'],
            ['name' => 'الوادي الجديد', 'latitude' => 25.4515, 'longitude' => 30.5428, 'address' => 'محافظة الوادي الجديد، مصر'],
            ['name' => 'مطروح', 'latitude' => 31.3543, 'longitude' => 27.2373, 'address' => 'محافظة مطروح، مصر'],
            ['name' => 'شمال سيناء', 'latitude' => 30.2824, 'longitude' => 33.6176, 'address' => 'محافظة شمال سيناء، مصر'],
            ['name' => 'جنوب سيناء', 'latitude' => 28.4593, 'longitude' => 33.9715, 'address' => 'محافظة جنوب سيناء، مصر'],
            ['name' => 'دمياط', 'latitude' => 31.4165, 'longitude' => 31.8133, 'address' => 'محافظة دمياط، مصر'],
            ['name' => 'كفر الشيخ', 'latitude' => 31.1107, 'longitude' => 30.9388, 'address' => 'محافظة كفر الشيخ، مصر'],
            ['name' => 'الدقهلية', 'latitude' => 31.0409, 'longitude' => 31.3785, 'address' => 'محافظة الدقهلية، مصر'],
            ['name' => 'الإسماعيلية', 'latitude' => 30.5965, 'longitude' => 32.2715, 'address' => 'محافظة الإسماعيلية، مصر'],
            ['name' => 'بورسعيد', 'latitude' => 31.2653, 'longitude' => 32.3020, 'address' => 'محافظة بورسعيد، مصر'],
            ['name' => 'السويس', 'latitude' => 29.9668, 'longitude' => 32.5498, 'address' => 'محافظة السويس، مصر'],
        ];

        foreach ($egyptGovernorates as $governorate) {
            Location::updateOrCreate(
                ['name' => $governorate['name']],
                $governorate
            );
        }
    }
}