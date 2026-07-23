<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        Category::updateOrCreate(
            ['slug' => 'rent'],
            [
                'name' => 'إيجار',
                'icon' => null,
            ]
        );

        Category::updateOrCreate(
            ['slug' => 'buy'],
            [
                'name' => 'شراء',
                'icon' => null,
            ]
        );

        Category::updateOrCreate(
            ['slug' => 'sell'],
            [
                'name' => 'بيع',
                'icon' => null,
            ]
        );
    }
}