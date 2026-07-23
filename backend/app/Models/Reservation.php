<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    protected $fillable = [
        'property_id',
        'name',
        'phone',
        'message',
        'status'
    ];

    public function property()
    {
        return $this->belongsTo(Property::class);
    }
}