<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Reservation;
use App\Models\NeedRequest;
use App\Models\ContactMessage;
use App\Services\FirebaseNotificationService;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Notify Admin: Creates DB notification and dispatches FCM push to registered Admin devices.
     */
    public static function notifyAdmins(
        string $type,
        string $title,
        string $message,
        ?string $link = null,
        array $data = []
    ): ?Notification {
        try {
            $notification = Notification::create([
                'type' => $type,
                'recipient_type' => 'admin',
                'entity_type' => $data['entity_type'] ?? 'general',
                'entity_id' => $data['entity_id'] ?? null,
                'title' => $title,
                'message' => $message,
                'link' => $link,
                'data' => $data,
                'is_read' => false,
            ]);

            // Attempt FCM push to admin devices independently
            try {
                FirebaseNotificationService::sendToAdmin($title, $message, array_merge($data, [
                    'type' => $type,
                    'route' => $link ?? '/admin/dashboard',
                    'notification_id' => $notification->id,
                ]));
            } catch (\Throwable $fcmEx) {
                Log::warning('FCM Admin push failed safely: ' . $fcmEx->getMessage());
            }

            return $notification;
        } catch (\Throwable $e) {
            Log::error('NotificationService::notifyAdmins DB failure: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Notify Customer: Creates DB notification for specific phone and dispatches FCM push to customer devices.
     */
    public static function notifyCustomer(
        string $phone,
        string $type,
        string $title,
        string $message,
        ?string $link = null,
        array $data = []
    ): ?Notification {
        if (empty(trim($phone))) {
            return null;
        }

        $cleanPhone = preg_replace('/\D/', '', $phone);
        if (str_starts_with($cleanPhone, '20') && strlen($cleanPhone) > 10) {
            $cleanPhone = '0' . substr($cleanPhone, 2);
        }

        try {
            $notification = Notification::create([
                'type' => $type,
                'recipient_type' => 'customer',
                'customer_phone' => $cleanPhone,
                'entity_type' => $data['entity_type'] ?? 'general',
                'entity_id' => $data['entity_id'] ?? null,
                'title' => $title,
                'message' => $message,
                'link' => $link,
                'data' => $data,
                'is_read' => false,
            ]);

            // Attempt FCM push to customer devices independently
            try {
                FirebaseNotificationService::sendToCustomer($cleanPhone, $title, $message, array_merge($data, [
                    'type' => $type,
                    'route' => $link ?? '/',
                    'notification_id' => $notification->id,
                ]));
            } catch (\Throwable $fcmEx) {
                Log::warning('FCM Customer push failed safely: ' . $fcmEx->getMessage());
            }

            return $notification;
        } catch (\Throwable $e) {
            Log::error('NotificationService::notifyCustomer DB failure: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Handle Reservation Created Event -> Notify Admin
     */
    public static function onReservationCreated(Reservation $reservation): void
    {
        $property = $reservation->property;
        $room = $reservation->room;
        $clientName = $reservation->name ?? 'عميل';
        $propTitle = $property ? $property->title : 'عقار غير محدد';
        $refCode = $property ? ($property->ref_id ?? "ID-{$property->id}") : '—';

        if ($reservation->room_id && $room) {
            $title = 'طلب حجز غرفة جديد';
            $message = "{$clientName} قدم طلب حجز على غرفة \"{$room->name}\" في العقار ({$propTitle}) - كود: {$refCode}";
        } else {
            $title = 'طلب حجز جديد';
            $message = "{$clientName} قدم طلب حجز على عقار ({$propTitle}) - كود: {$refCode}";
        }

        self::notifyAdmins(
            'reservation',
            $title,
            $message,
            '/admin/reservations',
            [
                'entity_type' => 'reservation',
                'entity_id' => $reservation->id,
                'reservation_id' => $reservation->id,
                'property_id' => $reservation->property_id,
                'room_id' => $reservation->room_id,
                'client_name' => $reservation->name,
                'client_phone' => $reservation->phone,
            ]
        );
    }

    /**
     * Handle Reservation Status Changed Event -> Notify Customer
     */
    public static function onReservationStatusChanged(
        Reservation $reservation,
        string $oldStatus,
        string $newStatus
    ): void {
        // Prevent duplicate transition notification if status has not actually changed
        if ($oldStatus === $newStatus || empty($reservation->phone)) {
            return;
        }

        $property = $reservation->property;
        $room = $reservation->room;
        $propTitle = $property ? $property->title : 'العقار';
        $refCode = $property ? ($property->ref_id ?? "ID-{$property->id}") : '';
        $roomName = $room ? $room->name : null;

        $title = 'تحديث حالة الحجز';
        $link = "/my-reservations?highlight={$reservation->id}";

        if (in_array($newStatus, ['accepted', 'confirmed'])) {
            $title = 'تم قبول طلب الحجز';
            if ($roomName) {
                $message = "تهانينا! تمت الموافقة وقبول طلب حجزك للغرفة \"{$roomName}\" بالعقار ({$propTitle}). سنتواصل معك لترتيب موعد الاستلام.";
            } else {
                $message = "تهانينا! تمت الموافقة وقبول طلب حجزك للعقار ({$propTitle}). سنتواصل معك لتأكيد المعاينة وإنهاء الإجراءات.";
            }
        } elseif (in_array($newStatus, ['rejected', 'cancelled'])) {
            $title = 'تعذر قبول طلب الحجز';
            if ($roomName) {
                $message = "نعتذر عن عدم إمكانية قبول طلب الحجز لغرفة \"{$roomName}\" بالعقار ({$propTitle}). يمكنك تصفح باقي الغرف المتاحة.";
            } else {
                $message = "نعتذر عن عدم إمكانية قبول طلب الحجز للعقار ({$propTitle}). يمكنك تصفح باقي العقارات المتاحة على المنصة.";
            }
        } elseif ($newStatus === 'contacted' || $newStatus === 'in_progress') {
            $title = 'تم التواصل بخصوص طلب الحجز';
            $message = "تمت مراجعة طلب حجزك للعقار ({$propTitle}) من قبل إدارة سكني وسنتواصل معك هاتفياً لمتابعة التفاصيل.";
        } elseif ($newStatus === 'completed') {
            $title = 'تم إتمام الحجز بنجاح';
            $message = "تم إتمام وحسم طلب حجزك للعقار ({$propTitle}) بنجاح. شكراً لثقتكم في سكني.";
        } else {
            $statusLabels = [
                'pending' => 'قيد الانتظار',
                'contacted' => 'قيد المتابعة والتواصل',
                'accepted' => 'مقبول ومؤكد',
                'confirmed' => 'مؤكد',
                'completed' => 'مكتمل',
                'cancelled' => 'ملغي',
                'rejected' => 'مرفوض',
            ];
            $statusText = $statusLabels[$newStatus] ?? $newStatus;
            $message = "تم تحديث حالة طلب حجزك للعقار ({$propTitle}) إلى: ({$statusText}).";
        }

        self::notifyCustomer(
            $reservation->phone,
            'reservation_status_changed',
            $title,
            $message,
            $link,
            [
                'entity_type' => 'reservation',
                'entity_id' => $reservation->id,
                'reservation_id' => $reservation->id,
                'property_id' => $reservation->property_id,
                'room_id' => $reservation->room_id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
            ]
        );
    }

    /**
     * Handle Need Request Created Event -> Notify Admin
     */
    public static function onNeedRequestCreated(NeedRequest $needRequest): void
    {
        $clientName = $needRequest->name ?? 'عميل';
        $typeLabel = $needRequest->listing_type === 'buy' ? 'شراء' : 'إيجار';
        $location = $needRequest->location ?? 'دمياط الجديدة';

        self::notifyAdmins(
            'need_request',
            "طلب {$typeLabel} جديد",
            "{$clientName} أرسل طلب {$typeLabel} بمواصفات خاصة في {$location}",
            '/admin/need-requests',
            [
                'entity_type' => 'need_request',
                'entity_id' => $needRequest->id,
                'request_id' => $needRequest->id,
                'client_name' => $needRequest->name,
                'client_phone' => $needRequest->phone,
                'location' => $location,
            ]
        );
    }

    /**
     * Handle Need Request Status Changed Event -> Notify Customer
     */
    public static function onNeedRequestStatusChanged(
        NeedRequest $needRequest,
        string $oldStatus,
        string $newStatus
    ): void {
        if ($oldStatus === $newStatus || empty($needRequest->phone)) {
            return;
        }

        $title = 'تحديث حالة طلب العقار';
        $message = "تمت مراجعة طلبك للعقار بمواصفات خاصة من قبل فريق سكني وجاري توفير العروض المناسبة لك.";

        if ($newStatus === 'contacted') {
            $title = 'جاري متابعة طلبك العقاري';
            $message = "تمت مراجعة طلبك وسيقوم مستشارك العقاري بالتواصل معك هاتفياً لتقديم أفضل الخيارات المتاحة.";
        }

        self::notifyCustomer(
            $needRequest->phone,
            'need_request_status_changed',
            $title,
            $message,
            '/',
            [
                'entity_type' => 'need_request',
                'entity_id' => $needRequest->id,
                'request_id' => $needRequest->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
            ]
        );
    }

    /**
     * Handle Contact Message Created Event -> Notify Admin
     */
    public static function onContactMessageCreated(ContactMessage $contactMessage): void
    {
        $clientName = $contactMessage->name ?? 'زائر';
        $subject = $contactMessage->subject ? " ({$contactMessage->subject})" : '';

        self::notifyAdmins(
            'contact_message',
            'رسالة تواصل جديدة',
            "{$clientName} أرسل رسالة تواصل جديدة{$subject}",
            '/admin/contact-messages',
            [
                'entity_type' => 'contact_message',
                'entity_id' => $contactMessage->id,
                'message_id' => $contactMessage->id,
                'client_name' => $contactMessage->name,
                'client_phone' => $contactMessage->phone,
            ]
        );
    }
}
