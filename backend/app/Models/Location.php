<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    protected $fillable = [
        'name',
        'latitude',
        'longitude',
        'address',
        'image_url',
        'image_public_id',
    ];
    protected static function booted()
    {
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
