<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NeedRequest;
use Illuminate\Http\Request;

class NeedRequestController extends Controller
{
    // عرض كل الطلبات
    public function index()
{
    $requests = NeedRequest::latest()->get();

    return response()->json($requests);
}

    // إنشاء طلب جديد
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',

            'listing_type' => 'required|in:buy,rent',

           'property_type' => 'required|string|max:255',

           'location' => 'required|string|max:255',

            'budget' => 'required|numeric',

            'area' => 'nullable|integer',

            'rooms' => 'nullable|integer',

            'rent_duration' => 'nullable|string|max:100',

            'notes' => 'nullable|string',
        ]);

        $needRequest = NeedRequest::create($validated);

        return response()->json([
            'message' => 'Request created successfully.',
            'data' => $needRequest
        ], 201);
    }
    // تحديث حالة الطلب
public function update(Request $request, NeedRequest $needRequest)
{
    $validated = $request->validate([
        'status' => 'required|in:pending,contacted',
    ]);

    $needRequest->update($validated);

    return response()->json([
        'message' => 'Request updated successfully.',
        'data' => $needRequest,
    ]);
}

// حذف الطلب
public function destroy(NeedRequest $needRequest)
{
    $needRequest->delete();

    return response()->json([
        'message' => 'Request deleted successfully.',
    ]);
}
}