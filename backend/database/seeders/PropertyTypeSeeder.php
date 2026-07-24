<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PropertyType;
use App\Models\Category;

class PropertyTypeSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'rent' => 'إيجار',
            'buy' => 'شراء',
            'sell' => 'بيع',
        ];

        $types = [
            'شقة',
            'فيلا',
            'دوبلكس',
            'بنتهاوس',
            'ستوديو',
            'محل تجاري',
            'أرض',
            'محلق سكني',
        ];

        foreach ($categories as $slug => $catName) {
            $category = Category::where('slug', $slug)->first();
            if (!$category) continue;

            foreach ($types as $typeName) {
                PropertyType::updateOrCreate(
                    ['category_id' => $category->id, 'name' => $typeName],
                    ['category_id' => $category->id, 'name' => $typeName]
                );
            }
        }
    }
}
