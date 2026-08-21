<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Notification;
use App\Models\Property;
use App\Services\NotificationService;
use App\Services\FirebaseNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReservationController extends Controller
{
    /**
     * Normalize phone number to handle Egyptian / international formats consistently.
     */
    public function normalizePhone(?string $phone): string
    {
        if (!$phone) {
            return '';
        }
        // Keep only digits
        $clean = preg_replace('/\D/', '', $phone);

        // If Egyptian number starting with 20 (e.g., 201012345678), convert to 01012345678
        if (str_starts_with($clean, '20') && strlen($clean) > 10) {
            $clean = '0' . substr($clean, 2);
        }

        return $clean;
    }

    /**
     * Active reservation statuses.
     */
    public function activeStatuses(): array
    {
        return ['pending', 'contacted', 'accepted', 'confirmed', 'in_progress', 'new'];
    }

    /**
     * Inactive / terminal reservation statuses.
     */
    public function inactiveStatuses(): array
    {
        return ['completed', 'cancelled', 'rejected'];
    }

    public function index(Request $request)
    {
        $user = $request->user('sanctum') ?: $request->user();

        // If authenticated admin, return full management list
        if ($user && in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json(
                Reservation::with([
                    'property.category',
                    'property.propertyType',
                    'property.location',
                    'property.images',
                    'property.amenities',
                    'room',
                ])->latest()->get()
            );
        }

        // If guest / customer, return their customer-scoped reservations safely
        return $this->customerIndex($request);
    }

    /**
     * Store a new reservation enforcing the core business rule:
     * ONE ACTIVE RESERVATION PER PROPERTY.
     *
     * A customer MAY reserve multiple different available properties,
     * but the SAME property cannot have multiple active reservations.
     */
    public function store(Request $request)
    {
        $request->validate([
            'property_id' => 'required|exists:properties,id',
            'room_id' => 'nullable|exists:rooms,id',
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:25',
            'message' => 'nullable|string',
        ]);

        $rawPhone = trim($request->phone);
        $normalizedPhone = $this->normalizePhone($rawPhone);
        $propertyId = (int) $request->property_id;
        $roomId = $request->filled('room_id') ? (int) $request->room_id : null;
        $activeStatuses = $this->activeStatuses();

        // Enforce concurrency safety with pessimistic lock inside a DB transaction
        return DB::transaction(function () use ($request, $rawPhone, $normalizedPhone, $propertyId, $roomId, $activeStatuses) {
            // 1. Lock and inspect target property
            $property = Property::where('id', $propertyId)->lockForUpdate()->first();
            if (!$property) {
                return response()->json([
                    'success' => false,
                    'message' => 'عفواً، لم يتم العثور على العقار المطلوب.',
                    'error_code' => 'PROPERTY_NOT_FOUND',
                ], 404);
            }

            // 2. Global Property Status check (Sold / Rented blocks everything)
            if ($property->status === 'sold') {
                return response()->json([
                    'success' => false,
                    'message' => 'تم بيع هذا العقار ولم يعد متاحاً للحجز.',
                    'error_code' => 'PROPERTY_SOLD',
                ], 409);
            }

            if ($property->status === 'rented') {
                return response()->json([
                    'success' => false,
                    'message' => 'تم تأجير هذا العقار بالكامل ولم يعد متاحاً للحجز.',
                    'error_code' => 'PROPERTY_RENTED',
                ], 409);
            }

            // 3. Check customer active reservations across the system
            $allActiveForPhone = Reservation::whereIn('status', $activeStatuses)
                ->lockForUpdate()
                ->get()
                ->first(function ($r) use ($rawPhone, $normalizedPhone) {
                    return $r->phone === $rawPhone || 
                        (!empty($normalizedPhone) && $this->normalizePhone($r->phone) === $normalizedPhone);
                });

            if ($allActiveForPhone) {
                $isSameTarget = ($allActiveForPhone->property_id == $propertyId && 
                    ((int)$allActiveForPhone->room_id === (int)$roomId));

                if ($isSameTarget) {
                    return response()->json([
                        'success' => false,
                        'message' => 'لديك طلب حجز قائم بالفعل لهذا العقار. يمكنك التواصل معنا لمتابعة حالة الحجز.',
                        'error_code' => 'DUPLICATE_ACTIVE_RESERVATION',
                        'active_reservation' => $allActiveForPhone,
                    ], 422);
                }

                return response()->json([
                    'success' => false,
                    'message' => 'لديك طلب حجز قائم بالفعل على عقار آخر. لا يمكنك حجز عقار جديد قبل إنهاء الطلب الحالي.',
                    'error_code' => 'ACTIVE_RESERVATION_EXISTS',
                    'active_reservation' => $allActiveForPhone,
                ], 422);
            }

            // =========================================================================
            // CASE A: ROOM RESERVATION (Unit = Room)
            // =========================================================================
            if ($roomId !== null) {
                $room = \App\Models\Room::where('id', $roomId)
                    ->where('property_id', $propertyId)
                    ->lockForUpdate()
                    ->first();

                if (!$room) {
                    return response()->json([
                        'success' => false,
                        'message' => 'عفواً، الغرفة المحددة غير موجودة أو لا تنتمي لهذا العقار.',
                        'error_code' => 'ROOM_NOT_FOUND',
                    ], 422);
                }

                if ($room->status === 'rented') {
                    return response()->json([
                        'success' => false,
                        'message' => 'تم تأجير هذه الغرفة بالفعل وليست متاحة للحجز.',
                        'error_code' => 'ROOM_RENTED',
                    ], 409);
                }

                if ($room->status === 'reserved') {
                    return response()->json([
                        'success' => false,
                        'message' => 'هذه الغرفة محجوزة بالفعل ولا يمكن حجزها حالياً.',
                        'error_code' => 'ROOM_ALREADY_RESERVED',
                    ], 409);
                }

                // Check active reservation specifically for this room (property_id + room_id)
                $existingActiveRoom = Reservation::where('property_id', $propertyId)
                    ->where('room_id', $roomId)
                    ->whereIn('status', $activeStatuses)
                    ->lockForUpdate()
                    ->first();

                if ($existingActiveRoom) {
                    return response()->json([
                        'success' => false,
                        'message' => 'هذه الغرفة محجوزة بالفعل ولا يمكن حجزها حالياً.',
                        'error_code' => 'ROOM_ALREADY_RESERVED',
                        'active_reservation' => $existingActiveRoom,
                    ], 409);
                }

                // Create Room Reservation
                $reservation = Reservation::create([
                    'property_id' => $propertyId,
                    'room_id' => $roomId,
                    'name' => trim($request->name),
                    'phone' => $normalizedPhone ?: $rawPhone,
                    'message' => $request->message,
                    'status' => 'pending',
                ]);

                // Update only the Room status to 'reserved' (other rooms stay available)
                $room->update(['status' => 'reserved']);

                // Create Admin & Customer Notifications
                try {
                    $ref = $property->ref_id ?? "#{$propertyId}";
                    $propTitle = $property->title ?? "عقار {$ref}";
                    
                    // 1. Admin Database Notification
                    Notification::create([
                        'type' => 'reservation',
                        'recipient_type' => 'admin',
                        'entity_type' => 'reservation',
                        'entity_id' => $reservation->id,
                        'title' => 'طلب حجز غرفة جديد',
                        'message' => "{$request->name} قدم طلب حجز على غرفة {$room->name} في العقار {$propTitle} (كود: {$ref})",
                        'link' => '/admin/reservations',
                        'data' => [
                            'reservation_id' => $reservation->id,
                            'property_id' => $propertyId,
                            'room_id' => $roomId,
                            'room_name' => $room->name,
                            'property_title' => $propTitle,
                            'client_name' => $request->name,
                            'client_phone' => $normalizedPhone ?: $rawPhone,
                        ],
                    ]);

                    // 2. Admin Real-time Firebase Push
                    \App\Services\FirebaseNotificationService::sendToAdmin(
                        'طلب حجز غرفة جديد',
                        "{$request->name} قدم طلب حجز على غرفة {$room->name} في العقار {$propTitle} (كود: {$ref})",
                        [
                            'type' => 'room_reservation_created',
                            'reservation_id' => $reservation->id,
                            'route' => '/admin/reservations',
                        ]
                    );

                    // 3. Customer Database Notification
                    Notification::create([
                        'type' => 'reservation',
                        'recipient_type' => 'customer',
                        'customer_phone' => $normalizedPhone ?: $rawPhone,
                        'entity_type' => 'reservation',
                        'entity_id' => $reservation->id,
                        'title' => 'تم استلام طلب حجز الغرفة',
                        'message' => "تم استلام طلب حجزك لغرفة {$room->name} بالعقار ({$ref}) بنجاح، وسنتواصل معك قريباً للمعاينة.",
                        'link' => "/properties/{$propertyId}",
                    ]);

                    // 4. Customer Real-time Firebase Push
                    \App\Services\FirebaseNotificationService::sendToCustomer(
                        $normalizedPhone ?: $rawPhone,
                        'تم استلام طلب حجز الغرفة',
                        "تم استلام طلب حجزك لغرفة {$room->name} بالعقار ({$ref}) بنجاح.",
                        [
                            'type' => 'reservation_created',
                            'reservation_id' => $reservation->id,
                            'route' => "/properties/{$propertyId}",
                        ]
                    );
                } catch (\Exception $e) {}

                return response()->json([
                    'success' => true,
                    'message' => 'تم تقديم طلب حجز الغرفة بنجاح',
                    'data' => $reservation->load(['property', 'room']),
                ], 201);
            }

            // =========================================================================
            // CASE B: WHOLE PROPERTY RESERVATION (Unit = Property)
            // =========================================================================
            if ($property->status === 'reserved') {
                return response()->json([
                    'success' => false,
                    'message' => 'هذا العقار محجوز بالفعل ولا يمكن حجزه حالياً.',
                    'error_code' => 'PROPERTY_ALREADY_RESERVED',
                ], 409);
            }

            $existingActive = Reservation::where('property_id', $propertyId)
                ->whereNull('room_id')
                ->whereIn('status', $activeStatuses)
                ->lockForUpdate()
                ->first();

            if ($existingActive) {
                $isSameCustomer = ($existingActive->phone === $rawPhone || 
                    (!empty($normalizedPhone) && $this->normalizePhone($existingActive->phone) === $normalizedPhone));

                if ($isSameCustomer) {
                    return response()->json([
                        'success' => false,
                        'message' => 'لقد قمت بإرسال طلب حجز لهذا العقار بالفعل.',
                        'error_code' => 'DUPLICATE_RESERVATION',
                        'active_reservation' => $existingActive,
                    ], 409);
                }

                return response()->json([
                    'success' => false,
                    'message' => 'هذا العقار محجوز بالفعل ولا يمكن حجزه حالياً.',
                    'error_code' => 'PROPERTY_ALREADY_RESERVED',
                    'active_reservation' => $existingActive,
                ], 409);
            }

            // Create Whole Property Reservation
            $reservation = Reservation::create([
                'property_id' => $propertyId,
                'room_id' => null,
                'name' => trim($request->name),
                'phone' => $normalizedPhone ?: $rawPhone,
                'message' => $request->message,
                'status' => 'pending',
            ]);

            // Update Property status to 'reserved'
            $property->update(['status' => 'reserved']);

            // Create Admin & Customer Notifications
            try {
                $ref = $property->ref_id ?? "#{$propertyId}";
                $propTitle = $property->title ?? "عقار {$ref}";
                
                // 1. Admin Database Notification
                Notification::create([
                    'type' => 'reservation',
                    'recipient_type' => 'admin',
                    'entity_type' => 'reservation',
                    'entity_id' => $reservation->id,
                    'title' => 'طلب حجز جديد',
                    'message' => "{$request->name} قدم طلب حجز على عقار {$propTitle} (كود: {$ref})",
                    'link' => '/admin/reservations',
                    'data' => [
                        'reservation_id' => $reservation->id,
                        'property_id' => $propertyId,
                        'property_title' => $propTitle,
                        'client_name' => $request->name,
                        'client_phone' => $normalizedPhone ?: $rawPhone,
                    ],
                ]);

                // 2. Admin Real-time Firebase Push
                \App\Services\FirebaseNotificationService::sendToAdmin(
                    'طلب حجز جديد',
                    "{$request->name} قدم طلب حجز على عقار {$propTitle} (كود: {$ref})",
                    [
                        'type' => 'reservation_created',
                        'reservation_id' => $reservation->id,
                        'route' => '/admin/reservations',
                    ]
                );

                // 3. Customer Database Notification
                Notification::create([
                    'type' => 'reservation',
                    'recipient_type' => 'customer',
                    'customer_phone' => $normalizedPhone ?: $rawPhone,
                    'entity_type' => 'reservation',
                    'entity_id' => $reservation->id,
                    'title' => 'تم استلام طلب الحجز',
                    'message' => "تم استلام طلب حجزك لعقار {$propTitle} (كود: {$ref}) بنجاح، وسنتواصل معك قريباً للمعاينة والتفاصيل.",
                    'link' => "/properties/{$propertyId}",
                ]);

                // 4. Customer Real-time Firebase Push
                \App\Services\FirebaseNotificationService::sendToCustomer(
                    $normalizedPhone ?: $rawPhone,
                    'تم استلام طلب الحجز',
                    "تم استلام طلب حجزك لعقار {$propTitle} (كود: {$ref}) بنجاح.",
                    [
                        'type' => 'reservation_created',
                        'reservation_id' => $reservation->id,
                        'route' => "/properties/{$propertyId}",
                    ]
                );
            } catch (\Exception $e) {}

            return response()->json([
                'success' => true,
                'message' => 'تم تقديم طلب الحجز بنجاح',
                'data' => $reservation->load(['property', 'room']),
            ], 201);
        });
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
                'room',
            ])->findOrFail($id)
        );
    }

    /**
     * Update reservation status by admin.
     * When reservation becomes cancelled/rejected, and property is not sold/rented,
     * property status is automatically restored to 'available'.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:pending,contacted,completed,cancelled,rejected,accepted,confirmed,new,in_progress',
        ]);

        return DB::transaction(function () use ($request, $id) {
            $reservation = Reservation::where('id', $id)->lockForUpdate()->firstOrFail();
            $oldStatus = $reservation->status;
            $newStatus = $request->status;

            $reservation->update([
                'status' => $newStatus,
            ]);

            // Handle Room vs Property Status Restoration
            if ($reservation->room_id) {
                $room = \App\Models\Room::where('id', $reservation->room_id)->lockForUpdate()->first();
                if ($room && $room->status !== 'rented') {
                    if (in_array($newStatus, $this->inactiveStatuses())) {
                        $hasOtherRoomActive = Reservation::where('property_id', $reservation->property_id)
                            ->where('room_id', $reservation->room_id)
                            ->where('id', '!=', $reservation->id)
                            ->whereIn('status', $this->activeStatuses())
                            ->exists();

                        if (!$hasOtherRoomActive) {
                            $room->update(['status' => 'available']);
                        }
                    } elseif (in_array($newStatus, $this->activeStatuses())) {
                        $room->update(['status' => 'reserved']);
                    }
                }
            } else {
                $property = Property::where('id', $reservation->property_id)->lockForUpdate()->first();
                if ($property && !in_array($property->status, ['sold', 'rented'])) {
                    if (in_array($newStatus, $this->inactiveStatuses())) {
                        $hasOtherActive = Reservation::where('property_id', $property->id)
                            ->whereNull('room_id')
                            ->where('id', '!=', $reservation->id)
                            ->whereIn('status', $this->activeStatuses())
                            ->exists();

                        if (!$hasOtherActive) {
                            $property->update(['status' => 'available']);
                        }
                    } elseif (in_array($newStatus, $this->activeStatuses())) {
                        $property->update(['status' => 'reserved']);
                    }
                }
            }

            // Send Customer Notification & Real-time Firebase Push on Status Change
            if ($oldStatus !== $newStatus && $reservation->phone) {
                try {
                    NotificationService::onReservationStatusChanged($reservation, $oldStatus, $newStatus);
                } catch (\Throwable $e) {}
            }

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث حالة الحجز بنجاح',
                'data' => $reservation->fresh(['property', 'room']),
            ]);
        });
    }

    public function destroy($id)
    {
        return DB::transaction(function () use ($id) {
            $reservation = Reservation::findOrFail($id);
            $propertyId = $reservation->property_id;
            $roomId = $reservation->room_id;
            $reservation->delete();

            if ($roomId) {
                $room = \App\Models\Room::where('id', $roomId)->lockForUpdate()->first();
                if ($room && $room->status === 'reserved') {
                    $hasOtherActive = Reservation::where('property_id', $propertyId)
                        ->where('room_id', $roomId)
                        ->whereIn('status', $this->activeStatuses())
                        ->exists();

                    if (!$hasOtherActive) {
                        $room->update(['status' => 'available']);
                    }
                }
            } else {
                $property = Property::where('id', $propertyId)->lockForUpdate()->first();
                if ($property && $property->status === 'reserved') {
                    $hasOtherActive = Reservation::where('property_id', $propertyId)
                        ->whereNull('room_id')
                        ->whereIn('status', $this->activeStatuses())
                        ->exists();

                    if (!$hasOtherActive) {
                        $property->update(['status' => 'available']);
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'تم حذف طلب الحجز بنجاح',
            ]);
        });
    }

    /**
     * Check if a property or specific room is reservable and whether customer already has an active reservation for it.
     */
    public function check(Request $request)
    {
        $request->validate([
            'property_id' => 'required|exists:properties,id',
            'room_id' => 'nullable|exists:rooms,id',
            'phone' => 'nullable|string|max:25',
        ]);

        $rawPhone = trim($request->input('phone', ''));
        $normalizedPhone = $this->normalizePhone($rawPhone);
        $propertyId = (int) $request->property_id;
        $roomId = $request->filled('room_id') ? (int) $request->room_id : null;
        $activeStatuses = $this->activeStatuses();

        $property = Property::find($propertyId);
        if (!$property) {
            return response()->json([
                'reserved' => false,
                'can_reserve' => false,
                'message' => 'العقار غير موجود.',
                'status' => 'not_found',
            ], 404);
        }

        if ($property->status === 'sold') {
            return response()->json([
                'reserved' => false,
                'can_reserve' => false,
                'message' => 'تم بيع هذا العقار ولم يعد متاحاً للحجز.',
                'status' => 'sold',
            ]);
        }

        if ($property->status === 'rented') {
            return response()->json([
                'reserved' => false,
                'can_reserve' => false,
                'message' => 'تم تأجير هذا العقار بالكامل ولم يعد متاحاً للحجز.',
                'status' => 'rented',
            ]);
        }

        // =========================================================================
        // CASE A: ROOM RESERVATION CHECK (Unit = Room)
        // =========================================================================
        if ($roomId !== null) {
            $room = \App\Models\Room::where('id', $roomId)
                ->where('property_id', $propertyId)
                ->first();

            if (!$room) {
                return response()->json([
                    'reserved' => false,
                    'can_reserve' => false,
                    'is_same_property' => false,
                    'has_active_reservation' => false,
                    'message' => 'الغرفة المحددة غير موجودة أو لا تنتمي لهذا العقار.',
                    'status' => 'not_found',
                ], 422);
            }

            if ($room->status === 'rented') {
                return response()->json([
                    'reserved' => false,
                    'can_reserve' => false,
                    'is_same_property' => false,
                    'has_active_reservation' => false,
                    'message' => 'تم تأجير هذه الغرفة بالفعل وليست متاحة للحجز.',
                    'status' => 'rented',
                ]);
            }

            // Check if this specific customer has an active reservation anywhere
            $customerActiveRes = null;
            if (!empty($rawPhone)) {
                $customerActiveRes = Reservation::whereIn('status', $activeStatuses)
                    ->get()
                    ->first(function ($r) use ($rawPhone, $normalizedPhone) {
                        return $r->phone === $rawPhone || 
                            (!empty($normalizedPhone) && $this->normalizePhone($r->phone) === $normalizedPhone);
                    });
            }

            if ($customerActiveRes) {
                $isSameTarget = ($customerActiveRes->property_id == $propertyId && (int)$customerActiveRes->room_id === (int)$roomId);
                return response()->json([
                    'reserved' => true,
                    'can_reserve' => false,
                    'has_active_reservation' => true,
                    'is_same_property' => $isSameTarget,
                    'is_same_customer' => true,
                    'status' => 'reserved',
                    'message' => $isSameTarget
                        ? 'لقد قمت بإرسال طلب حجز لهذه الغرفة بالفعل.'
                        : 'لديك طلب حجز قائم بالفعل على عقار آخر. لا يمكنك حجز عقار جديد قبل إنهاء الطلب الحالي.',
                    'active_reservation' => $customerActiveRes,
                ]);
            }

            $roomActiveReservation = Reservation::where('property_id', $propertyId)
                ->where('room_id', $roomId)
                ->whereIn('status', $activeStatuses)
                ->first();

            if ($room->status === 'reserved' || $roomActiveReservation) {
                return response()->json([
                    'reserved' => false,
                    'can_reserve' => false,
                    'has_active_reservation' => false,
                    'is_same_property' => false,
                    'is_same_customer' => false,
                    'status' => 'reserved',
                    'message' => 'هذه الغرفة محجوزة بالفعل ولا يمكن حجزها حالياً.',
                    'active_reservation' => $roomActiveReservation,
                ]);
            }

            return response()->json([
                'reserved' => false,
                'can_reserve' => true,
                'has_active_reservation' => false,
                'is_same_property' => false,
                'is_same_customer' => false,
                'status' => 'available',
                'message' => null,
            ]);
        }

        // =========================================================================
        // CASE B: WHOLE PROPERTY RESERVATION CHECK (Unit = Property)
        // =========================================================================
        $customerActiveRes = null;
        if (!empty($rawPhone)) {
            $customerActiveRes = Reservation::whereIn('status', $activeStatuses)
                ->get()
                ->first(function ($r) use ($rawPhone, $normalizedPhone) {
                    return $r->phone === $rawPhone || 
                        (!empty($normalizedPhone) && $this->normalizePhone($r->phone) === $normalizedPhone);
                });
        }

        if ($customerActiveRes) {
            $isSameProp = ($customerActiveRes->property_id == $propertyId);
            return response()->json([
                'reserved' => true,
                'can_reserve' => false,
                'has_active_reservation' => true,
                'is_same_property' => $isSameProp,
                'is_same_customer' => true,
                'status' => 'reserved',
                'message' => $isSameProp
                    ? 'لقد قمت بإرسال طلب حجز لهذا العقار بالفعل.'
                    : 'لديك طلب حجز قائم بالفعل على عقار آخر. لا يمكنك حجز عقار جديد قبل إنهاء الطلب الحالي.',
                'active_reservation' => $customerActiveRes,
            ]);
        }

        $activeReservation = Reservation::where('property_id', $propertyId)
            ->whereNull('room_id')
            ->whereIn('status', $activeStatuses)
            ->first();

        if ($property->status === 'reserved' || $activeReservation) {
            return response()->json([
                'reserved' => false,
                'can_reserve' => false,
                'has_active_reservation' => false,
                'is_same_property' => false,
                'is_same_customer' => false,
                'status' => 'reserved',
                'message' => 'هذا العقار محجوز بالفعل ولا يمكن حجزه حالياً.',
                'active_reservation' => $activeReservation,
            ]);
        }

        return response()->json([
            'reserved' => false,
            'can_reserve' => true,
            'has_active_reservation' => false,
            'is_same_property' => false,
            'is_same_customer' => false,
            'status' => 'available',
            'message' => null,
        ]);
    }

    /**
     * Get reservations for the current customer (Scoped to authenticated user or verified token / phone).
     */
    public function customerIndex(Request $request)
    {
        $rawPhone = trim($request->input('phone', ''));
        $cleanPhone = $this->normalizePhone($rawPhone);
        $user = $request->user();
        $token = $request->header('X-Device-Token') ?: ($request->header('X-Client-Token') ?: $request->input('token'));

        $isAuthorized = false;
        $phonesToQuery = [];

        if ($user) {
            if (!empty($user->role) && in_array($user->role, ['admin', 'super_admin'])) {
                $isAuthorized = true;
                if ($cleanPhone) {
                    $phonesToQuery[] = $cleanPhone;
                    $phonesToQuery[] = $rawPhone;
                }
            } elseif (!empty($user->phone)) {
                $userPhone = $this->normalizePhone($user->phone);
                $isAuthorized = true;
                $phonesToQuery[] = $userPhone;
                $phonesToQuery[] = $user->phone;
            }
        }

        if (!$isAuthorized && !empty($token)) {
            $deviceTokens = \App\Models\DeviceToken::where('token', $token)->get();
            foreach ($deviceTokens as $dt) {
                if (!empty($dt->phone)) {
                    $phonesToQuery[] = $this->normalizePhone($dt->phone);
                    $phonesToQuery[] = $dt->phone;
                    $isAuthorized = true;
                }
            }
        }

        if (!$isAuthorized && !empty($cleanPhone)) {
            $hasMatchingDevice = \App\Models\DeviceToken::where(function ($q) use ($rawPhone, $cleanPhone) {
                $q->where('phone', $cleanPhone)->orWhere('phone', $rawPhone);
            })->exists();

            $hasLegitimateRecord = Reservation::where('phone', $cleanPhone)->orWhere('phone', $rawPhone)->exists();

            if ($hasMatchingDevice || $hasLegitimateRecord) {
                $isAuthorized = true;
                $phonesToQuery[] = $cleanPhone;
                $phonesToQuery[] = $rawPhone;
            }
        }

        if (!$isAuthorized || empty($phonesToQuery)) {
            return response()->json([
                'success' => true,
                'data' => [],
                'total' => 0,
            ], 200);
        }

        $phonesToQuery = array_unique(array_filter($phonesToQuery));

        $reservations = Reservation::with([
            'property.location',
            'property.images',
            'room.roomImages',
        ])
        ->whereIn('phone', $phonesToQuery)
        ->latest()
        ->get();

        $data = $reservations->map(function ($res) {
            $prop = $res->property;
            $room = $res->room;
            $primaryImage = $prop ? ($prop->images->where('is_primary', true)->first() ?: $prop->images->first()) : null;

            return [
                'id' => $res->id,
                'property_id' => $res->property_id,
                'room_id' => $res->room_id,
                'is_room_reservation' => !empty($res->room_id),
                'client_name' => $res->name,
                'client_phone' => $res->phone,
                'client_message' => $res->message,
                'status' => $res->status,
                'created_at' => $res->created_at ? $res->created_at->toISOString() : null,
                'updated_at' => $res->updated_at ? $res->updated_at->toISOString() : null,
                'property' => $prop ? [
                    'id' => $prop->id,
                    'ref_id' => $prop->ref_id,
                    'title' => $prop->title,
                    'price' => $prop->price,
                    'operation_type' => $prop->operation_type ?? 'rent',
                    'location_name' => $prop->location ? $prop->location->name : null,
                    'status' => $prop->status,
                    'image' => $primaryImage ? ($primaryImage->image_url ?? $primaryImage->url) : null,
                ] : null,
                'room' => $room ? [
                    'id' => $room->id,
                    'name' => $room->name,
                    'price' => $room->price,
                    'area' => $room->area,
                    'status' => $room->status,
                    'description' => $room->description,
                    'image' => $room->roomImages->first() ? $room->roomImages->first()->image_url : null,
                ] : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'total' => $data->count(),
        ]);
    }
}