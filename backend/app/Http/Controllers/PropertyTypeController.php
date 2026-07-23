<?php

namespace App\Http\Controllers;

use App\Models\PropertyType;
use Illuminate\Http\Request;

class PropertyTypeController extends Controller
{
    public function index()
    {
        return response()->json(
            PropertyType::with('category')->get()
        );
    }

    public function store(Request $request)
    {
       
        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
        ]);

        $propertyType = PropertyType::create([
            'category_id' => $request->category_id,
            'name' => $request->name,
        ]);

        return response()->json([
            'message' => 'Property Type created successfully',
            'data' => $propertyType
        ], 201);
    }

    public function show($id)
    {
        return response()->json(
            PropertyType::with('category')->findOrFail($id)
        );
    }

    public function update(Request $request, $id)
    {
        $propertyType = PropertyType::findOrFail($id);

        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
        ]);

        $propertyType->update([
            'category_id' => $request->category_id,
            'name' => $request->name,
        ]);

        return response()->json([
            'message' => 'Updated successfully',
            'data' => $propertyType
        ]);
    }

    public function destroy($id)
    {
        PropertyType::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Deleted successfully'
        ]);
    }
}