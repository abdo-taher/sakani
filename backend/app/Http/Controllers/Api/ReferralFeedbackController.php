<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReferralFeedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReferralFeedbackController extends Controller
{
    /**
     * Store visitor / user acquisition feedback (Public)
     */
    public function store(Request $request)
    {
        $request->validate([
            'source_key'   => 'required|string|max:50',
            'source_label' => 'nullable|string|max:100',
            'custom_note'  => 'nullable|string|max:500',
            'phone'        => 'nullable|string|max:25',
            'device_type'  => 'nullable|string|max:30',
        ]);

        $labelMap = ReferralFeedback::getSourceLabelMap();
        $sourceKey = trim($request->source_key);
        $sourceLabel = $request->source_label ?: ($labelMap[$sourceKey] ?? $sourceKey);

        $phone = null;
        if ($request->filled('phone')) {
            $phone = preg_replace('/\D/', '', $request->phone);
            if (str_starts_with($phone, '20') && strlen($phone) > 10) {
                $phone = '0' . substr($phone, 2);
            }
        }

        // Detect device type if not provided
        $userAgent = $request->userAgent() ?? '';
        $deviceType = $request->device_type;
        if (!$deviceType) {
            if (preg_match('/(tablet|ipad|playbook)|(android(?!.*(mobi|opera mini)))/i', $userAgent)) {
                $deviceType = 'tablet';
            } elseif (preg_match('/(up.browser|up.link|mmp|symbian|smartphone|midp|wap|phone|android|iemobile|iphone)/i', $userAgent)) {
                $deviceType = 'mobile';
            } else {
                $deviceType = 'desktop';
            }
        }

        $feedback = ReferralFeedback::create([
            'source_key'   => $sourceKey,
            'source_label' => $sourceLabel,
            'custom_note'  => $request->custom_note ? trim($request->custom_note) : null,
            'phone'        => $phone,
            'device_type'  => $deviceType,
            'ip_address'   => $request->ip(),
            'user_agent'   => substr($userAgent, 0, 500),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'شكراً لمشاركتك! منور منصة سكنك يا باشا 🏡',
            'data'    => $feedback,
        ], 201);
    }

    /**
     * Get list of all referral feedbacks for Admin
     */
    public function index(Request $request)
    {
        $query = ReferralFeedback::query()->latest();

        if ($request->filled('source_key') && $request->source_key !== 'all') {
            $query->where('source_key', $request->source_key);
        }

        if ($request->filled('search')) {
            $search = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('source_label', 'like', $search)
                  ->orWhere('custom_note', 'like', $search)
                  ->orWhere('phone', 'like', $search);
            });
        }

        $feedbacks = $query->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data'    => $feedbacks->items(),
            'total'   => $feedbacks->total(),
            'current_page' => $feedbacks->currentPage(),
            'last_page' => $feedbacks->lastPage(),
        ]);
    }

    /**
     * Get aggregated referral stats & channel breakdown for Admin Dashboard
     */
    public function stats(Request $request)
    {
        $totalCount = ReferralFeedback::count();
        $labelMap = ReferralFeedback::getSourceLabelMap();

        $channelsData = ReferralFeedback::select('source_key', 'source_label', DB::raw('COUNT(*) as count'))
            ->groupBy('source_key', 'source_label')
            ->orderByDesc('count')
            ->get();

        $channelBreakdown = [];
        $recordedKeys = [];

        foreach ($channelsData as $row) {
            $count = (int) $row->count;
            $percent = $totalCount > 0 ? round(($count / $totalCount) * 100, 1) : 0;
            $recordedKeys[] = $row->source_key;

            $channelBreakdown[] = [
                'key'        => $row->source_key,
                'label'      => $row->source_label ?: ($labelMap[$row->source_key] ?? $row->source_key),
                'count'      => $count,
                'percentage' => $percent,
            ];
        }

        // Include any remaining canonical channels with 0 count for a complete overview
        foreach ($labelMap as $key => $label) {
            if (!in_array($key, $recordedKeys, true)) {
                $channelBreakdown[] = [
                    'key'        => $key,
                    'label'      => $label,
                    'count'      => 0,
                    'percentage' => 0,
                ];
            }
        }

        // Sort breakdown by count descending
        usort($channelBreakdown, fn($a, $b) => $b['count'] <=> $a['count']);

        $topChannel = $channelBreakdown[0] ?? null;
        if ($topChannel && $topChannel['count'] === 0) {
            $topChannel = null;
        }

        // Device breakdown
        $deviceBreakdown = ReferralFeedback::select('device_type', DB::raw('COUNT(*) as count'))
            ->groupBy('device_type')
            ->orderByDesc('count')
            ->get()
            ->map(function ($row) use ($totalCount) {
                return [
                    'device'     => $row->device_type ?: 'web',
                    'count'      => (int) $row->count,
                    'percentage' => $totalCount > 0 ? round(((int)$row->count / $totalCount) * 100, 1) : 0,
                ];
            });

        // Recent 10 feedback items
        $recentFeedbacks = ReferralFeedback::latest()->take(10)->get();

        return response()->json([
            'success'          => true,
            'total_responses'  => $totalCount,
            'top_channel'      => $topChannel,
            'channel_breakdown'=> $channelBreakdown,
            'device_breakdown' => $deviceBreakdown,
            'recent_feedbacks' => $recentFeedbacks,
        ]);
    }

    /**
     * Delete a single feedback record
     */
    public function destroy($id)
    {
        $feedback = ReferralFeedback::findOrFail($id);
        $feedback->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الاستجابة بنجاح',
        ]);
    }
}
