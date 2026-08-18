<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoomImage extends Model
{
    protected $fillable = [
        'room_id',
        'image_url',
        'image_public_id',
        'media_type',
        'sort_order',
        'is_primary',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function room()
    {
        return $this->belongsTo(Room::class);
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
