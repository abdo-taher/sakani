<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tag;
use Illuminate\Support\Str;

class TagSeeder extends Seeder
{
    public function run(): void
    {
        $tags = [
            'فيو بحيرات',
            'فيو نهر',
            'فيو حديقة',
            'دور أرضي',
            'بلكونة كبيرة',
            'تشطيب سوبر لوكس',
            'مؤثث بالكامل',
            'قريب من الخدمات',
            'قريب من الجامعة',
            'قريب من السوق',
            'موقع مميز',
            'عقار جديد',
            'بدون عمولة',
            'عمولة قليلة',
            'مناسب للعائلات',
            'مناسب للمستثمرين',
            'دوبلكس',
            'بنتهاوس',
            'ستوديو',
            'محلق سكني',
        ];

        foreach ($tags as $name) {
            Tag::updateOrCreate(
                ['name' => $name],
                ['name' => $name, 'slug' => Str::slug($name)]
            );
        }
    }
}
