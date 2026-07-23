<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = Notification::latest()->take(50)->get();

        return response()->json([
            'data' => $notifications,
            'unread_count' => Notification::unread()->count(),
        ]);
    }

    public function unreadCount()
    {
        return response()->json([
            'unread_count' => Notification::unread()->count(),
        ]);
    }

    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::findOrFail($id);
        $notification->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }

    public function markAllAsRead()
    {
        Notification::unread()->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }

    public function destroy($id)
    {
        Notification::findOrFail($id)->delete();

        return response()->json(['success' => true]);
    }
}
