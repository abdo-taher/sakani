<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Location;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    // عرض كل الأماكن
    public function index()
    {
        $locations = Location::withCount(['properties as available_count' => function ($q) {
            $q->where('status', 'available')->where('is_uploading', false);
        }])->get();

        $locations->transform(function ($loc) {
            $minPrice = $loc->properties()
                ->where('status', 'available')
                ->where('price', '>', 0)
                ->min('price');
            $loc->min_price = $minPrice ? (float) $minPrice : null;
            return $loc;
        });

        return response()->json($locations);
    }

    // إضافة مكان جديد
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:locations,name',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'address' => 'nullable|string|max:500',
            'image_url' => 'nullable|string|max:1000',
            'image_public_id' => 'nullable|string|max:500',
        ]);

        $location = Location::create([
            'name' => $request->name,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'address' => $request->address,
            'image_url' => $request->image_url,
            'image_public_id' => $request->image_public_id,
        ]);

        return response()->json([
            'message' => 'Location created successfully',
            'data' => $location,
        ], 201);
    }

    // عرض مكان واحد
    public function show($id)
    {
        $location = Location::findOrFail($id);

        return response()->json($location);
    }

    // تعديل مكان
    public function update(Request $request, $id)
    {
        $location = Location::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:locations,name,' . $id,
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'address' => 'nullable|string|max:500',
            'image_url' => 'nullable|string|max:1000',
            'image_public_id' => 'nullable|string|max:500',
        ]);

        $location->update([
            'name' => $request->name,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'address' => $request->address,
            'image_url' => $request->image_url,
            'image_public_id' => $request->image_public_id,
        ]);

        return response()->json([
            'message' => 'Location updated successfully',
            'data' => $location,
        ]);
    }

    // حذف مكان
    public function destroy($id)
    {
        $location = Location::findOrFail($id);

        $location->delete();

        return response()->json([
            'message' => 'Location deleted successfully'
        ]);
    }
}