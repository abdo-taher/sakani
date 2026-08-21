<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\Category;
use App\Models\PropertyType;
use App\Services\VideoUploadService;
use App\Services\R2MediaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Helpers\CacheHelper;
use Exception;
use Illuminate\Validation\ValidationException;

class PropertyController extends Controller
{
    protected VideoUploadService $videoUploadService;
    protected R2MediaService $r2MediaService;

    public function __construct(VideoUploadService $videoUploadService, R2MediaService $r2MediaService)
    {
        $this->videoUploadService = $videoUploadService;
        $this->r2MediaService = $r2MediaService;
    }
    public function index(Request $request)
    {
        $user = $request->user();
        
        $relations = [
            'category', 
            'propertyType', 
            'location', 
            'images', 
            'media',
            'amenities',
            'tags',
            'detailedRooms.roomImages'
        ];

        try {
            $query = Property::with($relations);
        } catch (\Exception $e) {
            Log::error('Property index eager load fallback: ' . $e->getMessage());
            $query = Property::with([
                'category', 
                'propertyType', 
                'location', 
                'images', 
                'media',
                'amenities',
            ]);
        }

        // Publicly visible filter by default unless explicitly asked for admin submissions
        if (!$request->boolean('include_pending') && !$request->boolean('all_statuses')) {
            $query->publiclyVisible();
        }

        // 1. Filter by Operation / Category ('sale' vs 'rent')
        if ($request->filled('operation') || $request->filled('operation_type') || $request->filled('category')) {
            $op = $request->input('operation') ?: ($request->input('operation_type') ?: $request->input('category'));
            if ($op !== 'all') {
                $query->where(function ($q) use ($op) {
                    $slugs = $op === 'sale' ? ['sale', 'sell', 'buy'] : [$op];
                    $q->whereHas('category', function ($cq) use ($slugs) {
                        $cq->whereIn('slug', $slugs);
                    });
                });
            }
        }

        // 2. Filter by Property Type ('apartment', 'villa', 'duplex', etc.)
        if ($request->filled('type') || $request->filled('property_type')) {
            $type = $request->input('type') ?: $request->input('property_type');
            if ($type !== 'all') {
                $typeNames = $this->propertyTypeNamesForSlug((string) $type);
                $query->where(function ($q) use ($typeNames) {
                    $q->whereHas('propertyType', function ($tq) use ($typeNames) {
                        $tq->where(function ($namesQuery) use ($typeNames) {
                            foreach ($typeNames as $name) {
                                $namesQuery->orWhere('name', 'like', "%{$name}%");
                            }
                        });
                    });
                });
            }
        }

        // 3. Filter by Furnishing ('furnished', 'unfurnished')
        if ($request->filled('furnishing')) {
            $furnishing = $request->input('furnishing');
            if ($furnishing !== 'all') {
                $query->where('furnishing', $furnishing);
            }
        }

        // 3.1 Filter by Audience Classification ('families', 'young_men', 'female_students', 'all')
        if ($request->filled('audience_type') || $request->filled('audience') || $request->filled('tenant_type')) {
            $aud = $request->input('audience_type') ?: ($request->input('audience') ?: $request->input('tenant_type'));
            if ($aud !== 'all') {
                $query->where(function ($q) use ($aud) {
                    $q->where('audience_type', $aud)
                      ->orWhere('audience_type', 'all')
                      ->orWhereNull('audience_type');
                });
            }
        }

        // 4. Filter by Detailed Rooms Mode ('full' vs 'room')
        if ($request->filled('mode')) {
            $mode = $request->input('mode');
            if ($mode === 'room') {
                $query->where('has_detailed_rooms', true)
                      ->whereHas('detailedRooms');
            } elseif ($mode === 'full') {
                $query->where(function ($q) {
                    $q->where('has_detailed_rooms', false)
                      ->orWhereDoesntHave('detailedRooms');
                });
            }
        } elseif ($request->has('has_detailed_rooms')) {
            $hasRooms = filter_var($request->input('has_detailed_rooms'), FILTER_VALIDATE_BOOLEAN);
            if ($hasRooms) {
                $query->where('has_detailed_rooms', true)->whereHas('detailedRooms');
            } else {
                $query->where('has_detailed_rooms', false);
            }
        }

        // 5. Filter by Location / District
        if ($request->filled('location_id') || $request->filled('district')) {
            $loc = $request->input('location_id') ?: $request->input('district');
            if ($loc !== 'all') {
                $query->where('location_id', $loc);
            }
        }

        // 6. Filter by Price Range
        if ($request->filled('min_price') && (float) $request->input('min_price') > 0) {
            $query->where('price', '>=', (float) $request->input('min_price'));
        }
        if ($request->filled('max_price') && (float) $request->input('max_price') > 0) {
            $query->where('price', '<=', (float) $request->input('max_price'));
        }

        // 7. Filter by Minimum Rooms
        if ($request->filled('rooms') && $request->input('rooms') !== 'all') {
            $query->where('rooms', '>=', (int) $request->input('rooms'));
        }

        // 8. Filter by Status
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        // 9. Search Query
        if ($request->filled('search') || $request->filled('q')) {
            $search = trim($request->input('search') ?: $request->input('q'));
            $numericSearch = preg_replace('/\D/', '', $search);
            $query->where(function ($q) use ($search, $numericSearch) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
                if (!empty($numericSearch)) {
                    $q->orWhere('id', (int)$numericSearch);
                }
            });
        }

        // 10. Featured Only
        if ($request->has('featured') && filter_var($request->input('featured'), FILTER_VALIDATE_BOOLEAN)) {
            $query->where('featured', true);
        }

        // 11. Offers Only or Active Offers Filter
        if ($request->has('offers_only') && filter_var($request->input('offers_only'), FILTER_VALIDATE_BOOLEAN)) {
            $query->activeOffer();
        } elseif ($request->has('has_offer')) {
            $hasOffer = filter_var($request->input('has_offer'), FILTER_VALIDATE_BOOLEAN);
            $query->where('has_offer', $hasOffer);
        }

        // 12. Proximity / Geospatial Filter (lat, lng, radius in km)
        $isProximityFiltered = false;
        if ($request->filled('lat') && $request->filled('lng')) {
            $lat = (float) $request->input('lat');
            $lng = (float) $request->input('lng');
            $radius = (float) $request->input('radius', 10);

            $query->whereNotNull('latitude')
                  ->whereNotNull('longitude');

            $haversine = "(6371 * acos(cos(radians({$lat})) * cos(radians(latitude)) * cos(radians(longitude) - radians({$lng})) + sin(radians({$lat})) * sin(radians(latitude))))";
            
            $query->selectRaw("properties.*, {$haversine} AS distance")
                  ->having('distance', '<=', $radius)
                  ->orderBy('distance', 'asc');
            $isProximityFiltered = true;
        }

        $propVersion = Cache::get('sakani_props_version', 1);
        $cacheKey = 'sakani_props_pub_v' . $propVersion . '_' . md5(json_encode($request->all()));
        $isPublicQuery = !$user && !$request->boolean('include_pending') && !$request->boolean('all_statuses');

        if ($isPublicQuery) {
            $cached = Cache::get($cacheKey);
            if ($cached) {
                return response()->json($cached)->header('X-Cache', 'HIT');
            }
        }

        $properties = $isProximityFiltered ? $query->get() : $query->latest()->get();

        // Add sanitized images and multi-videos for each property
        $properties->transform(function ($property) use ($user) {
            return $this->formatPropertyMedia($property, $user);
        });

        if ($isPublicQuery) {
            Cache::put($cacheKey, $properties, 180);
        }

        return response()->json($properties);
    }

    public function byCategory(Request $request, $category)
    {
        $user = $request->user();
        $categorySlugs = $category === 'sale' ? ['sale', 'sell', 'buy'] : [$category];
        try {
            $properties = Property::with([
                'category', 
                'propertyType', 
                'location', 
                'images', 
                'amenities',
                'tags'
            ])->whereHas('category', function ($query) use ($categorySlugs) {
                $query->whereIn('slug', $categorySlugs);
            })->latest()->get();
        } catch (\Exception $e) {
            Log::error('Property byCategory eager load failed: ' . $e->getMessage());
            $properties = Property::with([
                'category', 
                'propertyType', 
                'location', 
                'images', 
                'amenities',
            ])->whereHas('category', function ($query) use ($categorySlugs) {
                $query->whereIn('slug', $categorySlugs);
            })->latest()->get();
        }

        // Add primary image and images grouped by type for each property
        $properties->transform(function ($property) use ($user) {
            $property->primary_image = $property->images->where('is_primary', true)->first();
            $property->images_by_type = $property->images->groupBy('image_type');
            $property->total_images = $property->images->count();
            $property->is_favorite = $property->isFavoritedBy($user);
            return $property;
        });

        return response()->json($properties);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'nullable|numeric|min:0',
            'is_negotiable' => 'sometimes|boolean',
            'has_offer' => 'sometimes|boolean',
            'offer_price' => 'nullable|numeric|min:0',
            'offer_discount_percentage' => 'nullable|integer|min:1|max:99',
            'offer_start_date' => 'nullable|date',
            'offer_end_date' => 'nullable|date',
            'offer_title' => 'nullable|string|max:255',
            'offer_badge' => 'nullable|string|max:100',
            'operation_type' => 'required_without:category_id|nullable|in:sale,rent',
            'property_type' => 'required_without:property_type_id|nullable|string',
            'property_type_id' => 'nullable|exists:property_types,id',
            'category_id' => 'nullable|exists:categories,id',
            'location_id' => 'required|exists:locations,id',
            'address_detail' => 'nullable|string|max:500',
            'address' => 'nullable|string|max:500',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'rent_duration' => 'nullable|in:monthly,3_months,6_months,yearly',
            'area' => 'nullable|integer',
            'rooms' => 'required|integer',
            'bathrooms' => 'required|integer',
            'floor' => 'nullable|integer',
            'balconies' => 'nullable|integer',
            'finishing' => 'nullable|string',
            'furnishing' => 'nullable|string',
            'audience_type' => 'nullable|string|in:families,young_men,female_students,all',
            'video' => 'nullable|file|mimes:mp4,mpeg,quicktime,avi,webm,flv,3gp,wmv|max:' . (config('video_upload.max_size', 104857600) / 1024),
            'video_url' => 'nullable|string',
            'video_public_id' => 'nullable|string',
            'video_thumbnail_url' => 'nullable|string',
            'video_thumbnail_public_id' => 'nullable|string',
            'video_driver' => 'nullable|string',
            'video_file_path' => 'nullable|string',
            'status' => 'nullable|in:available,reserved,sold,rented',
            'featured' => 'boolean',
            'has_detailed_rooms' => 'boolean',
            'submission_status' => 'nullable|string',
            'submitter_name' => 'nullable|string|max:255',
            'submitter_phone' => 'nullable|string|max:50',
            'submitter_notes' => 'nullable|string',
            'admin_notes' => 'nullable|string',
            'rooms_data' => 'sometimes|array',
            'rooms_data.*.name' => 'required|string|max:255',
            'rooms_data.*.description' => 'nullable|string',
            'rooms_data.*.price' => 'required|numeric|min:0',
            'rooms_data.*.area' => 'nullable|integer|min:1',
            'amenities' => 'sometimes|array',
            'tags' => 'sometimes|array',
            
            // Images validation
            'images' => 'sometimes|array|max:20',
            'images.*' => 'sometimes|file|image|mimes:jpeg,jpg,png,webp|max:10240',
            'image_types' => 'sometimes|array',
            'image_types.*' => 'sometimes|string|in:' . implode(',', array_keys(PropertyImage::IMAGE_TYPES)),
            'image_captions' => 'sometimes|array',
            'image_captions.*' => 'sometimes|string|max:255',
            
            // Pre-uploaded images (from separate upload endpoints)
            'uploaded_images' => 'sometimes|array',
            'uploaded_images.*.image_url' => 'required|string|url',
            'uploaded_images.*.image_public_id' => 'required|string',
            'uploaded_images.*.image_type' => 'sometimes|string|in:' . implode(',', array_keys(PropertyImage::IMAGE_TYPES)),
            'uploaded_images.*.caption' => 'sometimes|string|max:255',
            'uploaded_images.*.media_type' => 'sometimes|string|in:image,video',
            'uploaded_images.*.sort_order' => 'sometimes|integer|min:0',
            'uploaded_images.*.is_primary' => 'sometimes|boolean',
        ]);

        $categoryId = $this->resolveCategoryId($request);
        $propertyTypeId = $this->resolvePropertyTypeId($request, $categoryId);

        DB::beginTransaction();

        try {
            $videoData = [];

            // Handle video upload if file is provided
            if ($request->hasFile('video')) {
                try {
                    Log::info('Processing video upload for new property');
                    
                    $videoResult = $this->videoUploadService->uploadVideo(
                        $request->file('video'), 
                        config('video_upload.folders.properties', 'properties/videos')
                    );

                    $videoData = [
                        'video_url' => $videoResult['url'],
                        'video_public_id' => $videoResult['file_path'],
                        'video_driver' => $videoResult['driver'],
                        'video_file_path' => $videoResult['file_path'],
                    ];

                    Log::info('Video uploaded successfully for property', $videoData);

                } catch (Exception $e) {
                    Log::error('Video upload failed for property creation: ' . $e->getMessage());
                    
                    return response()->json([
                        'success' => false,
                        'message' => 'Property creation failed: ' . $e->getMessage()
                    ], 422);
                }
            } elseif ($request->filled('video_url')) {
                // Use provided video data (from previous upload or external source)
                $videoData = [
                    'video_url' => $request->video_url,
                    'video_public_id' => $request->video_public_id ?? $request->video_url,
                    'video_thumbnail_url' => $request->video_thumbnail_url,
                    'video_thumbnail_public_id' => $request->video_thumbnail_public_id,
                    'video_driver' => $request->video_driver ?? 'r2',
                    'video_file_path' => $request->video_file_path ?? $request->video_url,
                ];
            }

            $roomsCount = (int) ($request->rooms ?? 0);
            if ($request->boolean('has_detailed_rooms') && $request->filled('rooms_data') && is_array($request->rooms_data)) {
                $roomsCount = max($roomsCount, count($request->rooms_data));
            }

            $propertyData = [
                'title' => $request->title,
                'description' => $request->description,
                'price' => $request->price,
                'is_negotiable' => $request->boolean('is_negotiable', false),
                'has_offer' => $request->boolean('has_offer', false),
                'offer_price' => $request->filled('offer_price') ? $request->offer_price : null,
                'offer_discount_percentage' => $request->filled('offer_discount_percentage') ? $request->offer_discount_percentage : null,
                'offer_start_date' => $request->filled('offer_start_date') ? $request->offer_start_date : null,
                'offer_end_date' => $request->filled('offer_end_date') ? $request->offer_end_date : null,
                'offer_title' => $request->offer_title,
                'offer_badge' => $request->offer_badge,
                'rent_duration' => $request->rent_duration,
                'category_id' => $categoryId,
                'property_type_id' => $propertyTypeId,
                'location_id' => $request->location_id,
                'address' => $request->input('address_detail', $request->address),
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'area' => $request->filled('area') ? (int)$request->area : null,
                'rooms' => $roomsCount,
                'bathrooms' => (int) ($request->bathrooms ?? 1),
                'floor' => $request->filled('floor') ? (int)$request->floor : null,
                'balconies' => $request->filled('balconies') ? (int)$request->balconies : null,
                'finishing' => $this->normalizeFinishingValue($request->finishing),
                'furnishing' => $this->normalizeFurnishingValue($request->furnishing),
                'audience_type' => $request->filled('audience_type') ? $request->audience_type : 'families',
                'video_thumbnail_url' => $request->video_thumbnail_url,
                'video_thumbnail_public_id' => $request->video_thumbnail_public_id,
                'status' => $request->status ?? 'available',
                'submission_status' => $request->submission_status ?? 'approved',
                'submitter_name' => $request->submitter_name,
                'submitter_phone' => $request->submitter_phone,
                'submitter_notes' => $request->submitter_notes,
                'admin_notes' => $request->admin_notes,
                'featured' => $request->featured ?? false,
                'is_uploading' => false,
                'has_detailed_rooms' => $request->boolean('has_detailed_rooms', false),
            ];

            // Merge video data if available
            $propertyData = array_merge($propertyData, $videoData);

            $property = Property::create($propertyData);
    
            if ($request->filled('amenities')) {
                $amenityIds = $this->resolveAmenityIds((array) $request->amenities);
                $property->amenities()->sync($amenityIds);
            }

            if ($request->filled('tags')) {
                $tagIds = $this->resolveTagIds((array) $request->tags);
                $property->tags()->sync($tagIds);
            }

            // Create rooms inline if provided
            if ($request->filled('rooms_data') && $request->has_detailed_rooms) {
                foreach ($request->rooms_data as $roomData) {
                    $property->detailedRooms()->create([
                        'name' => $roomData['name'],
                        'description' => $roomData['description'] ?? null,
                        'price' => $roomData['price'],
                        'area' => $roomData['area'] ?? null,
                        'status' => 'available',
                        'is_uploading' => true,
                    ]);
                }
            }

            // Handle image uploads
            $uploadedImages = [];
            $imageErrors = [];

            // Handle direct file uploads
            if ($request->hasFile('images')) {
                $images = $request->file('images');
                $imageTypes = $request->input('image_types', []);
                $imageCaptions = $request->input('image_captions', []);

                foreach ($images as $index => $image) {
                    try {
                        $uploadResult = $this->r2MediaService->uploadImage($image, 'sakani/properties/images');
                        $imageUrl = $uploadResult['url'];
                        $publicId = $uploadResult['key'];

                        $propertyImage = PropertyImage::create([
                            'property_id' => $property->id,
                            'image_url' => $imageUrl,
                            'image_public_id' => $publicId,
                            'media_type' => 'image',
                            'sort_order' => $index,
                            'image_type' => $imageTypes[$index] ?? 'property',
                            'caption' => $imageCaptions[$index] ?? null,
                            'is_primary' => $index === 0, // First image as primary
                        ]);

                        $uploadedImages[] = $propertyImage;

                    } catch (Exception $e) {
                        Log::error("Failed to upload image {$index}: " . $e->getMessage());
                        $imageErrors[] = "Image " . ($index + 1) . ": " . $e->getMessage();
                    }
                }
            }

            // Handle pre-uploaded images
            if ($request->filled('uploaded_images')) {
                $uploadedImageData = $request->input('uploaded_images');
                $hasExplicitPrimary = collect($uploadedImageData)->contains(fn($img) => !empty($img['is_primary']));
                
                foreach ($uploadedImageData as $index => $imageData) {
                    try {
                        $isPrimary = !empty($imageData['is_primary']) || (!$hasExplicitPrimary && $index === 0 && count($uploadedImages) === 0);

                        $propertyImage = PropertyImage::create([
                            'property_id' => $property->id,
                            'image_url' => $imageData['image_url'],
                            'image_public_id' => $imageData['image_public_id'] ?? $this->r2MediaService->extractKeyFromUrl($imageData['image_url']),
                            'media_type' => $imageData['media_type'] ?? 'image',
                            'sort_order' => $imageData['sort_order'] ?? (count($uploadedImages) + $index),
                            'image_type' => $imageData['image_type'] ?? 'property',
                            'caption' => $imageData['caption'] ?? null,
                            'is_primary' => $isPrimary,
                        ]);

                        $uploadedImages[] = $propertyImage;

                    } catch (Exception $e) {
                        Log::error("Failed to save pre-uploaded image {$index}: " . $e->getMessage());
                        $imageErrors[] = "Pre-uploaded image " . ($index + 1) . ": " . $e->getMessage();
                    }
                }
            }

            DB::commit();

            // Load the complete property with relationships
            $property = Property::with([
                'category', 
                'propertyType', 
                'location', 
                'images' => function($query) {
                    $query->ordered();
                }, 
                'media',
                'amenities',
                'tags',
                'detailedRooms.roomImages'
            ])->find($property->id);

            $property = $this->formatPropertyMedia($property, $request->user());

            $message = 'Property created successfully';
            if (!empty($imageErrors)) {
                $message .= '. Some images failed to upload: ' . implode(', ', $imageErrors);
            }

            CacheHelper::clearPropertyCaches();

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $property,
                'uploaded_images_count' => count($uploadedImages),
                'image_errors' => $imageErrors,
            ], 201);

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Property creation failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Property creation failed: ' . $e->getMessage()
            ], 422);
        }
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $idOrSlug = trim((string)$id);

        $numericId = null;
        if (is_numeric($idOrSlug)) {
            $numericId = (int)$idOrSlug;
        } elseif (preg_match('/^(\d+)-/u', $idOrSlug, $matches)) {
            $numericId = (int)$matches[1];
        } elseif (preg_match('/-(\d+)$/u', $idOrSlug, $matches)) {
            $numericId = (int)$matches[1];
        } elseif (preg_match('/^SK-(\d+)$/i', $idOrSlug, $matches)) {
            $numericId = (int)$matches[1];
        }

        $relations = [
            'category', 
            'propertyType', 
            'location', 
            'images' => function($query) {
                $query->ordered();
            }, 
            'media',
            'amenities',
            'tags',
            'reservations',
            'detailedRooms' => function($query) {
                $query->with('roomImages');
            },
        ];

        $property = null;

        // Try with all relations first
        try {
            $query = Property::with($relations);
            if ($numericId) {
                $property = $query->where('id', $numericId)->first();
            }
            if (!$property) {
                $property = $query->where('slug', $idOrSlug)->orWhere('id', $idOrSlug)->first();
            }
        } catch (\Exception $e) {
            Log::error("Property show eager load failed for {$idOrSlug}: " . $e->getMessage());
        }

        // Fallback: try with only essential relations
        if (!$property) {
            try {
                $query = Property::with([
                    'category', 
                    'propertyType', 
                    'location', 
                    'images' => function($query) {
                        $query->ordered();
                    }, 
                    'media',
                    'amenities',
                ]);
                if ($numericId) {
                    $property = $query->where('id', $numericId)->first();
                }
                if (!$property) {
                    $property = $query->where('slug', $idOrSlug)->orWhere('id', $idOrSlug)->first();
                }
            } catch (\Exception $e) {
                Log::error("Property show basic load failed for {$idOrSlug}: " . $e->getMessage());
            }
        }

        // Last resort: direct find
        if (!$property) {
            try {
                if ($numericId) {
                    $property = Property::find($numericId);
                }
                if (!$property) {
                    $property = Property::where('slug', $idOrSlug)->orWhere('id', $idOrSlug)->first();
                }
            } catch (\Exception $e) {
                Log::error("Property show fallback find failed: " . $e->getMessage());
            }
        }

        if (!$property) {
            return response()->json([
                'success' => false,
                'message' => 'العقار غير موجود'
            ], 404);
        }

        // Add computed attributes and multi-video support for frontend display
        $property = $this->formatPropertyMedia($property, $user);
        
        return response()->json([
            'success' => true,
            'data' => $property
        ]);
    }

    public function update(Request $request, $id)
    {
        $property = Property::findOrFail($id);

        if ($property->is_uploading) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن تعديل العقار أثناء رفع الوسائط'
            ], 409);
        }

        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string|max:2000',
            'price' => 'sometimes|required|numeric|min:0',
            'is_negotiable' => 'sometimes|boolean',
            'has_offer' => 'sometimes|boolean',
            'offer_price' => 'sometimes|nullable|numeric|min:0',
            'offer_discount_percentage' => 'sometimes|nullable|integer|min:1|max:99',
            'offer_start_date' => 'sometimes|nullable|date',
            'offer_end_date' => 'sometimes|nullable|date',
            'offer_title' => 'sometimes|nullable|string|max:255',
            'offer_badge' => 'sometimes|nullable|string|max:100',
            'property_type_id' => 'sometimes|required|exists:property_types,id',
            'category_id' => 'sometimes|required|exists:categories,id',
            'operation_type' => 'sometimes|nullable|in:sale,rent',
            'property_type' => 'sometimes|nullable|string',
            'location_id' => 'sometimes|required|exists:locations,id',
            'address_detail' => 'sometimes|nullable|string|max:500',
            'address' => 'sometimes|nullable|string|max:500',
            'latitude' => 'sometimes|nullable|numeric|between:-90,90',
            'longitude' => 'sometimes|nullable|numeric|between:-180,180',
            'rent_duration' => 'sometimes|nullable|in:monthly,3_months,6_months,yearly',
            'area' => 'sometimes|nullable|integer|min:1',
            'rooms' => 'sometimes|required|integer|min:0',
            'bathrooms' => 'sometimes|required|integer|min:0',
            'floor' => 'sometimes|nullable|integer|min:0',
            'balconies' => 'sometimes|nullable|integer|min:0',
            'finishing' => 'sometimes|nullable|string',
            'furnishing' => 'sometimes|nullable|string',
            'audience_type' => 'sometimes|nullable|string|in:families,young_men,female_students,all',
            'video' => 'sometimes|file|mimes:mp4,mpeg,quicktime,avi,webm,flv,3gp,wmv|max:' . (config('video_upload.max_size', 104857600) / 1024),
            'video_url' => 'sometimes|nullable|string|max:500',
            'video_public_id' => 'sometimes|nullable|string|max:200',
            'video_thumbnail_url' => 'sometimes|nullable|string|max:1000',
            'video_thumbnail_public_id' => 'sometimes|nullable|string|max:500',
            'video_driver' => 'sometimes|nullable|string',
            'video_file_path' => 'sometimes|nullable|string',
            'remove_video' => 'sometimes|boolean',
            'remove_images' => 'sometimes|array',
            'remove_images.*' => 'integer|exists:property_images,id',
            'status' => 'sometimes|nullable|in:available,reserved,sold,rented',
            'featured' => 'sometimes|boolean',
            'has_detailed_rooms' => 'sometimes|boolean',
            'submission_status' => 'sometimes|nullable|string',
            'submitter_name' => 'sometimes|nullable|string|max:255',
            'submitter_phone' => 'sometimes|nullable|string|max:50',
            'submitter_notes' => 'sometimes|nullable|string',
            'admin_notes' => 'sometimes|nullable|string',
            'amenities' => 'sometimes|array',
            'tags' => 'sometimes|array',
            'replace_images' => 'sometimes|boolean',
            'uploaded_images' => 'sometimes|array|max:20',
            'uploaded_images.*.image_url' => 'required|string|url',
            'uploaded_images.*.image_public_id' => 'nullable|string',
            'uploaded_images.*.image_type' => 'sometimes|string|in:' . implode(',', array_keys(PropertyImage::IMAGE_TYPES)),
            'uploaded_images.*.caption' => 'sometimes|nullable|string|max:255',
            'uploaded_images.*.media_type' => 'sometimes|string|in:image,video',
            'uploaded_images.*.sort_order' => 'sometimes|integer|min:0',
            'uploaded_images.*.is_primary' => 'sometimes|boolean',
            'replace_rooms' => 'sometimes|boolean',
            'videos' => 'sometimes|array|max:20',
            'videos.*.url' => 'required|string|url|max:1000',
            'videos.*.title' => 'sometimes|nullable|string|max:255',
            'videos.*.thumbnail_url' => 'sometimes|nullable|string|url|max:1000',
            'videos.*.type' => 'sometimes|nullable|string|max:100',
            'videos.*.is_primary' => 'sometimes|boolean',
            'rooms_data' => 'sometimes|array',
            'rooms_data.*.name' => 'required|string|max:255',
            'rooms_data.*.description' => 'nullable|string',
            'rooms_data.*.price' => 'required|numeric|min:0',
            'rooms_data.*.area' => 'nullable|integer|min:1',
        ]);

        $updateData = $request->only([
            'title', 'description', 'price', 'is_negotiable', 'has_offer', 'offer_price', 'offer_discount_percentage',
            'offer_start_date', 'offer_end_date', 'offer_title', 'offer_badge',
            'property_type_id', 'category_id', 
            'location_id', 'address', 'latitude', 'longitude', 'rent_duration', 'area', 'rooms',
            'bathrooms', 'floor', 'balconies', 'finishing', 'furnishing', 'audience_type',
            'video_thumbnail_url', 'video_thumbnail_public_id', 'status', 
            'submission_status', 'submitter_name', 'submitter_phone', 'submitter_notes',
            'admin_notes', 'featured', 'has_detailed_rooms'
        ]);

        if ($request->has('address_detail')) {
            $updateData['address'] = $request->input('address_detail');
        }
        if ($request->has('operation_type') || $request->has('category_id')) {
            $updateData['category_id'] = $this->resolveCategoryId($request, $property->category_id);
        }
        if ($request->has('property_type') || $request->has('property_type_id') || isset($updateData['category_id'])) {
            $updateData['property_type_id'] = $this->resolvePropertyTypeId(
                $request,
                (int) ($updateData['category_id'] ?? $property->category_id),
                $property->property_type_id
            );
        }

        if ($request->has('finishing')) {
            $updateData['finishing'] = $this->normalizeFinishingValue($request->finishing);
        }
        if ($request->has('furnishing')) {
            $updateData['furnishing'] = $this->normalizeFurnishingValue($request->furnishing);
        }
        if ($request->has('area')) {
            $updateData['area'] = $request->filled('area') ? (int)$request->area : null;
        }
        if ($request->boolean('has_detailed_rooms') && $request->filled('rooms_data') && is_array($request->rooms_data)) {
            $updateData['rooms'] = max((int)($request->rooms ?? 0), count($request->rooms_data));
        }

        // Handle video removal
        if ($request->boolean('remove_video')) {
            try {
                if ($property->video_driver && $property->video_file_path) {
                    $this->videoUploadService->deleteVideo($property->video_driver, $property->video_file_path);
                }
            } catch (Exception $e) {
                Log::warning('Failed to delete old video: ' . $e->getMessage());
            }

            $property->videoMedia()->delete();

            $updateData = array_merge($updateData, [
                'video_url' => null,
                'video_public_id' => null,
                'video_thumbnail_url' => null,
                'video_thumbnail_public_id' => null,
                'video_driver' => null,
                'video_file_path' => null,
            ]);
        }
        // Handle new video upload
        elseif ($request->hasFile('video')) {
            try {
                Log::info('Processing video upload for property update', ['property_id' => $id]);

                // Delete old video if it exists
                if ($property->video_driver && $property->video_file_path) {
                    try {
                        $this->videoUploadService->deleteVideo($property->video_driver, $property->video_file_path);
                        Log::info('Old video deleted successfully');
                    } catch (Exception $e) {
                        Log::warning('Failed to delete old video: ' . $e->getMessage());
                    }
                }

                // Upload new video
                $videoResult = $this->videoUploadService->uploadVideo(
                    $request->file('video'), 
                    config('video_upload.folders.properties', 'properties/videos')
                );

                $updateData = array_merge($updateData, [
                    'video_url' => $videoResult['url'],
                    'video_public_id' => $videoResult['file_path'],
                    'video_driver' => $videoResult['driver'],
                    'video_file_path' => $videoResult['file_path'],
                ]);

                Log::info('Video updated successfully for property', $updateData);

            } catch (Exception $e) {
                Log::error('Video upload failed for property update: ' . $e->getMessage());
                
                return response()->json([
                    'success' => false,
                    'message' => 'Property update failed: ' . $e->getMessage()
                ], 422);
            }
        }
        // Handle provided video data (from separate upload or URL)
        elseif ($request->filled('video_url')) {
            $updateData = array_merge($updateData, [
                'video_url' => $request->video_url,
                'video_public_id' => $request->video_public_id ?? $request->video_url,
                'video_thumbnail_url' => $request->video_thumbnail_url ?? $property->video_thumbnail_url,
                'video_thumbnail_public_id' => $request->video_thumbnail_public_id ?? $property->video_thumbnail_public_id,
                'video_driver' => $request->video_driver ?? $property->video_driver ?? 'r2',
                'video_file_path' => $request->video_file_path ?? $request->video_url,
            ]);
        } elseif ($request->has('video_url') && empty($request->video_url)) {
            $updateData = array_merge($updateData, [
                'video_url' => null,
                'video_public_id' => null,
                'video_thumbnail_url' => null,
                'video_thumbnail_public_id' => null,
                'video_driver' => null,
                'video_file_path' => null,
            ]);
        }

        $property->update($updateData);

        // Remove specified images
        if ($request->has('remove_images') && is_array($request->remove_images)) {
            $property->images()->whereIn('id', $request->remove_images)->delete();
        }

        // Add new direct image file uploads if provided
        if ($request->hasFile('images')) {
            $images = $request->file('images');
            $existingCount = $property->images()->count();
            foreach ($images as $idx => $imgFile) {
                try {
                    $uploadRes = $this->r2MediaService->uploadImage($imgFile, 'sakani/properties/images');
                    PropertyImage::create([
                        'property_id' => $property->id,
                        'image_url' => $uploadRes['url'],
                        'image_public_id' => $uploadRes['key'],
                        'media_type' => 'image',
                        'sort_order' => $existingCount + $idx,
                        'image_type' => 'property',
                        'is_primary' => $existingCount === 0 && $idx === 0,
                    ]);
                } catch (\Exception $e) {
                    Log::error("Failed to upload image during property update: " . $e->getMessage());
                }
            }
        }

        // Add or sync pre-uploaded images if provided
        if ($request->has('uploaded_images')) {
            $uploadedImages = $request->input('uploaded_images');
            $incomingUrls = array_filter(array_column($uploadedImages, 'image_url'));
            
            // Delete old images that were removed by the wizard, including all images when an empty list is submitted.
            if ($request->boolean('replace_images')) {
                if (empty($incomingUrls)) {
                    $property->images()->delete();
                } else {
                    $property->images()->whereNotIn('image_url', $incomingUrls)->delete();
                }
            } elseif (!empty($incomingUrls)) {
                $property->images()->whereNotIn('image_url', $incomingUrls)->delete();
            }
            
            $hasExplicitPrimary = collect($uploadedImages)->contains(fn($img) => !empty($img['is_primary']));

            foreach ($uploadedImages as $idx => $imgData) {
                $isPrimary = !empty($imgData['is_primary']) || (!$hasExplicitPrimary && $idx === 0);

                PropertyImage::updateOrCreate(
                    [
                        'property_id' => $property->id,
                        'image_url' => $imgData['image_url'],
                    ],
                    [
                        'image_public_id' => $imgData['image_public_id'] ?? $this->r2MediaService->extractKeyFromUrl($imgData['image_url']),
                        'media_type' => $imgData['media_type'] ?? 'image',
                        'sort_order' => $imgData['sort_order'] ?? $idx,
                        'image_type' => $imgData['image_type'] ?? 'property',
                        'caption' => $imgData['caption'] ?? null,
                        'is_primary' => $isPrimary,
                    ]
                );
            }
        }

        // Update primary image if explicitly specified
        if ($request->filled('primary_image_id')) {
            $primaryId = $request->input('primary_image_id');
            $property->images()->update(['is_primary' => false]);
            $property->images()->where('id', $primaryId)->update(['is_primary' => true]);
        }

        // Update image ordering if provided
        if ($request->filled('images_order') && is_array($request->input('images_order'))) {
            foreach ($request->input('images_order') as $sortOrder => $imgId) {
                $property->images()->where('id', $imgId)->update(['sort_order' => $sortOrder]);
            }
        }

        // Update amenities if provided
        if ($request->has('amenities')) {
            $amenityIds = $this->resolveAmenityIds((array) $request->amenities);
            $property->amenities()->sync($amenityIds);
        }

        // Update tags if provided
        if ($request->has('tags')) {
            $tagIds = $this->resolveTagIds((array) $request->tags);
            $property->tags()->sync($tagIds);
        }

        // Create or update rooms inline if provided without duplicates
        if ($request->has('rooms_data') || $request->boolean('replace_rooms')) {
            $incomingRooms = (array) $request->input('rooms_data', []);
            $incomingNumericIds = array_filter(array_map(function($r) {
                return (!empty($r['id']) && is_numeric($r['id'])) ? (int)$r['id'] : null;
            }, $incomingRooms));

            // Clean up removed rooms
            if ($request->boolean('replace_rooms') && empty($incomingNumericIds)) {
                $property->detailedRooms()->delete();
            } elseif (!empty($incomingNumericIds)) {
                $property->detailedRooms()->whereNotIn('id', $incomingNumericIds)->delete();
            }

            foreach ($incomingRooms as $roomData) {
                if (!empty($roomData['id']) && is_numeric($roomData['id'])) {
                    $property->detailedRooms()->where('id', $roomData['id'])->update([
                        'name' => $roomData['name'],
                        'description' => $roomData['description'] ?? null,
                        'price' => $roomData['price'],
                        'area' => $roomData['area'] ?? null,
                    ]);
                } else {
                    // Check if room with same name exists to avoid duplicate insertions
                    $existingRoom = $property->detailedRooms()->where('name', $roomData['name'])->first();
                    if ($existingRoom) {
                        $existingRoom->update([
                            'description' => $roomData['description'] ?? null,
                            'price' => $roomData['price'],
                            'area' => $roomData['area'] ?? null,
                        ]);
                    } else {
                        $property->detailedRooms()->create([
                            'name' => $roomData['name'],
                            'description' => $roomData['description'] ?? null,
                            'price' => $roomData['price'],
                            'area' => $roomData['area'] ?? null,
                            'status' => 'available',
                            'is_uploading' => false,
                        ]);
                    }
                }
            }
        }

        // Handle multiple videos sync if provided
        if ($request->has('videos') && is_array($request->input('videos'))) {
            $incomingVideos = $request->input('videos');
            
            // Delete existing video media
            $property->videoMedia()->delete();

            $primaryVideoUrl = null;
            foreach ($incomingVideos as $vIdx => $vData) {
                $vUrl = is_string($vData) ? $vData : ($vData['url'] ?? $vData['video_url'] ?? null);
                if (!$vUrl) continue;
                $vTitle = is_array($vData) ? ($vData['title'] ?? $vData['caption'] ?? 'فيديو جولة') : 'فيديو جولة';
                $vPrimary = is_array($vData) ? !empty($vData['is_primary']) : ($vIdx === 0);

                PropertyImage::create([
                    'property_id' => $property->id,
                    'image_url' => $vUrl,
                    'image_public_id' => is_array($vData) && !empty($vData['public_id']) ? $vData['public_id'] : $this->r2MediaService->extractKeyFromUrl($vUrl),
                    'media_type' => 'video',
                    'sort_order' => $vIdx,
                    'image_type' => is_array($vData) && !empty($vData['type']) ? $vData['type'] : 'walkthrough',
                    'caption' => $vTitle,
                    'is_primary' => $vPrimary,
                ]);

                if ($vPrimary || !$primaryVideoUrl) {
                    $primaryVideoUrl = $vUrl;
                }
            }

            if ($primaryVideoUrl) {
                $property->update(['video_url' => $primaryVideoUrl]);
            } elseif (empty($incomingVideos)) {
                $property->update(['video_url' => null]);
            }
        }

        $fresh = Property::with(['category', 'propertyType', 'location', 'images', 'media', 'amenities', 'tags', 'detailedRooms', 'detailedRooms.roomImages'])->find($property->id);
        $fresh = $this->formatPropertyMedia($fresh, $request->user());

        CacheHelper::clearPropertyCaches();

        return response()->json([
            'success' => true,
            'message' => 'Property updated successfully',
            'data' => $fresh
        ]);
    }

    public function destroy($id)
    {
        $property = Property::findOrFail($id);

        // Delete associated video if it exists
        if ($property->video_driver && $property->video_file_path) {
            try {
                $this->videoUploadService->deleteVideo($property->video_driver, $property->video_file_path);
                Log::info('Video deleted successfully for property', ['property_id' => $id]);
            } catch (Exception $e) {
                Log::warning('Failed to delete video for property: ' . $e->getMessage(), ['property_id' => $id]);
            }
        }

        $property->delete();
        CacheHelper::clearPropertyCaches();
        
        return response()->json(['message' => 'Property deleted successfully']);
    }

    public function uploadComplete($id)
    {
        $property = Property::findOrFail($id);
        $property->update(['is_uploading' => false]);
        CacheHelper::clearPropertyCaches();

        return response()->json([
            'success' => true,
            'message' => 'تم الانتهاء من رفع الوسائط'
        ]);
    }

    public function recordView($id)
    {
        try {
            $numericId = (int) preg_replace('/[^\d]/', '', (string) $id);
            $property = Property::find($numericId ?: $id);
            if (!$property) {
                return response()->json(['success' => false, 'message' => 'Property not found'], 404);
            }

            try {
                $property->increment('views');
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Failed to increment views for property {$id}: " . $e->getMessage());
            }

            return response()->json(['success' => true, 'views' => $property->fresh()->views ?? $property->views]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("recordView error: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to record view'], 200);
        }
    }

    public function topViewed(Request $request)
    {
        $limit = max(1, min(20, (int) $request->input('limit', 6)));
        $user = $request->user();

        try {
            $properties = Property::with([
                'category', 'propertyType', 'location', 'images', 'amenities', 'tags', 'detailedRooms'
            ])
            ->where('status', 'available')
            ->where('is_uploading', false)
            ->orderByDesc('views')
            ->limit($limit)
            ->get();
        } catch (\Exception $e) {
            Log::warning('topViewed query failed: ' . $e->getMessage());
            $properties = Property::with([
                'category', 'propertyType', 'location', 'images', 'amenities'
            ])
            ->where('status', 'available')
            ->where('is_uploading', false)
            ->latest()
            ->limit($limit)
            ->get();
        }

        $properties->transform(function ($property) use ($user) {
            $property->primary_image = $property->images->where('is_primary', true)->first();
            $property->images_by_type = $property->images->groupBy('image_type');
            $property->total_images = $property->images->count();
            $property->is_favorite = $property->isFavoritedBy($user);
            $property->cached_views = ($property->views ?? 0) + (Cache::get("property_views_{$property->id}", 0));
            return $property;
        });

        return response()->json($properties);
    }

    /**
     * Get best properties (featured + top viewed) for home page
     */
    public function bestProperties(Request $request)
    {
        $user = $request->user();
        $limit = max(1, min(20, (int) $request->input('limit', 8)));

        try {
            $query = Property::with([
                'category', 'propertyType', 'location', 'images', 'amenities', 'tags', 'detailedRooms'
            ])
            ->where('status', 'available')
            ->where('is_uploading', false);

            if ($request->filled('operation') && $request->input('operation') !== 'all') {
                $op = $request->input('operation');
                $slugs = $op === 'sale' ? ['sale', 'sell', 'buy'] : [$op];
                $query->whereHas('category', fn($cq) => $cq->whereIn('slug', $slugs));
            }

            if ($request->filled('mode')) {
                if ($request->input('mode') === 'room') {
                    $query->where('has_detailed_rooms', true)->whereHas('detailedRooms');
                } elseif ($request->input('mode') === 'full') {
                    $query->where('has_detailed_rooms', false);
                }
            }

            $properties = $query->orderByDesc('featured')
                ->orderByDesc('views')
                ->limit($limit)
                ->get();
        } catch (\Exception $e) {
            Log::warning('bestProperties eager load failed: ' . $e->getMessage());
            try {
                $properties = Property::with([
                    'category', 'propertyType', 'location', 'images', 'amenities'
                ])
                ->where('status', 'available')
                ->where('is_uploading', false)
                ->orderByDesc('featured')
                ->orderByDesc('views')
                ->limit($limit)
                ->get();
            } catch (\Exception $e2) {
                Log::warning('bestProperties fallback also failed: ' . $e2->getMessage());
                $properties = Property::with([
                    'category', 'propertyType', 'location', 'images', 'amenities'
                ])
                ->where('status', 'available')
                ->where('is_uploading', false)
                ->latest()
                ->limit($limit)
                ->get();
            }
        }

        $properties->transform(function ($property) use ($user) {
            $property->primary_image = $property->images->where('is_primary', true)->first();
            $property->images_by_type = $property->images->groupBy('image_type');
            $property->total_images = $property->images->count();
            $property->is_favorite = $property->isFavoritedBy($user);
            $property->cached_views = ($property->views ?? 0) + (Cache::get("property_views_{$property->id}", 0));
            return $property;
        });

        return response()->json($properties);
    }

    /**
     * Get related properties based on tags, category, budget, and location
     */
    public function relatedProperties(Request $request, $id)
    {
        $user = $request->user();

        try {
            $property = Property::with(['tags', 'category', 'location'])->findOrFail($id);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([]);
        } catch (\Exception $e) {
            Log::error("Related properties error for id {$id}: " . $e->getMessage());
            $property = Property::with(['category', 'location'])->findOrFail($id);
        }

        $budgetMin = $property->price * 0.5;
        $budgetMax = $property->price * 2;

        $relatedIds = collect();

        // 1. Properties sharing tags (highest priority)
        if ($property->relationLoaded('tags') && $property->tags->count() > 0) {
            $tagIds = $property->tags->pluck('id');
            $tagRelated = Property::whereHas('tags', function ($query) use ($tagIds) {
                $query->whereIn('tags.id', $tagIds);
            })
            ->where('id', '!=', $property->id)
            ->where('status', 'available')
            ->where('is_uploading', false)
            ->pluck('id');
            $relatedIds = $relatedIds->merge($tagRelated);
        }

        // 2. Properties in same category
        if ($property->category_id) {
            $categoryRelated = Property::where('category_id', $property->category_id)
                ->where('id', '!=', $property->id)
                ->where('status', 'available')
                ->where('is_uploading', false)
                ->pluck('id');
            $relatedIds = $relatedIds->merge($categoryRelated);
        }

        // 3. Properties in same location
        if ($property->location_id) {
            $locationRelated = Property::where('location_id', $property->location_id)
                ->where('id', '!=', $property->id)
                ->where('status', 'available')
                ->where('is_uploading', false)
                ->pluck('id');
            $relatedIds = $relatedIds->merge($locationRelated);
        }

        // 4. Properties in similar budget range
        $budgetRelated = Property::whereBetween('price', [$budgetMin, $budgetMax])
            ->where('id', '!=', $property->id)
            ->where('status', 'available')
            ->where('is_uploading', false)
            ->pluck('id');
        $relatedIds = $relatedIds->merge($budgetRelated);

        // Deduplicate while preserving priority order
        $relatedIds = $relatedIds->unique()->take(6);

        try {
            $properties = Property::with([
                'category', 'propertyType', 'location', 'images', 'amenities', 'tags'
            ])
            ->whereIn('id', $relatedIds)
            ->get();
        } catch (\Exception $e) {
            Log::error('relatedProperties eager load failed: ' . $e->getMessage());
            $properties = Property::with([
                'category', 'propertyType', 'location', 'images', 'amenities'
            ])
            ->whereIn('id', $relatedIds)
            ->get();
        }

        // Re-order to match priority
        $properties = $properties->sortBy(function ($p) use ($relatedIds) {
            return $relatedIds->search($p->id);
        })->values();

        $properties->transform(function ($property) use ($user) {
            $property->primary_image = $property->images->where('is_primary', true)->first();
            $property->images_by_type = $property->images->groupBy('image_type');
            $property->total_images = $property->images->count();
            $property->is_favorite = $property->isFavoritedBy($user);
            $property->cached_views = ($property->views ?? 0) + (Cache::get("property_views_{$property->id}", 0));
            return $property;
        });

        return response()->json($properties);
    }

    /**
     * Update or toggle offer on a single property quickly
     */
    public function updateOffer(Request $request, Property $property)
    {
        $validated = $request->validate([
            'has_offer' => 'required|boolean',
            'offer_price' => 'nullable|numeric|min:0',
            'offer_discount_percentage' => 'nullable|integer|min:1|max:99',
            'offer_start_date' => 'nullable|date',
            'offer_end_date' => 'nullable|date',
            'offer_title' => 'nullable|string|max:255',
            'offer_badge' => 'nullable|string|max:100',
        ]);

        if (!$validated['has_offer']) {
            $property->update([
                'has_offer' => false,
            ]);
        } else {
            $property->update([
                'has_offer' => true,
                'offer_price' => $validated['offer_price'] ?? null,
                'offer_discount_percentage' => $validated['offer_discount_percentage'] ?? null,
                'offer_start_date' => $validated['offer_start_date'] ?? null,
                'offer_end_date' => $validated['offer_end_date'] ?? null,
                'offer_title' => $validated['offer_title'] ?? null,
                'offer_badge' => $validated['offer_badge'] ?? null,
            ]);
        }

        CacheHelper::clearPropertyCaches();

        return response()->json([
            'success' => true,
            'message' => $property->has_offer ? 'تم تحديث وتفعيل العرض بنجاح' : 'تم إيقاف العرض بنجاح',
            'property' => $property->fresh(['category', 'propertyType', 'location', 'images', 'amenities', 'tags']),
        ]);
    }

    /**
     * Get active properties with active offers
     */
    public function bestOffers(Request $request)
    {
        $user = $request->user();
        $offers = Property::with([
            'category', 
            'propertyType', 
            'location', 
            'images', 
            'amenities',
            'tags'
        ])->publiclyVisible()->activeOffer()->latest()->take(10)->get();

        $offers->transform(function ($property) use ($user) {
            $property->primary_image = $property->images->where('is_primary', true)->first();
            $property->images_by_type = $property->images->groupBy('image_type');
            $property->total_images = $property->images->count();
            $property->is_favorite = $property->isFavoritedBy($user);
            return $property;
        });

        return response()->json($offers);
    }

    /**
     * Extract public key / id from media URL
     */
    protected function extractPublicIdFromUrl(string $url): string
    {
        return $this->r2MediaService->extractKeyFromUrl($url);
    }

    /**
     * Consistently format images and multi-videos for property responses, strictly isolating videos from images
     */
    protected function formatPropertyMedia($property, $user = null)
    {
        if (!$property) return $property;

        $rawImages = $property->relationLoaded('media')
            ? $property->media
            : $property->media()->get();
        $pureImages = collect();
        $videosList = [];

        // Check if property already has a primary video URL
        $primaryVideoUrl = $property->video_url;

        foreach ($rawImages as $img) {
            $url = $img->image_url ?? '';
            $isVideo = ($img->media_type === 'video') || 
                       preg_match('/\.(mp4|webm|mov|mkv|avi|m3u8)(\?.*)?$/i', $url) ||
                       str_contains($url, '/sakani/properties/videos/') ||
                       str_contains($url, '/video/upload/') ||
                       str_contains($url, 'youtube.com') ||
                       str_contains($url, 'youtu.be');

            if ($isVideo) {
                if (empty($primaryVideoUrl)) {
                    $primaryVideoUrl = $url;
                }
                $videosList[] = [
                    'id' => $img->id,
                    'url' => $url,
                    'title' => $img->caption ?: 'فيديو جولة العقار',
                    'type' => $img->image_type ?: 'walkthrough',
                    'thumbnail_url' => $property->video_thumbnail_url ?: null,
                    'is_primary' => (bool)$img->is_primary,
                ];
            } else {
                $pureImages->push($img);
            }
        }

        if (empty($videosList) && !empty($primaryVideoUrl)) {
            $videosList[] = [
                'id' => 0,
                'url' => $primaryVideoUrl,
                'title' => 'فيديو جولة العقار الرئيسية',
                'type' => 'walkthrough',
                'thumbnail_url' => $property->video_thumbnail_url ?: null,
                'is_primary' => true,
            ];
        }

        $property->video_url = $primaryVideoUrl;
        $property->videos = $videosList;
        $property->setRelation('images', $pureImages);

        // Assign primary image (guaranteed to be a photo, never a video)
        $primaryImage = $pureImages->where('is_primary', true)->first() ?: $pureImages->first();
        $property->primary_image = $primaryImage;
        $property->image_url = $primaryImage?->image_url ?: ($property->video_thumbnail_url ?: '/default-property.svg');

        $property->images_by_type = $pureImages->groupBy('image_type')->map(function ($typeImages, $type) {
            return [
                'type' => $type,
                'type_label' => PropertyImage::IMAGE_TYPES[$type] ?? $type,
                'images' => $typeImages,
                'count' => $typeImages->count(),
            ];
        });
        $property->total_images = $pureImages->count();

        $property->cached_views = ($property->views ?? 0) + (Cache::get("property_views_{$property->id}", 0));
        if ($user) {
            $property->is_favorite = $property->isFavoritedBy($user);
        }

        return $property;
    }

    /**
     * Normalize finishing string (Arabic or English) to enum slug
     */
    protected function normalizeFinishingValue(?string $val): string
    {
        if (empty($val)) return 'super_lux';
        $str = mb_strtolower(trim($val));
        if (str_contains($str, 'سوبر') || $str === 'super_lux') return 'super_lux';
        if (str_contains($str, 'لوكس') || $str === 'lux') return 'lux';
        if (str_contains($str, 'نصف') || str_contains($str, 'محارة') || $str === 'semi_finished') return 'semi_finished';
        if (str_contains($str, 'طوب') || str_contains($str, 'هيكل') || $str === 'red_brick') return 'red_brick';
        return in_array($str, ['super_lux', 'lux', 'semi_finished', 'red_brick']) ? $str : 'super_lux';
    }

    /**
     * Normalize furnishing string (Arabic or English) to enum slug
     */
    protected function normalizeFurnishingValue(?string $val): string
    {
        if (empty($val)) return 'unfurnished';
        $str = mb_strtolower(trim($val));
        if ((str_contains($str, 'مفروش') && !str_contains($str, 'غير')) || $str === 'furnished') return 'furnished';
        return 'unfurnished';
    }

    /**
     * Resolve the persisted category from the form's operation type. The catalog
     * uses `rent` for rentals and `sell` for properties offered for sale.
     */
    protected function resolveCategoryId(Request $request, ?int $fallbackId = null): int
    {
        if ($request->filled('operation_type')) {
            $operation = $request->string('operation_type')->toString();
            $slugs = $operation === 'rent' ? ['rent'] : ['sell', 'sale', 'buy'];
            $category = Category::whereIn('slug', $slugs)
                ->orderByRaw("CASE slug WHEN 'rent' THEN 0 WHEN 'sell' THEN 0 WHEN 'sale' THEN 1 ELSE 2 END")
                ->first();
            if ($category) {
                return (int) $category->id;
            }
        }

        $categoryId = $request->input('category_id', $fallbackId);
        if ($categoryId && Category::whereKey($categoryId)->exists()) {
            return (int) $categoryId;
        }

        throw ValidationException::withMessages([
            'operation_type' => ['تعذر تحديد نوع العملية العقارية.'],
        ]);
    }

    protected function resolvePropertyTypeId(Request $request, int $categoryId, ?int $fallbackId = null): int
    {
        if ($request->filled('property_type')) {
            $names = $this->propertyTypeNamesForSlug($request->string('property_type')->toString());
            $type = PropertyType::where('category_id', $categoryId)
                ->where(function ($query) use ($names) {
                    foreach ($names as $name) {
                        $query->orWhere('name', 'like', "%{$name}%");
                    }
                })
                ->first();
            if ($type) {
                return (int) $type->id;
            }
        }

        $requestedId = $request->input('property_type_id', $fallbackId);
        if ($requestedId) {
            $type = PropertyType::whereKey($requestedId)->where('category_id', $categoryId)->first();
            if ($type) {
                return (int) $type->id;
            }
        }

        throw ValidationException::withMessages([
            'property_type' => ['نوع العقار المحدد غير متاح لهذه العملية.'],
        ]);
    }

    protected function propertyTypeNamesForSlug(string $slug): array
    {
        return match ($slug) {
            'apartment' => ['شقة'],
            'villa' => ['فيلا'],
            'duplex' => ['دوبلكس'],
            'penthouse' => ['بنتهاوس'],
            'studio' => ['ستوديو', 'استوديو'],
            'shop' => ['محل'],
            'land' => ['أرض', 'ارض'],
            'office' => ['مكتب'],
            'chalet' => ['شاليه'],
            'building' => ['عمارة', 'مبنى', 'محلق'],
            default => [$slug],
        };
    }

    /**
     * Resolve amenity IDs from mixed input (numeric IDs, slugs, or Arabic names)
     */
    protected function resolveAmenityIds(array $items): array
    {
        $ids = [];
        foreach ($items as $item) {
            if (empty($item)) continue;
            if (is_numeric($item)) {
                $ids[] = (int) $item;
            } elseif (is_string($item)) {
                $name = trim($item);
                $amenity = \App\Models\Amenity::where('name', $name)->first();
                if (!$amenity) {
                    $amenity = \App\Models\Amenity::firstOrCreate(['name' => $name]);
                }
                $ids[] = $amenity->id;
            }
        }
        return array_values(array_unique($ids));
    }

    /**
     * Resolve tag IDs from mixed input (numeric IDs, slugs, or Arabic names)
     */
    protected function resolveTagIds(array $items): array
    {
        $ids = [];
        foreach ($items as $item) {
            if (empty($item)) continue;
            if (is_numeric($item)) {
                $ids[] = (int) $item;
            } elseif (is_string($item)) {
                $name = trim($item);
                $tag = \App\Models\Tag::where('name', $name)->first();
                if (!$tag) {
                    $slug = \Illuminate\Support\Str::slug($name) ?: ('tag-' . substr(md5($name), 0, 8));
                    $tag = \App\Models\Tag::firstOrCreate(['name' => $name], ['slug' => $slug]);
                }
                $ids[] = $tag->id;
            }
        }
        return array_values(array_unique($ids));
    }
}
