<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VisitorLog extends Model
{
    protected $fillable = [
        'ip',
        'path',
        'user_agent',
        'country',
        'city',
    ];

    protected $hidden = [
        'user_agent',
    ];
}
