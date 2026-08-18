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
}
