<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        return response()->json(Setting::first());
    }

    public function store(Request $request)
    {
        $request->validate([
            'site_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'required|email',
            'address' => 'nullable|string',
            'facebook' => 'nullable|string',
            'instagram' => 'nullable|string',
            'whatsapp' => 'nullable|string',
            'about' => 'nullable|string',
        ]);

        $setting = Setting::create($request->all());

        return response()->json([
            'message' => 'Settings saved successfully',
            'data' => $setting
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $setting = Setting::findOrFail($id);

        $setting->update($request->all());

        return response()->json([
            'message' => 'Settings updated successfully',
            'data' => $setting
        ]);
    }

    public function destroy($id)
    {
        Setting::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Settings deleted successfully'
        ]);
    }
}