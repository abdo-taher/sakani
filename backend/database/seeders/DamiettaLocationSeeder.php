<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Location;

class DamiettaLocationSeeder extends Seeder
{
    public function run(): void
    {
        $locations = [
            [
                'id' => 2,
                'name' => 'شارع لبنان',
                'image_url' => 'https://res.cloudinary.com/mbspzmww/image/upload/v1784878608/sakani/locations/yid3petxmx3oq4weubjj.jpg',
            ],
            [
                'id' => 3,
                'name' => 'سكن مصر ١',
                'image_url' => 'https://res.cloudinary.com/mbspzmww/image/upload/v1784878688/sakani/locations/vthkdfihlqfpolxld1q9.jpg',
            ],
            [
                'id' => 5,
                'name' => 'منطقه ال ٢٧',
                'image_url' => 'https://res.cloudinary.com/mbspzmww/image/upload/v1784879717/sakani/locations/kfhcalltugiwrumurcke.jpg',
            ],
            [
                'id' => 6,
                'name' => 'منطقه ال ٢٨',
                'image_url' => 'https://res.cloudinary.com/mbspzmww/image/upload/v1784879730/sakani/locations/omn5z2xch03xypxmm9ed.jpg',
            ],
            [
                'id' => 7,
                'name' => 'شارع الامارات',
                'image_url' => 'https://res.cloudinary.com/mbspzmww/image/upload/v1784879767/sakani/locations/l4apuuh8m92amehmwzkf.jpg',
            ],
            [
                'id' => 8,
                'name' => 'الشاليهات خلف حورس',
                'image_url' => 'https://res.cloudinary.com/mbspzmww/image/upload/v1784879788/sakani/locations/maowyfllzbcdyykftgfq.jpg',
            ],
            [
                'id' => 9,
                'name' => 'الصعيدي القديم',
                'image_url' => 'https://res.cloudinary.com/mbspzmww/image/upload/v1784879798/sakani/locations/qwhqmssqm3n8mk6zgcfs.jpg',
            ],
            [
                'id' => 10,
                'name' => 'منطقه ال ٧٠ بجوار جامعه دمياط',
                'image_url' => 'https://res.cloudinary.com/mbspzmww/image/upload/v1784879821/sakani/locations/i626pkgz2dvkuic7ikw1.jpg',
            ],
            [
                'id' => 11,
                'name' => 'شارع المكتبه والصعيدي الجديد',
                'image_url' => 'https://res.cloudinary.com/mbspzmww/image/upload/v1784879836/sakani/locations/zjr3qbaqxc97dpcsrw5o.jpg',
            ],
            [
                'id' => 12,
                'name' => 'المركزيه',
                'image_url' => 'https://res.cloudinary.com/mbspzmww/image/upload/v1784879853/sakani/locations/x54ttjvpnxeqxv7pm97q.jpg',
            ],
            [
                'id' => 13,
                'name' => 'المستثمر أمام الموقف الغربي',
                'image_url' => 'https://res.cloudinary.com/mbspzmww/image/upload/v1784892561/sakani/locations/xmph1fktc5ncoh7izysj.jpg',
            ],
        ];

        foreach ($locations as $loc) {
            Location::updateOrCreate(
                ['id' => $loc['id']],
                [
                    'name' => $loc['name'],
                    'image_url' => $loc['image_url'],
                ]
            );
        }
    }
}
