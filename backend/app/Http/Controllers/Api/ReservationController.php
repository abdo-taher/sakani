<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Notification;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    public function index()
    {
       return response()->json(
    Reservation::with([
        'property.category',
        'property.propertyType',
        'property.location',
        'property.images',
        'property.amenities',
    ])->get()
);
    }

    public function store(Request $request)
    {
        $request->validate([
            'property_id' => 'required|exists:properties,id',
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'message' => 'nullable|string',
        ]);

        $reservation = Reservation::create([
            'property_id' => $request->property_id,
            'name' => $request->name,
            'phone' => $request->phone,
            'message' => $request->message,
            'status' => 'pending'
        ]);

        Notification::create([
            'type' => 'reservation',
            'title' => 'طلب حجز جديد',
            'message' => "{$request->name} قدم طلب حجز على عقار",
            'link' => '/dashboard/reservations',
        ]);

        return response()->json([
            'message' => 'Reservation created successfully',
            'data' => $reservation
        ], 201);
    }

    public function show($id)
    {
        return response()->json(
            Reservation::with([
    'property.category',
    'property.propertyType',
    'property.location',
    'property.images',
    'property.amenities',
])->findOrFail($id)
        );
    }

    public function update(Request $request, $id)
    {
        $reservation = Reservation::findOrFail($id);

$request->validate([
    'status' => 'required|in:pending,contacted',
]);

$reservation->update([
    'status' => $request->status,
]);

        return response()->json([
            'message' => 'Reservation updated successfully',
            'data' => $reservation
        ]);
    }

    public function destroy($id)
    {
        Reservation::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Reservation deleted successfully'
        ]);
    }
}