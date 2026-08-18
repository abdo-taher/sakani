<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

use Illuminate\Support\Facades\Cache;

class SettingController extends Controller
{
    /**
     * Get all merged settings (defaults + database values) with 5-minute cache
     */
    public function index()
    {
        $merged = Cache::remember('sakani_settings_merged', 300, function () {
            $defaults = Setting::defaults();
            $saved = [];

            try {
                if (Schema::hasTable('settings')) {
                    if (Schema::hasColumn('settings', 'key') && Schema::hasColumn('settings', 'value')) {
                        $rows = Setting::all();
                        foreach ($rows as $row) {
                            $val = $row->value;
                            $decoded = json_decode($val, true);
                            $saved[$row->key] = (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) ? $decoded : $val;
                        }
                    } else {
                        $first = Setting::first();
                        if ($first) {
                            $saved = $first->toArray();
                        }
                    }
                }
            } catch (\Exception $e) {
                // Use defaults if table query fails
            }

            return array_merge($defaults, $saved);
        });

        return response()->json($merged);
    }

    /**
     * Update or save settings
     */
    public function store(Request $request)
    {
        Cache::forget('sakani_settings_merged');
        $data = $request->all();

        // If wrapped in 'data' or 'settings' key
        if (isset($data['settings']) && is_array($data['settings'])) {
            $data = $data['settings'];
        }

        try {
            if (Schema::hasTable('settings') && Schema::hasColumn('settings', 'key') && Schema::hasColumn('settings', 'value')) {
                foreach ($data as $key => $val) {
                    $encodedVal = is_array($val) ? json_encode($val, JSON_UNESCAPED_UNICODE) : (string) $val;
                    Setting::updateOrCreate(
                        ['key' => $key],
                        ['value' => $encodedVal]
                    );
                }
            } else {
                $setting = Setting::first() ?: new Setting();
                $setting->fill($data);
                $setting->save();
            }

            try {
                Notification::create([
                    'type' => 'settings',
                    'title' => 'تحديث إعدادات الموقع',
                    'message' => 'تم تحديث إعدادات ومحتوى الموقع العام بنجاح',
                    'link' => '/admin?tab=cms',
                ]);
            } catch (\Exception $e) {}

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'حدث خطأ أثناء حفظ الإعدادات: ' . $e->getMessage(),
            ], 500);
        }

        return $this->index();
    }

    /**
     * Update settings (same as store for convenience)
     */
    public function update(Request $request, $id = null)
    {
        return $this->store($request);
    }

    /**
     * Delete setting by key
     */
    public function destroy($id)
    {
        try {
            Setting::where('key', $id)->orWhere('id', $id)->delete();
        } catch (\Exception $e) {}

        return response()->json([
            'message' => 'تم حذف الإعداد بنجاح',
        ]);
    }
}