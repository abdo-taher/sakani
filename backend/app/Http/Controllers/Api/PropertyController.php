<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Services\VideoUploadService;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Exception;

class PropertyController extends Controller
{
    protected VideoUploadService $videoUploadService;
    protected CloudinaryService $cloudinaryService;

    public function __construct(VideoUploadService $videoUploadService, CloudinaryService $cloudinaryService)
    {
        $this->videoUploadService = $videoUploadService;
        $this->cloudinaryService = $cloudinaryService;
    }
    public function index(Request $request)
    {
        $user = $request->user();
        $properties = Property::with([
            'category', 
            'propertyType', 
            'location', 
            'images', 
            'amenities'
        ])->latest()->get();

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

    public function byCategory(Request $request, $category)
    {
        $user = $request->user();
        $properties = Property::with([
            'category', 
            'propertyType', 
            'location', 
            'images', 
            'amenities'
        ])->whereHas('category', function ($query) use ($category) {
            $query->where('slug', $category);
        })->latest()->get();

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
            'price' => 'required|numeric',
            'property_type_id' => 'required|exists:property_types,id',
            'category_id' => 'required|exists:categories,id',
            'location_id' => 'required|exists:locations,id',
            'area' => 'required|integer',
            'rooms' => 'required|integer',
            'bathrooms' => 'required|integer',
            'floor' => 'nullable|integer',
            'balconies' => 'nullable|integer',
            'finishing' => 'nullable|in:super_lux,lux,semi_finished,red_brick',
            'furnishing' => 'nullable|in:furnished,unfurnished',
            'video' => 'nullable|file|mimes:mp4,mpeg,quicktime,avi,webm,flv,3gp,wmv|max:' . (config('video_upload.max_size', 104857600) / 1024),
            'video_url' => 'nullable|string',
            'video_public_id' => 'nullable|string',
            'video_driver' => 'nullable|string',
            'video_file_path' => 'nullable|string',
            'status' => 'nullable|in:available,reserved,sold,rented',
            'featured' => 'boolean',
            
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
        ]);

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
            } elseif ($request->filled(['video_url', 'video_public_id'])) {
                // Use provided video data (from previous upload or external source)
                $videoData = [
                    'video_url' => $request->video_url,
                    'video_public_id' => $request->video_public_id,
                    'video_driver' => $request->video_driver,
                    'video_file_path' => $request->video_file_path,
                ];
            }

            $propertyData = [
                'title' => $request->title,
                'description' => $request->description,
                'price' => $request->price,
                'property_type_id' => $request->property_type_id,
                'category_id' => $request->category_id,
                'location_id' => $request->location_id,
                'area' => $request->area,
                'rooms' => $request->rooms,
                'bathrooms' => $request->bathrooms,
                'floor' => $request->floor,
                'balconies' => $request->balconies,
                'finishing' => $request->filled('finishing') ? $request->finishing : 'red_brick',
                'furnishing' => $request->filled('furnishing') ? $request->furnishing : 'unfurnished',
                'status' => $request->status ?? 'available',
                'featured' => $request->featured ?? false,
                'is_uploading' => true,
            ];

            // Merge video data if available
            $propertyData = array_merge($propertyData, $videoData);

            $property = Property::create($propertyData);
    
            if ($request->filled('amenities')) {
                $property->amenities()->sync($request->amenities);
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
                        $imageUrl = $this->cloudinaryService->uploadImage($image);
                        $publicId = $this->extractPublicIdFromUrl($imageUrl);

                        $propertyImage = PropertyImage::create([
                            'property_id' => $property->id,
                            'image_url' => $imageUrl,
                            'image_public_id' => $publicId,
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
                
                foreach ($uploadedImageData as $index => $imageData) {
                    try {
                        $propertyImage = PropertyImage::create([
                            'property_id' => $property->id,
                            'image_url' => $imageData['image_url'],
                            'image_public_id' => $imageData['image_public_id'],
                            'sort_order' => count($uploadedImages) + $index,
                            'image_type' => $imageData['image_type'] ?? 'property',
                            'caption' => $imageData['caption'] ?? null,
                            'is_primary' => count($uploadedImages) === 0 && $index === 0,
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
                'amenities'
            ])->find($property->id);

            // Add computed attributes
            $property->primary_image = $property->images->where('is_primary', true)->first();
            $property->images_by_type = $property->images->groupBy('image_type');
            $property->total_images = $property->images->count();

            $message = 'Property created successfully';
            if (!empty($imageErrors)) {
                $message .= '. Some images failed to upload: ' . implode(', ', $imageErrors);
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'property' => $property,
                    'uploaded_images_count' => count($uploadedImages),
                    'image_errors' => $imageErrors,
                ]
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
        $property = Property::with([
            'category', 
            'propertyType', 
            'location', 
            'images' => function($query) {
                $query->ordered();
            }, 
            'amenities',
            'reservations',
        ])->findOrFail($id);
        
        // Add computed attributes for frontend display
        $property->primary_image = $property->images->where('is_primary', true)->first();
        $property->images_by_type = $property->images->groupBy('image_type')->map(function ($typeImages, $type) {
            return [
                'type' => $type,
                'type_label' => PropertyImage::IMAGE_TYPES[$type] ?? $type,
                'images' => $typeImages,
                'count' => $typeImages->count(),
            ];
        });
        $property->total_images = $property->images->count();
        
        // Add favorite status
        $property->is_favorite = $property->isFavoritedBy($user);
        
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
            'property_type_id' => 'sometimes|required|exists:property_types,id',
            'category_id' => 'sometimes|required|exists:categories,id',
            'location_id' => 'sometimes|required|exists:locations,id',
            'area' => 'sometimes|required|integer|min:1',
            'rooms' => 'sometimes|required|integer|min:0',
            'bathrooms' => 'sometimes|required|integer|min:0',
            'floor' => 'sometimes|nullable|integer|min:0',
            'balconies' => 'sometimes|nullable|integer|min:0',
            'finishing' => 'sometimes|nullable|in:super_lux,lux,semi_finished,red_brick',
            'furnishing' => 'sometimes|nullable|in:furnished,unfurnished',
            'video' => 'sometimes|file|mimes:mp4,mpeg,quicktime,avi,webm,flv,3gp,wmv|max:' . (config('video_upload.max_size', 104857600) / 1024),
            'video_url' => 'sometimes|nullable|string|max:500',
            'video_public_id' => 'sometimes|nullable|string|max:200',
            'video_driver' => 'sometimes|nullable|string',
            'video_file_path' => 'sometimes|nullable|string',
            'remove_video' => 'sometimes|boolean',
            'remove_images' => 'sometimes|array',
            'remove_images.*' => 'integer|exists:property_images,id',
            'status' => 'sometimes|nullable|in:available,reserved,sold,rented',
            'featured' => 'sometimes|boolean',
            'amenities' => 'sometimes|array',
            'amenities.*' => 'exists:amenities,id',
        ]);

        $updateData = $request->only([
            'title', 'description', 'price', 'property_type_id', 'category_id', 
            'location_id', 'area', 'rooms', 'bathrooms', 'floor', 'balconies', 
            'finishing', 'furnishing', 'status', 'featured'
        ]);

        // Handle video removal
        if ($request->boolean('remove_video')) {
            try {
                if ($property->video_driver && $property->video_file_path) {
                    $this->videoUploadService->deleteVideo($property->video_driver, $property->video_file_path);
                }
            } catch (Exception $e) {
                Log::warning('Failed to delete old video: ' . $e->getMessage());
            }

            $property->images()->where('media_type', 'video')->delete();

            $updateData = array_merge($updateData, [
                'video_url' => null,
                'video_public_id' => null,
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
        // Handle provided video data (from separate upload)
        elseif ($request->filled(['video_url', 'video_public_id'])) {
            $updateData = array_merge($updateData, [
                'video_url' => $request->video_url,
                'video_public_id' => $request->video_public_id,
                'video_driver' => $request->video_driver,
                'video_file_path' => $request->video_file_path,
            ]);
        }

        $property->update($updateData);

        // Remove specified images
        if ($request->has('remove_images') && is_array($request->remove_images)) {
            $property->images()->whereIn('id', $request->remove_images)->delete();
        }

        // Update amenities if provided
        if ($request->has('amenities')) {
            $property->amenities()->sync($request->amenities);
        }

        return response()->json([
            'message' => 'Property updated successfully',
            'data' => Property::with('category', 'propertyType', 'location', 'images', 'amenities')->find($property->id)
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
        
        return response()->json(['message' => 'Property deleted successfully']);
    }

    public function uploadComplete($id)
    {
        $property = Property::findOrFail($id);
        $property->update(['is_uploading' => false]);

        return response()->json([
            'success' => true,
            'message' => 'تم الانتهاء من رفع الوسائط'
        ]);
    }

    public function recordView($id)
    {
        $key = "property_views_{$id}";
        $count = Cache::get($key, 0);
        Cache::put($key, $count + 1, now()->addMinutes(30));

        if (($count + 1) % 10 === 0) {
            Property::where('id', $id)->increment('views', $count + 1);
            Cache::put($key, 0, now()->addMinutes(30));
        }

        return response()->json(['success' => true]);
    }

    public function topViewed()
    {
        $properties = Property::with([
            'category', 'propertyType', 'location', 'images', 'amenities'
        ])
        ->where('status', 'available')
        ->where('is_uploading', false)
        ->orderByDesc('views')
        ->limit(2)
        ->get();

        $properties->transform(function ($property) {
            $property->primary_image = $property->images->where('is_primary', true)->first();
            $property->total_images = $property->images->count();
            $property->cached_views = $property->views + (Cache::get("property_views_{$property->id}", 0));
            return $property;
        });

        return response()->json($properties);
    }

    /**
     * Extract Cloudinary public_id from URL
     */
    protected function extractPublicIdFromUrl(string $url): string
    {
        // Extract public_id from Cloudinary URL
        // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg
        preg_match('/\/upload\/(?:v\d+\/)?([^\/]+\.[^\/]+)/', $url, $matches);
        return $matches[1] ?? basename($url);
    }
}