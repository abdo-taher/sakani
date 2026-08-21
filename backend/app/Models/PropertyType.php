<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Category;
use App\Models\Property;

class PropertyType extends Model
{
    protected $appends = ['slug'];

    protected $fillable = [
        'category_id',
        'name'
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function properties()
    {
        return $this->hasMany(Property::class);
    }

    public function getSlugAttribute(): string
    {
        $name = mb_strtolower(trim((string) $this->name));
        $types = [
            'apartment' => ['شقة'],
            'villa' => ['فيلا'],
            'duplex' => ['دوبلكس'],
            'penthouse' => ['بنتهاوس'],
            'studio' => ['ستوديو', 'استوديو'],
            'shop' => ['محل'],
            'land' => ['أرض', 'ارض'],
            'office' => ['مكتب'],
            'chalet' => ['شاليه'],
            'building' => ['عمارة', 'مبنى', 'محلق'],
        ];

        foreach ($types as $slug => $needles) {
            foreach ($needles as $needle) {
                if (str_contains($name, $needle)) {
                    return $slug;
                }
            }
        }

        return 'type-' . $this->id;
    }
}
