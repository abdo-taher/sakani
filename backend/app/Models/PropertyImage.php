<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PropertyImage extends Model
{
    protected $fillable = [
        'property_id',
        'image_url',
        'image_public_id',
        'media_type',
        'sort_order',
        'image_type',
        'caption',
        'is_primary',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'sort_order' => 'integer',
    ];

    // Define image types
    const IMAGE_TYPES = [
        'property' => 'عام',
        'balcony' => 'البلكونات',
        'kitchen' => 'المطبخ',
        'bathroom' => 'الحمام',
        'bedroom' => 'غرف النوم',
        'living_room' => 'غرفة المعيشة',
        'dining_room' => 'غرفة الطعام',
        'exterior' => 'الخارج',
        'parking' => 'موقف السيارات',
        'other' => 'أخرى',
    ];

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    /**
     * Get the image type label in Arabic
     */
    public function getImageTypeLabelAttribute(): string
    {
        return self::IMAGE_TYPES[$this->image_type] ?? $this->image_type;
    }

    /**
     * Scope to get images by type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('image_type', $type);
    }

    /**
     * Scope to get primary image
     */
    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }

    /**
     * Scope to order by sort order (primary image always first)
     */
    public function scopeOrdered($query)
    {
        return $query->orderByDesc('is_primary')->orderBy('sort_order', 'asc')->orderBy('created_at', 'asc');
    }

    protected static function booted()
    {
        static::saved(function ($image) {
            \App\Helpers\CacheHelper::clearPropertyCaches();
        });

        static::deleted(function ($image) {
            \App\Helpers\CacheHelper::clearPropertyCaches();
        });
    }
}