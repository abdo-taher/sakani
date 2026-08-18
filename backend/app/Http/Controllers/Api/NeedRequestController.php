<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NeedRequest;
use App\Models\Notification;
use App\Services\NotificationService;
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

        // Prevent accidental rapid duplicate submission
        $existing = NeedRequest::where('phone', $validated['phone'])
            ->where('budget', $validated['budget'])
            ->where('created_at', '>=', now()->subSeconds(30))
            ->first();

        if ($existing) {
            return response()->json([
                'success' => true,
                'message' => 'تم استلام طلبك مسبقاً وجاري معالجته.',
                'data' => $existing
            ], 200);
        }

        $needRequest = NeedRequest::create($validated);

        try {
            NotificationService::onNeedRequestCreated($needRequest);
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
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

        $oldStatus = $needRequest->status;
        $needRequest->update($validated);
        $newStatus = $needRequest->status;

        if ($oldStatus !== $newStatus) {
            try {
                NotificationService::onNeedRequestStatusChanged($needRequest, $oldStatus, $newStatus);
            } catch (\Throwable $e) {}
        }

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