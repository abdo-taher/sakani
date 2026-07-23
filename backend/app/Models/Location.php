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
    ];
    public function properties()
{
    return $this->hasMany(Property::class);
}
}
