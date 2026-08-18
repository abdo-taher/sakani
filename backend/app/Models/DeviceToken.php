<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeviceToken extends Model
{
    protected $fillable = [
        'user_id',
        'phone',
        'token',
        'device_type',
        'last_used_at',
    ];

    protected $casts = [
        'last_used_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForAdmins($query)
    {
        return $query->whereNotNull('user_id')->orWhereNull('phone');
    }

    public function scopeForPhone($query, string $phone)
    {
        return $query->where('phone', $phone);
    }
}
