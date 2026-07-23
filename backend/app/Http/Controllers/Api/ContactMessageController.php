<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
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

        $contact = ContactMessage::create([
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
            'subject' => $request->subject,
            'message' => $request->message,
            'status' => 'new'
        ]);

        return response()->json([
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

    public function destroy($id)
    {
        ContactMessage::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Message deleted successfully'
        ]);
    }
}