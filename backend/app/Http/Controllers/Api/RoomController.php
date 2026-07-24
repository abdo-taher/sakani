<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\RoomImage;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class RoomController extends Controller
{
    public function show($id)
    {
        $room = Room::with('roomImages')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $room,
        ]);
    }

    public function store(Request $request, $propertyId)
    {
        $property = Property::findOrFail($propertyId);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'area' => 'nullable|integer|min:1',
        ]);

        $room = Room::create([
            'property_id' => $propertyId,
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'area' => $request->area,
            'status' => 'available',
            'is_uploading' => true,
        ]);

        // Auto-enable detailed rooms on property
        if (!$property->has_detailed_rooms) {
            $property->update(['has_detailed_rooms' => true]);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء الغرفة بنجاح',
            'data' => $room,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $room = Room::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'area' => 'sometimes|nullable|integer|min:1',
            'status' => 'sometimes|nullable|in:available,reserved,rented',
        ]);

        $room->update($request->only(['name', 'description', 'price', 'area', 'status']));

        return response()->json([
            'success' => true,
            'message' => 'تم تعديل الغرفة بنجاح',
            'data' => $room->load('roomImages'),
        ]);
    }

    public function destroy($id)
    {
        $room = Room::findOrFail($id);
        $property = $room->property;

        $room->delete();

        // If no rooms left, disable detailed rooms
        if ($property && $property->rooms()->count() === 0) {
            $property->update(['has_detailed_rooms' => false]);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الغرفة بنجاح',
        ]);
    }

    public function uploadImage(Request $request, $roomId)
    {
        $room = Room::findOrFail($roomId);

        $request->validate([
            'image_url' => 'required|string',
            'image_public_id' => 'required|string',
            'media_type' => 'nullable|string|in:image,video',
            'is_primary' => 'nullable|boolean',
        ]);

        $isFirst = $room->roomImages()->count() === 0;

        $image = RoomImage::create([
            'room_id' => $roomId,
            'image_url' => $request->image_url,
            'image_public_id' => $request->image_public_id,
            'media_type' => $request->media_type ?? 'image',
            'sort_order' => $room->roomImages()->count(),
            'is_primary' => $request->boolean('is_primary', $isFirst),
        ]);

        // Mark upload complete if this is the first image
        if ($isFirst) {
            $room->update(['is_uploading' => false]);
        }

        return response()->json([
            'success' => true,
            'data' => $image,
        ], 201);
    }

    public function destroyImage($id)
    {
        $image = RoomImage::findOrFail($id);
        $roomId = $image->room_id;
        $wasPrimary = $image->is_primary;

        $image->delete();

        // If deleted image was primary, set the first remaining as primary
        if ($wasPrimary) {
            $firstImage = RoomImage::where('room_id', $roomId)->first();
            if ($firstImage) {
                $firstImage->update(['is_primary' => true]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الصورة',
        ]);
    }

    public function markUploadComplete($id)
    {
        $room = Room::findOrFail($id);
        $room->update(['is_uploading' => false]);

        return response()->json([
            'success' => true,
            'message' => 'تم الانتهاء من رفع الوسائط',
        ]);
    }
}
