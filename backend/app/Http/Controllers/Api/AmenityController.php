<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Amenity;
use Illuminate\Http\Request;

class AmenityController extends Controller
{
    public function index()
    {
        return response()->json(Amenity::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:amenities,name',
            'icon' => 'nullable|string'
        ]);

        $amenity = Amenity::create([
            'name' => $request->name,
            'icon' => $request->icon
        ]);

        return response()->json([
            'message' => 'Amenity created successfully',
            'data' => $amenity
        ], 201);
    }

    public function show($id)
    {
        return response()->json(Amenity::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $amenity = Amenity::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:amenities,name,' . $id,
            'icon' => 'nullable|string'
        ]);

        $amenity->update([
            'name' => $request->name,
            'icon' => $request->icon
        ]);

        return response()->json([
            'message' => 'Amenity updated successfully',
            'data' => $amenity
        ]);
    }

    public function destroy($id)
    {
        Amenity::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Amenity deleted successfully'
        ]);
    }
}