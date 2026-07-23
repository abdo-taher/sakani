<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NeedRequest extends Model
{
    protected $fillable = [
        'name',
        'phone',
        'listing_type',
       'property_type',
       'location',
        'budget',
        'area',
        'rooms',
        'rent_duration',
        'notes',
        'status',
    ];

    

    
}