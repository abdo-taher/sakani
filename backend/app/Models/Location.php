<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'latitude',
        'longitude',
        'address',
        'image_url',
        'image_public_id',
        'seo_title',
        'seo_description',
    ];

    protected static function booted()
    {
        static::saving(function ($location) {
            if (empty($location->slug) && !empty($location->name)) {
                $cleanName = preg_replace('/[^\p{Arabic}\p{L}\p{N}\s-]/u', '', (string)$location->name);
                $clean = preg_replace('/[\s-]+/', '-', trim($cleanName));
                $clean = trim($clean, '-');
                $id = $location->id ?: rand(10, 99);
                $location->slug = $clean ? "{$id}-{$clean}" : (string)$id;
            }
        });

        static::saved(function ($location) {
            \App\Helpers\CacheHelper::clearLocationCaches();
        });

        static::deleted(function ($location) {
            \App\Helpers\CacheHelper::clearLocationCaches();
        });
    }

    public function properties()
    {
        return $this->hasMany(Property::class);
    }

    /**
     * Ensure image_url is always returned as a full public CDN URL
     */
    public function getImageUrlAttribute($value)
    {
        if (empty($value)) return $value;
        if (preg_match('/^(https?:\/\/|\/\/|data:|blob:)/i', $value)) {
            return $value;
        }
        $r2Url = rtrim(config('filesystems.disks.r2.url', 'https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev'), '/');
        $clean = ltrim($value, '/');
        if (str_starts_with($clean, 'sakani/')) {
            return "{$r2Url}/{$clean}";
        }
        if (str_starts_with($clean, 'storage/')) {
            return url($clean);
        }
        return "{$r2Url}/sakani/{$clean}";
    }
}
