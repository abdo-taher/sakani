<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class ContactMessageController extends Controller
{
    public function index()
    {
        return response()->json(ContactMessage::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'    => 'required|string|max:255',
            'phone'   => 'required|string|max:20',
            'email'   => 'nullable|email',
            'subject' => 'nullable|string|max:255',
            'message' => 'required|string'
        ]);

        // Prevent rapid repeated duplicate submissions within 30 seconds
        $existing = ContactMessage::where('phone', $request->phone)
            ->where('message', $request->message)
            ->where('created_at', '>=', now()->subSeconds(30))
            ->first();

        if ($existing) {
            return response()->json([
                'success' => true,
                'message' => 'Message already received',
                'data' => $existing
            ], 200);
        }

        $contact = ContactMessage::create([
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
            'subject' => $request->subject,
            'message' => $request->message,
            'status' => 'new'
        ]);

        try {
            NotificationService::onContactMessageCreated($contact);
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'message' => 'Message sent successfully',
            'data' => $contact
        ], 201);
    }

    public function show($id)
    {
        return response()->json(
            ContactMessage::findOrFail($id)
        );
    }

    public function update(Request $request, $id)
    {
        $contact = ContactMessage::findOrFail($id);

        $contact->update($request->all());

        return response()->json([
            'message' => 'Message updated successfully',
            'data' => $contact
        ]);
    }

    public function reply(Request $request, $id)
    {
        $contact = ContactMessage::findOrFail($id);

        $request->validate([
            'reply' => 'required|string',
            'channel' => 'nullable|string',
            'admin_name' => 'nullable|string'
        ]);

        $replyText = $request->input('reply');
        $channel = $request->input('channel', 'platform');

        $contact->update([
            'status' => 'replied',
            'admin_reply' => $replyText,
            'reply_channel' => $channel,
            'replied_at' => now()
        ]);

        try {
            Notification::create([
                'title' => 'رد جديد على رسالتك: ' . ($contact->subject ?: 'استفسار'),
                'body' => $replyText,
                'type' => 'contact_reply',
                'target_id' => $contact->id,
                'target_phone' => $contact->phone,
                'is_read' => false,
            ]);
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'message' => 'تم إرسال وحفظ الرد بنجاح',
            'data' => $contact
        ]);
    }

    public function destroy($id)
    {
        ContactMessage::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Message deleted successfully'
        ]);
    }
}