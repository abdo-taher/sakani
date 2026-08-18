<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    protected $fillable = [
        'property_id',
        'room_id',
        'name',
        'phone',
        'message',
        'status',
    ];

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    protected static function booted()
    {
        static::saved(function ($res) {
            \App\Helpers\CacheHelper::clearStatsCaches();
        });

        static::deleted(function ($res) {
            \App\Helpers\CacheHelper::clearStatsCaches();
        });
    }
}
