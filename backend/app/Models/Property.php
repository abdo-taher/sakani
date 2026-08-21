<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Category;
use App\Models\Location;
use App\Models\PropertyImage;
use App\Models\Amenity;
use App\Models\PropertyType;
use App\Models\User;
use App\Models\Reservation;
use App\Models\Tag;

class Property extends Model
{
    protected $fillable = [
        'title',
        'description',
        'price',
        'is_negotiable',
        'has_offer',
        'offer_price',
        'offer_discount_percentage',
        'offer_start_date',
        'offer_end_date',
        'offer_title',
        'offer_badge',
        'category_id',
        'property_type_id',
        'location_id',
        'address',
        'latitude',
        'longitude',
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
        'submission_status',
        'submitter_name',
        'submitter_phone',
        'submitter_notes',
        'rejection_reason',
        'admin_notes',
        'featured',
        'is_uploading',
        'views',
        'has_detailed_rooms',
        'audience_type',
        'video_thumbnail_url',
        'video_thumbnail_public_id',
        'slug',
        'seo_title',
        'seo_description',
    ];

    protected $casts = [
        'has_offer' => 'boolean',
        'is_negotiable' => 'boolean',
        'price' => 'float',
        'offer_price' => 'float',
        'offer_discount_percentage' => 'integer',
        'offer_start_date' => 'date:Y-m-d',
        'offer_end_date' => 'date:Y-m-d',
        'featured' => 'boolean',
        'has_detailed_rooms' => 'boolean',
        'is_uploading' => 'boolean',
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    protected $appends = [
        'ref_id',
        'is_offer_active',
        'effective_price',
        'discount_amount',
        'canonical_url',
        'operation_type',
        'district_name',
        'address_detail',
        'owner_name',
        'owner_phone',
    ];

    /**
     * Booted method for automatic cache invalidation and slug maintenance
     */
    protected static function booted()
    {
        static::saving(function ($property) {
            if (empty($property->slug) && !empty($property->title)) {
                $cleanTitle = preg_replace('/[^\p{Arabic}\p{L}\p{N}\s-]/u', '', (string)$property->title);
                $clean = preg_replace('/[\s-]+/', '-', trim($cleanTitle));
                $clean = trim($clean, '-');
                $id = $property->id ?: rand(100, 999);
                $property->slug = $clean ? "{$id}-{$clean}" : (string)$id;
            }
        });

        static::saved(function ($property) {
            // Ensure ID is prefixed if slug was created before ID was assigned
            if ($property->id && (!str_starts_with((string)$property->slug, "{$property->id}-") && $property->slug !== (string)$property->id)) {
                $cleanTitle = preg_replace('/[^\p{Arabic}\p{L}\p{N}\s-]/u', '', (string)$property->title);
                $clean = preg_replace('/[\s-]+/', '-', trim($cleanTitle));
                $clean = trim($clean, '-');
                $newSlug = $clean ? "{$property->id}-{$clean}" : (string)$property->id;
                if ($property->slug !== $newSlug) {
                    $property->slug = $newSlug;
                    \Illuminate\Support\Facades\DB::table('properties')
                        ->where('id', $property->id)
                        ->update(['slug' => $newSlug]);
                }
            }
            \App\Helpers\CacheHelper::clearPropertyCaches();
        });

        static::deleted(function ($property) {
            \App\Helpers\CacheHelper::clearPropertyCaches();
        });
    }

    /**
     * Get the canonical frontend URL for the property
     */
    public function getCanonicalUrlAttribute(): string
    {
        $slug = $this->slug ?: $this->id;
        return "https://sakani.site/properties/{$slug}";
    }

    /**
     * Get human-friendly formatted reference ID (e.g. SK-0081)
     */
    public function getRefIdAttribute(): string
    {
        return 'SK-' . str_pad((string)$this->id, 4, '0', STR_PAD_LEFT);
    }

    public function getOperationTypeAttribute(): string
    {
        $slug = $this->relationLoaded('category') ? $this->category?->slug : null;
        return $slug === 'rent' ? 'rent' : 'sale';
    }

    public function getDistrictNameAttribute(): ?string
    {
        return $this->relationLoaded('location') ? $this->location?->name : null;
    }

    public function getAddressDetailAttribute(): ?string
    {
        return $this->address;
    }

    public function getOwnerNameAttribute(): ?string
    {
        return $this->submitter_name;
    }

    public function getOwnerPhoneAttribute(): ?string
    {
        return $this->submitter_phone;
    }

    /**
     * Check if property currently has a valid active offer
     */
    public function getIsOfferActiveAttribute(): bool
    {
        if (!$this->has_offer || empty($this->offer_price) || (float) $this->offer_price <= 0) {
            return false;
        }

        $today = now()->startOfDay();

        if ($this->offer_start_date) {
            $start = \Illuminate\Support\Carbon::parse($this->offer_start_date)->startOfDay();
            if ($today->lt($start)) {
                return false;
            }
        }

        if ($this->offer_end_date) {
            $end = \Illuminate\Support\Carbon::parse($this->offer_end_date)->endOfDay();
            if ($today->gt($end)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get the current effective price (offer price if active, otherwise regular price)
     */
    public function getEffectivePriceAttribute(): ?float
    {
        if ($this->is_offer_active && (float) $this->offer_price > 0) {
            return (float) $this->offer_price;
        }

        return $this->price !== null ? (float) $this->price : null;
    }

    /**
     * Get discount amount saved
     */
    public function getDiscountAmountAttribute(): ?float
    {
        if ($this->is_offer_active && $this->price && $this->offer_price && (float) $this->price > (float) $this->offer_price) {
            return round((float) $this->price - (float) $this->offer_price, 2);
        }

        return null;
    }

    /**
     * Scope for properties with active offers
     */
    public function scopeActiveOffer($query)
    {
        $today = now()->toDateString();
        return $query->where('has_offer', true)
            ->whereNotNull('offer_price')
            ->where('offer_price', '>', 0)
            ->where(function ($q) use ($today) {
                $q->whereNull('offer_start_date')->orWhere('offer_start_date', '<=', $today);
            })
            ->where(function ($q) use ($today) {
                $q->whereNull('offer_end_date')->orWhere('offer_end_date', '>=', $today);
            });
    }

    /**
     * Scope for public published properties (only approved and available/reserved)
     */
    public function scopePubliclyVisible($query)
    {
        return $query->where(function ($q) {
            $q->where('submission_status', 'approved')
              ->orWhereNull('submission_status');
        })
        ->whereNotIn('status', ['pending_review', 'rejected'])
        ->where(function ($q) {
            $q->where('is_uploading', false)
              ->orWhereNull('is_uploading');
        });
    }

    /**
     * Scope for pending customer submissions
     */
    public function scopePendingReview($query)
    {
        return $query->where('submission_status', 'pending_review')
            ->orWhere('status', 'pending_review');
    }

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
        return $this->hasMany(PropertyImage::class)
            ->where(function ($q) {
                $q->whereNull('media_type')->orWhere('media_type', '!=', 'video');
            })
            ->where('image_url', 'not like', '%.mp4%')
            ->where('image_url', 'not like', '%.webm%')
            ->where('image_url', 'not like', '%.mov%')
            ->where('image_url', 'not like', '%/properties/videos/%')
            ->ordered();
    }

    /**
     * Get primary image
     */
    public function primaryImage()
    {
        return $this->hasOne(PropertyImage::class)
            ->where(function ($q) {
                $q->whereNull('media_type')->orWhere('media_type', '!=', 'video');
            })
            ->where('image_url', 'not like', '%.mp4%')
            ->where('image_url', 'not like', '%.webm%')
            ->where('image_url', 'not like', '%.mov%')
            ->where('image_url', 'not like', '%/properties/videos/%')
            ->primary();
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

    public function reservations()
    {
        return $this->hasMany(Reservation::class)->latest();
    }

    public function detailedRooms()
    {
        return $this->hasMany(Room::class);
    }

    public function availableRooms()
    {
        return $this->hasMany(Room::class)->where('status', 'available');
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

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'property_tags');
    }

    /**
     * Ensure video_url is resolved to full public CDN URL
     */
    public function getVideoUrlAttribute($value)
    {
        if (empty($value)) return $value;
        if (preg_match('/^(https?:\/\/|\/\/|data:|blob:)/i', $value)) {
            return $value;
        }
        if (str_starts_with($value, '/') && !str_starts_with($value, '/sakani/') && !str_starts_with($value, '/properties/')) {
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

    /**
     * Ensure video_thumbnail_url is resolved to full public CDN URL
     */
    public function getVideoThumbnailUrlAttribute($value)
    {
        if (empty($value)) return $value;
        if (preg_match('/^(https?:\/\/|\/\/|data:|blob:)/i', $value)) {
            return $value;
        }
        if (str_starts_with($value, '/') && !str_starts_with($value, '/sakani/') && !str_starts_with($value, '/properties/')) {
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

    /**
     * Ensure image_url attribute resolves to full public CDN URL
     */
    public function getImageUrlAttribute($value)
    {
        if (empty($value)) return $value;
        if (preg_match('/^(https?:\/\/|\/\/|data:|blob:)/i', $value)) {
            return $value;
        }
        if (str_starts_with($value, '/') && !str_starts_with($value, '/sakani/') && !str_starts_with($value, '/properties/')) {
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
