<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Category;
use App\Models\Location;
use App\Models\PropertyImage;
use App\Models\Amenity;
use App\Models\PropertyType;
use App\Models\User;

class Property extends Model
{
    protected $fillable = [
        'title',
        'description',
        'price',
        'category_id',
        'property_type_id',
        'location_id',
        'rent_duration',
        'area',
        'rooms',
        'bathrooms',
        'floor',
        'balconies',
        'finishing',
        'furnishing',
        'video_url',
        'video_public_id',
        'video_driver',
        'video_file_path',
        'status',
        'featured',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function propertyType()
    {
        return $this->belongsTo(PropertyType::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function images()
    {
        return $this->hasMany(PropertyImage::class)->ordered();
    }

    /**
     * Get primary image
     */
    public function primaryImage()
    {
        return $this->hasOne(PropertyImage::class)->primary();
    }

    /**
     * Get images by type
     */
    public function imagesByType(string $type)
    {
        return $this->images()->ofType($type);
    }

    /**
     * Get balcony images specifically
     */
    public function balconyImages()
    {
        return $this->imagesByType('balcony');
    }

    public function amenities()
    {
        return $this->belongsToMany(Amenity::class, 'property_amenities');
    }

    /**
     * Check if a user has favorited this property
     */
    public function isFavoritedBy($user)
    {
        if (!$user) {
            return false;
        }

        return $this->favoriteUsers()->where('user_id', $user->id)->exists();
    }

    /**
     * Get users who have favorited this property
     */
    public function favoriteUsers()
    {
        return $this->belongsToMany(User::class, 'user_favorites')->withTimestamps();
    }
}