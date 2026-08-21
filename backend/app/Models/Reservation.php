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

    protected $appends = [
        'client_name',
        'client_phone',
        'property_title',
        'property_ref',
        'room_name',
    ];

    public function getClientNameAttribute()
    {
        return $this->name;
    }

    public function getClientPhoneAttribute()
    {
        return $this->phone;
    }

    public function getPropertyTitleAttribute()
    {
        return $this->property ? $this->property->title : null;
    }

    public function getPropertyRefAttribute()
    {
        return $this->property?->ref_id ?? ($this->property_id ? "SK-{$this->property_id}" : null);
    }

    public function getRoomNameAttribute()
    {
        return $this->room ? $this->room->name : null;
    }

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
