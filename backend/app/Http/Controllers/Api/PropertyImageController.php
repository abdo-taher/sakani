<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PropertyImage;
use App\Models\Property;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Exception;

class PropertyImageController extends Controller
{
    protected CloudinaryService $cloudinaryService;

    public function __construct(CloudinaryService $cloudinaryService)
    {
        $this->cloudinaryService = $cloudinaryService;
    }

    public function index(Request $request)
    {
        $query = PropertyImage::with('property')->ordered();

        // Filter by property ID if provided
        if ($request->has('property_id')) {
            $query->where('property_id', $request->property_id);
        }

        // Filter by image type if provided
        if ($request->has('image_type')) {
            $query->ofType($request->image_type);
        }

        return response()->json($query->get());
    }

    /**
     * Upload multiple images for a property
     */
    public function uploadMultiple(Request $request)
    {
        try {
            $request->validate([
                'property_id' => 'required|exists:properties,id',
                'images' => 'required|array|min:1|max:20',
                'images.*' => 'required|file|image|mimes:jpeg,jpg,png,webp|max:10240', // 10MB max per image
                'image_types' => 'sometimes|array',
                'image_types.*' => 'sometimes|string|in:' . implode(',', array_keys(PropertyImage::IMAGE_TYPES)),
                'captions' => 'sometimes|array',
                'captions.*' => 'sometimes|string|max:255',
                'set_first_as_primary' => 'sometimes|boolean',
            ]);

            $propertyId = $request->property_id;
            $images = $request->file('images');
            $imageTypes = $request->input('image_types', []);
            $captions = $request->input('captions', []);
            $setFirstAsPrimary = $request->boolean('set_first_as_primary', true);

            $uploadedImages = [];
            $errors = [];

            DB::beginTransaction();

            try {
                // If setting first as primary, clear existing primary images
                if ($setFirstAsPrimary) {
                    PropertyImage::where('property_id', $propertyId)
                        ->where('is_primary', true)
                        ->update(['is_primary' => false]);
                }

                // Get current max sort order
                $maxSortOrder = PropertyImage::where('property_id', $propertyId)
                    ->max('sort_order') ?? -1;

                foreach ($images as $index => $image) {
                    try {
                        Log::info("Uploading image {$index} for property {$propertyId}");

                        // Upload to Cloudinary
                        $imageUrl = $this->cloudinaryService->uploadImage($image);
                        
                        // Extract public_id from URL (Cloudinary specific)
                        $publicId = $this->extractPublicIdFromUrl($imageUrl);

                        // Create database record
                        $propertyImage = PropertyImage::create([
                            'property_id' => $propertyId,
                            'image_url' => $imageUrl,
                            'image_public_id' => $publicId,
                            'sort_order' => $maxSortOrder + $index + 1,
                            'image_type' => $imageTypes[$index] ?? 'property',
                            'caption' => $captions[$index] ?? null,
                            'is_primary' => $setFirstAsPrimary && $index === 0,
                        ]);

                        $uploadedImages[] = $propertyImage;
                        
                        Log::info("Image uploaded successfully", [
                            'image_id' => $propertyImage->id,
                            'url' => $imageUrl
                        ]);

                    } catch (Exception $e) {
                        Log::error("Failed to upload image {$index}: " . $e->getMessage());
                        $errors[] = "Image " . ($index + 1) . ": " . $e->getMessage();
                    }
                }

                DB::commit();

                $message = count($uploadedImages) . ' images uploaded successfully';
                if (!empty($errors)) {
                    $message .= '. Some images failed: ' . implode(', ', $errors);
                }

                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'data' => [
                        'uploaded_images' => $uploadedImages,
                        'errors' => $errors,
                        'total_uploaded' => count($uploadedImages),
                        'total_errors' => count($errors),
                    ]
                ], count($errors) > 0 ? 207 : 201); // 207 Multi-Status if partial success

            } catch (Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (Exception $e) {
            Log::error('Multiple image upload failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Image upload failed: ' . $e->getMessage()
            ], 422);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'property_id' => 'required|exists:properties,id',
                'image' => 'sometimes|file|image|mimes:jpeg,jpg,png,webp|max:10240',
                'image_url' => 'required_without:image|string|max:500|url',
                'image_public_id' => 'required_without:image|string|max:200',
                'sort_order' => 'sometimes|integer|min:0',
                'image_type' => 'sometimes|string|in:' . implode(',', array_keys(PropertyImage::IMAGE_TYPES)),
                'caption' => 'sometimes|string|max:255',
                'is_primary' => 'sometimes|boolean',
                'media_type' => 'sometimes|string|in:image,video',
            ]);

            $propertyId = $request->property_id;
            $imageUrl = $request->image_url;
            $publicId = $request->image_public_id;

            // If uploading new image file
            if ($request->hasFile('image')) {
                $imageUrl = $this->cloudinaryService->uploadImage($request->file('image'));
                $publicId = $this->extractPublicIdFromUrl($imageUrl);
            }

            // Validate URL format and domain (Cloudinary) in production (skip for videos)
            if ($request->input('media_type', 'image') === 'image' && !str_contains($imageUrl, 'cloudinary.com') && !app()->environment('local')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid image URL. Only Cloudinary URLs are allowed.'
                ], 422);
            }

            DB::beginTransaction();

            try {
                // If setting as primary, clear existing primary images
                if ($request->boolean('is_primary')) {
                    PropertyImage::where('property_id', $propertyId)
                        ->where('is_primary', true)
                        ->update(['is_primary' => false]);
                }

                // Get sort order
                $sortOrder = $request->input('sort_order');
                if ($sortOrder === null) {
                    $sortOrder = (PropertyImage::where('property_id', $propertyId)->max('sort_order') ?? -1) + 1;
                }

                $image = PropertyImage::create([
                    'property_id' => $propertyId,
                    'image_url' => $imageUrl,
                    'image_public_id' => $publicId,
                    'media_type' => $request->input('media_type', 'image'),
                    'sort_order' => $sortOrder,
                    'image_type' => $request->input('image_type', 'property'),
                    'caption' => $request->input('caption'),
                    'is_primary' => $request->boolean('is_primary', false),
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Image added successfully',
                    'data' => $image->load('property')
                ], 201);

            } catch (Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (Exception $e) {
            Log::error('Image upload failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Image upload failed: ' . $e->getMessage()
            ], 422);
        }
    }

    public function show($id)
    {
        $image = PropertyImage::with('property')->findOrFail($id);
        return response()->json([
            'success' => true,
            'data' => $image
        ]);
    }

    public function update(Request $request, $id)
    {
        try {
            $image = PropertyImage::findOrFail($id);

            $request->validate([
                'property_id' => 'sometimes|required|exists:properties,id',
                'image_url' => 'sometimes|required|string|max:500|url',
                'image_public_id' => 'sometimes|required|string|max:200',
                'sort_order' => 'sometimes|integer|min:0',
                'image_type' => 'sometimes|string|in:' . implode(',', array_keys(PropertyImage::IMAGE_TYPES)),
                'caption' => 'sometimes|string|max:255|nullable',
                'is_primary' => 'sometimes|boolean',
            ]);

            $updateData = $request->only([
                'property_id', 'image_url', 'image_public_id', 'sort_order',
                'image_type', 'caption', 'is_primary'
            ]);

            // Validate URL format if provided
            if (isset($updateData['image_url']) && !str_contains($updateData['image_url'], 'cloudinary.com') && !app()->environment('local')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid image URL. Only Cloudinary URLs are allowed.'
                ], 422);
            }

            DB::beginTransaction();

            try {
                // If setting as primary, clear existing primary images for this property
                if ($request->boolean('is_primary')) {
                    PropertyImage::where('property_id', $image->property_id)
                        ->where('id', '!=', $image->id)
                        ->where('is_primary', true)
                        ->update(['is_primary' => false]);
                }

                $image->update($updateData);
                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Image updated successfully',
                    'data' => $image->load('property')
                ]);

            } catch (Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (Exception $e) {
            Log::error('Image update failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Image update failed: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Update sort order of multiple images
     */
    public function updateSortOrder(Request $request)
    {
        try {
            $request->validate([
                'images' => 'required|array|min:1',
                'images.*.id' => 'required|exists:property_images,id',
                'images.*.sort_order' => 'required|integer|min:0',
            ]);

            DB::beginTransaction();

            foreach ($request->images as $imageData) {
                PropertyImage::where('id', $imageData['id'])
                    ->update(['sort_order' => $imageData['sort_order']]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Sort order updated successfully'
            ]);

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Sort order update failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Sort order update failed: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Set primary image
     */
    public function setPrimary($id)
    {
        try {
            $image = PropertyImage::findOrFail($id);

            DB::beginTransaction();

            // Clear existing primary images for this property
            PropertyImage::where('property_id', $image->property_id)
                ->where('is_primary', true)
                ->update(['is_primary' => false]);

            // Set this image as primary
            $image->update(['is_primary' => true]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Primary image set successfully',
                'data' => $image
            ]);

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Set primary image failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Set primary image failed: ' . $e->getMessage()
            ], 422);
        }
    }

    public function destroy($id)
    {
        try {
            $image = PropertyImage::findOrFail($id);

            // Try to delete from Cloudinary (optional, may fail silently)
            try {
                // Note: Cloudinary deletion requires admin API which might not be configured
                // You can implement this if needed
            } catch (Exception $e) {
                Log::warning("Failed to delete image from Cloudinary: " . $e->getMessage());
            }

            $image->delete();

            return response()->json([
                'success' => true,
                'message' => 'Image deleted successfully'
            ]);

        } catch (Exception $e) {
            Log::error('Image deletion failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Image deletion failed: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Get images grouped by type for a property
     */
    public function getByProperty($propertyId)
    {
        try {
            $property = Property::findOrFail($propertyId);
            
            $images = PropertyImage::where('property_id', $propertyId)
                ->ordered()
                ->get();

            $groupedImages = $images->groupBy('image_type')->map(function ($typeImages) {
                return [
                    'images' => $typeImages,
                    'count' => $typeImages->count(),
                    'type_label' => $typeImages->first()->image_type_label ?? '',
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'property' => $property,
                    'images_by_type' => $groupedImages,
                    'total_images' => $images->count(),
                    'primary_image' => $images->where('is_primary', true)->first(),
                    'available_types' => PropertyImage::IMAGE_TYPES,
                ]
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get property images: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Get image types with Arabic labels
     */
    public function getImageTypes()
    {
        return response()->json([
            'success' => true,
            'data' => PropertyImage::IMAGE_TYPES
        ]);
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