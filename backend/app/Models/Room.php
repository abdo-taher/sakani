<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    protected $fillable = [
        'property_id',
        'name',
        'description',
        'price',
        'area',
        'status',
        'is_uploading',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_uploading' => 'boolean',
    ];

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function roomImages()
    {
        return $this->hasMany(RoomImage::class)->orderBy('sort_order');
    }

    public function reservation()
    {
        return $this->hasOne(Reservation::class);
    }

    public function primaryImage()
    {
        return $this->hasOne(RoomImage::class)->where('is_primary', true);
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    protected static function booted()
    {
        static::saved(function ($room) {
            \App\Helpers\CacheHelper::clearPropertyCaches();
        });

        static::deleted(function ($room) {
            \App\Helpers\CacheHelper::clearPropertyCaches();
        });
    }
}
