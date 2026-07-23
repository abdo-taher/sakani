<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\UserFavorite;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FavoriteController extends Controller
{
    /**
     * Display a listing of the user's favorite properties.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $favorites = $user->favorites()
            ->with(['location', 'category', 'propertyType', 'images'])
            ->get();

        // Add is_favorite field (always true for favorites list) and other computed fields
        $favorites->transform(function ($property) {
            $property->is_favorite = true;
            $property->primary_image = $property->images->where('is_primary', true)->first();
            $property->images_by_type = $property->images->groupBy('image_type');
            $property->total_images = $property->images->count();
            return $property;
        });

        return response()->json([
            'success' => true,
            'data' => $favorites
        ]);
    }

    /**
     * Add a property to favorites.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'property_id' => 'required|exists:properties,id'
        ]);

        $user = $request->user();
        $propertyId = $request->property_id;

        // Check if already favorited
        $existing = UserFavorite::where('user_id', $user->id)
            ->where('property_id', $propertyId)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Property already in favorites'
            ], 409);
        }

        // Add to favorites
        UserFavorite::create([
            'user_id' => $user->id,
            'property_id' => $propertyId
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Property added to favorites'
        ]);
    }

    /**
     * Remove a property from favorites.
     */
    public function destroy(Request $request, $propertyId): JsonResponse
    {
        $user = $request->user();

        $favorite = UserFavorite::where('user_id', $user->id)
            ->where('property_id', $propertyId)
            ->first();

        if (!$favorite) {
            return response()->json([
                'success' => false,
                'message' => 'Property not in favorites'
            ], 404);
        }

        $favorite->delete();

        return response()->json([
            'success' => true,
            'message' => 'Property removed from favorites'
        ]);
    }

    /**
     * Toggle favorite status for a property.
     */
    public function toggle(Request $request): JsonResponse
    {
        $request->validate([
            'property_id' => 'required|exists:properties,id'
        ]);

        $user = $request->user();
        $propertyId = $request->property_id;

        $favorite = UserFavorite::where('user_id', $user->id)
            ->where('property_id', $propertyId)
            ->first();

        if ($favorite) {
            // Remove from favorites
            $favorite->delete();
            $action = 'removed';
            $isFavorite = false;
        } else {
            // Add to favorites
            UserFavorite::create([
                'user_id' => $user->id,
                'property_id' => $propertyId
            ]);
            $action = 'added';
            $isFavorite = true;
        }

        return response()->json([
            'success' => true,
            'message' => "Property {$action} to/from favorites",
            'action' => $action,
            'is_favorite' => $isFavorite,
            'property_id' => $propertyId
        ]);
    }

    /**
     * Check if a property is favorited by the user.
     */
    public function check(Request $request, $propertyId): JsonResponse
    {
        $user = $request->user();

        $isFavorite = UserFavorite::where('user_id', $user->id)
            ->where('property_id', $propertyId)
            ->exists();

        return response()->json([
            'success' => true,
            'is_favorite' => $isFavorite
        ]);
    }

    /**
     * Sync guest favorites when user logs in.
     */
    public function syncGuestFavorites(Request $request): JsonResponse
    {
        $request->validate([
            'property_ids' => 'required|array',
            'property_ids.*' => 'exists:properties,id'
        ]);

        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        $propertyIds = $request->property_ids;
        $syncedCount = 0;

        foreach ($propertyIds as $propertyId) {
            // Only add if not already favorited
            $exists = UserFavorite::where('user_id', $user->id)
                ->where('property_id', $propertyId)
                ->exists();

            if (!$exists) {
                UserFavorite::create([
                    'user_id' => $user->id,
                    'property_id' => $propertyId
                ]);
                $syncedCount++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Synced {$syncedCount} favorites",
            'synced_count' => $syncedCount
        ]);
    }
}