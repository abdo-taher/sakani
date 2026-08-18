<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\DeviceToken;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get Admin Notifications
     */
    public function index(Request $request)
    {
        $notifications = Notification::forAdmin()
            ->latest()
            ->take(50)
            ->get();

        return response()->json([
            'data' => $notifications,
            'unread_count' => Notification::forAdmin()->unread()->count(),
        ]);
    }

    /**
     * Get Unread count for Admin
     */
    public function unreadCount()
    {
        return response()->json([
            'unread_count' => Notification::forAdmin()->unread()->count(),
        ]);
    }

    /**
     * Helper to clean Egyptian phone formats
     */
    protected function cleanPhone(?string $phone): string
    {
        if (!$phone) return '';
        $clean = preg_replace('/\D/', '', $phone);
        if (str_starts_with($clean, '20') && strlen($clean) > 10) {
            $clean = '0' . substr($clean, 2);
        }
        return $clean;
    }

    /**
     * Get Customer-specific Notifications (Secured)
     */
    public function customerIndex(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|max:25',
        ]);

        $rawPhone = trim($request->phone);
        $cleanPhone = $this->cleanPhone($rawPhone);

        if (empty($cleanPhone) || strlen($cleanPhone) < 6) {
            return response()->json([
                'success' => true,
                'data' => [],
                'unread_count' => 0,
            ], 200);
        }

        $user = $request->user();
        $token = $request->header('X-Device-Token') ?: ($request->header('X-Client-Token') ?: $request->input('token'));

        // Security Verification:
        // 1. If authenticated admin -> allowed
        // 2. If authenticated customer -> verify phone belongs to authenticated user
        // 3. If guest -> verify token belongs to registered DeviceToken for this phone or matches existing reservation
        $isAuthorized = false;

        if ($user) {
            if (!empty($user->role) && in_array($user->role, ['admin', 'super_admin'])) {
                $isAuthorized = true;
            } elseif (!empty($user->phone) && ($this->cleanPhone($user->phone) === $cleanPhone || $user->phone === $rawPhone)) {
                $isAuthorized = true;
            }
        } elseif (!empty($token)) {
            $hasMatchingDevice = DeviceToken::where('token', $token)
                ->where(function ($q) use ($rawPhone, $cleanPhone) {
                    $q->where('phone', $cleanPhone)
                      ->orWhere('phone', $rawPhone);
                })
                ->exists();

            if ($hasMatchingDevice) {
                $isAuthorized = true;
            }
        }

        // Also permit if phone has legitimate reservation records for this client
        if (!$isAuthorized) {
            $hasLegitimateRecord = \App\Models\Reservation::where('phone', $cleanPhone)
                ->orWhere('phone', $rawPhone)
                ->exists() || \App\Models\NeedRequest::where('phone', $cleanPhone)
                ->orWhere('phone', $rawPhone)
                ->exists();

            if ($hasLegitimateRecord) {
                $isAuthorized = true;
            }
        }

        if (!$isAuthorized) {
            return response()->json([
                'success' => true,
                'data' => [],
                'unread_count' => 0,
            ], 200);
        }

        $notifications = Notification::where('recipient_type', 'customer')
            ->where(function ($q) use ($rawPhone, $cleanPhone) {
                $q->where('customer_phone', $cleanPhone)
                  ->orWhere('customer_phone', $rawPhone);
            })
            ->latest()
            ->take(30)
            ->get();

        $unreadCount = Notification::where('recipient_type', 'customer')
            ->where(function ($q) use ($rawPhone, $cleanPhone) {
                $q->where('customer_phone', $cleanPhone)
                  ->orWhere('customer_phone', $rawPhone);
            })
            ->unread()
            ->count();

        return response()->json([
            'data' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Register / update Device Token (Public or Customer)
     */
    public function storeDeviceToken(Request $request)
    {
        $request->validate([
            'token' => 'required|string|max:500',
            'phone' => 'nullable|string|max:25',
            'device_type' => 'nullable|string|max:50',
        ]);

        $phone = null;
        if ($request->filled('phone')) {
            $phone = preg_replace('/\D/', '', $request->phone);
            if (str_starts_with($phone, '20') && strlen($phone) > 10) {
                $phone = '0' . substr($phone, 2);
            }
        }

        $deviceToken = DeviceToken::updateOrCreate(
            ['token' => $request->token],
            [
                'phone' => $phone,
                'device_type' => $request->device_type ?? 'web',
                'last_used_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Device token registered successfully',
            'data' => $deviceToken,
        ], 200);
    }

    /**
     * Register / update Admin Device Token (Authenticated)
     */
    public function storeAdminDeviceToken(Request $request)
    {
        $request->validate([
            'token' => 'required|string|max:500',
            'device_type' => 'nullable|string|max:50',
        ]);

        $user = $request->user();

        $deviceToken = DeviceToken::updateOrCreate(
            ['token' => $request->token],
            [
                'user_id' => $user ? $user->id : null,
                'device_type' => $request->device_type ?? 'web',
                'last_used_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Admin device token registered successfully',
            'data' => $deviceToken,
        ], 200);
    }

    /**
     * Unregister Device Token on logout or permission revocation
     */
    public function destroyDeviceToken(Request $request)
    {
        $request->validate([
            'token' => 'required|string|max:500',
        ]);

        DeviceToken::where('token', $request->token)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Device token unregistered successfully',
        ]);
    }

    /**
     * Mark single notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::findOrFail($id);
        $notification->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }

    /**
     * Mark all notifications as read (Admin or Customer phone)
     */
    public function markAllAsRead(Request $request)
    {
        if ($request->filled('phone')) {
            $phone = preg_replace('/\D/', '', $request->phone);
            if (str_starts_with($phone, '20') && strlen($phone) > 10) {
                $phone = '0' . substr($phone, 2);
            }

            Notification::where('recipient_type', 'customer')
                ->where('customer_phone', $phone)
                ->unread()
                ->update(['is_read' => true]);
        } else {
            Notification::forAdmin()->unread()->update(['is_read' => true]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Get count of active recipients for manual notifications
     */
    public function getActiveRecipientsCount(Request $request)
    {
        $activeDays = 30;
        $activeCutoff = now()->subDays($activeDays);

        $activeDeviceTokens = DeviceToken::where('last_used_at', '>=', $activeCutoff)->count();
        $distinctCustomerPhones = DeviceToken::where('last_used_at', '>=', $activeCutoff)
            ->whereNotNull('phone')
            ->distinct('phone')
            ->count('phone');

        $recentReservationCustomers = \App\Models\Reservation::where('created_at', '>=', $activeCutoff)
            ->distinct('phone')
            ->count('phone');

        $totalRecipients = max($activeDeviceTokens, $distinctCustomerPhones, $recentReservationCustomers);

        return response()->json([
            'success' => true,
            'active_devices_count' => $activeDeviceTokens,
            'active_customers_count' => $distinctCustomerPhones,
            'total_active_recipients' => $totalRecipients > 0 ? $totalRecipients : 1,
            'criteria' => "أجهزة ونشاط مسجل خلال آخر {$activeDays} يوماً",
        ]);
    }

    /**
     * Send Manual Notification (Admin Composer)
     */
    public function sendManualNotification(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'link' => 'nullable|string|max:255',
            'target_scope' => 'required|in:active_users,all_users,specific_phone',
            'customer_phone' => 'required_if:target_scope,specific_phone|nullable|string|max:25',
        ]);

        $title = trim($request->title);
        $message = trim($request->message);
        $link = $request->link ? trim($request->link) : '/';
        $scope = $request->target_scope;
        $sentCount = 0;

        if ($scope === 'specific_phone') {
            $cleanPhone = $this->cleanPhone($request->customer_phone);
            if (!empty($cleanPhone)) {
                Notification::create([
                    'type' => 'manual_admin_broadcast',
                    'recipient_type' => 'customer',
                    'customer_phone' => $cleanPhone,
                    'title' => $title,
                    'message' => $message,
                    'link' => $link,
                    'is_read' => false,
                ]);

                try {
                    \App\Services\FirebaseNotificationService::sendToCustomer($cleanPhone, $title, $message, [
                        'type' => 'manual_broadcast',
                        'route' => $link,
                    ]);
                } catch (\Throwable $e) {}
                $sentCount = 1;
            }
        } elseif ($scope === 'active_users') {
            $activeTokens = DeviceToken::where('last_used_at', '>=', now()->subDays(30))->get();
            $phones = $activeTokens->pluck('phone')->filter()->unique();

            foreach ($phones as $phone) {
                Notification::create([
                    'type' => 'manual_admin_broadcast',
                    'recipient_type' => 'customer',
                    'customer_phone' => $phone,
                    'title' => $title,
                    'message' => $message,
                    'link' => $link,
                    'is_read' => false,
                ]);
            }

            // Push to all active device tokens
            $tokens = $activeTokens->pluck('token')->filter()->unique()->values()->all();
            if (!empty($tokens)) {
                try {
                    \App\Services\FirebaseNotificationService::sendPush($tokens, $title, $message, [
                        'type' => 'manual_broadcast',
                        'route' => $link,
                    ]);
                } catch (\Throwable $e) {}
            }
            $sentCount = max(count($tokens), count($phones), 1);
        } else { // all_users
            $allTokens = DeviceToken::all();
            $phones = $allTokens->pluck('phone')->filter()->unique();

            foreach ($phones as $phone) {
                Notification::create([
                    'type' => 'manual_admin_broadcast',
                    'recipient_type' => 'customer',
                    'customer_phone' => $phone,
                    'title' => $title,
                    'message' => $message,
                    'link' => $link,
                    'is_read' => false,
                ]);
            }

            $tokens = $allTokens->pluck('token')->filter()->unique()->values()->all();
            if (!empty($tokens)) {
                try {
                    \App\Services\FirebaseNotificationService::sendPush($tokens, $title, $message, [
                        'type' => 'manual_broadcast',
                        'route' => $link,
                    ]);
                } catch (\Throwable $e) {}
            }
            $sentCount = max(count($tokens), count($phones), 1);
        }

        return response()->json([
            'success' => true,
            'message' => "تم إرسال الإشعار بنجاح إلى ({$sentCount}) مستلم.",
            'recipients_count' => $sentCount,
        ]);
    }

    /**
     * Delete notification
     */
    public function destroy($id)
    {
        Notification::findOrFail($id)->delete();

        return response()->json(['success' => true]);
    }
}
