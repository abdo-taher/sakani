<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeedbackCampaign;
use App\Models\FeedbackResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FeedbackCampaignController extends Controller
{
    /**
     * Get all campaigns with metrics
     */
    public function index()
    {
        $campaigns = FeedbackCampaign::latest()->get()->map(function ($camp) {
            $responses = FeedbackResponse::where('campaign_id', (string)$camp->id)->get();
            $ratings = $responses->whereNotNull('rating')->pluck('rating');
            $avgRating = $ratings->count() > 0 ? round($ratings->avg(), 1) : null;

            return [
                'id'              => (string)$camp->id,
                'title'           => $camp->title,
                'description'     => $camp->description,
                'type'            => $camp->type,
                'question'        => $camp->question,
                'options'         => $camp->options,
                'target_page'     => $camp->target_page,
                'start_date'      => $camp->start_date ? $camp->start_date->format('Y-m-d\TH:i') : null,
                'end_date'        => $camp->end_date ? $camp->end_date->format('Y-m-d\TH:i') : null,
                'delay_seconds'   => $camp->delay_seconds ?? 60,
                'is_active'       => (bool)$camp->is_active,
                'created_at'      => $camp->created_at ? $camp->created_at->toISOString() : now()->toISOString(),
                'responses_count' => $responses->count(),
                'average_rating'  => $avgRating,
            ];
        });

        return response()->json([
            'success'   => true,
            'campaigns' => $campaigns,
        ]);
    }

    /**
     * Get active campaign for client display
     */
    public function active(Request $request)
    {
        $page = $request->query('page', 'all');
        $now = now();
        
        $campaign = FeedbackCampaign::where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $now);
            })
            ->where(function ($q) use ($page) {
                $q->where('target_page', 'all');
                if ($page && $page !== 'all') {
                    $q->orWhere('target_page', $page);
                }
            })
            ->latest()
            ->first();

        return response()->json([
            'success'  => true,
            'campaign' => $campaign ? [
                'id'            => (string)$campaign->id,
                'title'         => $campaign->title,
                'description'   => $campaign->description,
                'type'          => $campaign->type,
                'question'      => $campaign->question,
                'options'       => $campaign->options,
                'target_page'   => $campaign->target_page,
                'start_date'    => $campaign->start_date ? $campaign->start_date->format('Y-m-d\TH:i') : null,
                'end_date'      => $campaign->end_date ? $campaign->end_date->format('Y-m-d\TH:i') : null,
                'delay_seconds' => $campaign->delay_seconds ?? 60,
                'is_active'     => (bool)$campaign->is_active,
                'created_at'    => $campaign->created_at ? $campaign->created_at->toISOString() : now()->toISOString(),
            ] : null,
        ]);
    }

    /**
     * Store new feedback campaign (Admin)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'         => 'required|string|max:255',
            'description'   => 'nullable|string|max:500',
            'type'          => 'required|string|in:rating,choice,text,net_promoter',
            'question'      => 'required|string|max:500',
            'options'       => 'nullable|array',
            'target_page'   => 'nullable|string|max:50',
            'start_date'    => 'nullable|date',
            'end_date'      => 'nullable|date|after_or_equal:start_date',
            'delay_seconds' => 'nullable|integer|min:5|max:3600',
            'is_active'     => 'nullable|boolean',
        ]);

        $campaign = FeedbackCampaign::create([
            'title'         => $validated['title'],
            'description'   => $validated['description'] ?? null,
            'type'          => $validated['type'],
            'question'      => $validated['question'],
            'options'       => $validated['options'] ?? null,
            'target_page'   => $validated['target_page'] ?? 'all',
            'start_date'    => $validated['start_date'] ?? null,
            'end_date'      => $validated['end_date'] ?? null,
            'delay_seconds' => $validated['delay_seconds'] ?? 60,
            'is_active'     => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'success'  => true,
            'message'  => 'تم إنشاء حملة الاستطلاع بنجاح',
            'campaign' => $campaign,
        ], 201);
    }

    /**
     * Update campaign
     */
    public function update(Request $request, $id)
    {
        $campaign = FeedbackCampaign::findOrFail($id);

        $campaign->update($request->only([
            'title',
            'description',
            'type',
            'question',
            'options',
            'target_page',
            'start_date',
            'end_date',
            'delay_seconds',
            'is_active',
        ]));

        return response()->json([
            'success'  => true,
            'message'  => 'تم تحديث الحملة بنجاح',
            'campaign' => $campaign,
        ]);
    }

    /**
     * Delete campaign
     */
    public function destroy($id)
    {
        $campaign = FeedbackCampaign::findOrFail($id);
        $campaign->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الحملة بنجاح',
        ]);
    }

    /**
     * Store client feedback response (Public)
     */
    public function storeResponse(Request $request)
    {
        $validated = $request->validate([
            'campaign_id'           => 'required|string|max:100',
            'campaign_title'        => 'nullable|string|max:255',
            'client_name'           => 'nullable|string|max:100',
            'client_phone'          => 'nullable|string|max:25',
            'rating'                => 'nullable|integer|min:1|max:5',
            'selected_option_id'    => 'nullable|string|max:100',
            'selected_option_label' => 'nullable|string|max:255',
            'comment'               => 'nullable|string|max:1000',
            'page_url'              => 'nullable|string|max:255',
            'device_type'           => 'nullable|string|max:50',
        ]);

        $phone = null;
        if ($request->filled('client_phone')) {
            $phone = preg_replace('/\D/', '', $request->client_phone);
            if (str_starts_with($phone, '20') && strlen($phone) > 10) {
                $phone = '0' . substr($phone, 2);
            }
        }

        $userAgent = $request->userAgent() ?? '';
        $deviceType = $validated['device_type'] ?? null;
        if (!$deviceType) {
            if (preg_match('/(tablet|ipad|playbook)|(android(?!.*(mobi|opera mini)))/i', $userAgent)) {
                $deviceType = 'tablet';
            } elseif (preg_match('/(up.browser|up.link|mmp|symbian|smartphone|midp|wap|phone|android|iemobile|iphone)/i', $userAgent)) {
                $deviceType = 'mobile';
            } else {
                $deviceType = 'desktop';
            }
        }

        $response = FeedbackResponse::create([
            'campaign_id'           => $validated['campaign_id'],
            'campaign_title'        => $validated['campaign_title'] ?? null,
            'client_name'           => $validated['client_name'] ?? null,
            'client_phone'          => $phone,
            'rating'                => $validated['rating'] ?? null,
            'selected_option_id'    => $validated['selected_option_id'] ?? null,
            'selected_option_label' => $validated['selected_option_label'] ?? null,
            'comment'               => $validated['comment'] ?? null,
            'page_url'              => $validated['page_url'] ?? null,
            'device_type'           => $deviceType,
            'ip_address'            => $request->ip(),
            'user_agent'            => substr($userAgent, 0, 500),
        ]);

        return response()->json([
            'success'  => true,
            'message'  => 'تسلم إيدك! شكراً لمشاركتك القيّمة ❤️',
            'response' => $response,
        ], 201);
    }

    /**
     * Get responses for Admin
     */
    public function responses(Request $request)
    {
        $query = FeedbackResponse::query()->latest();

        if ($request->filled('campaign_id') && $request->campaign_id !== 'all') {
            $query->where('campaign_id', $request->campaign_id);
        }

        if ($request->filled('search')) {
            $s = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('client_name', 'like', $s)
                  ->orWhere('client_phone', 'like', $s)
                  ->orWhere('comment', 'like', $s)
                  ->orWhere('selected_option_label', 'like', $s);
            });
        }

        $responses = $query->paginate($request->input('per_page', 25));

        return response()->json([
            'success'   => true,
            'data'      => $responses->items(),
            'total'     => $responses->total(),
            'last_page' => $responses->lastPage(),
        ]);
    }

    /**
     * Get aggregated stats
     */
    public function stats()
    {
        $campaignsCount = FeedbackCampaign::count();
        $activeCount = FeedbackCampaign::where('is_active', true)->count();
        $responsesCount = FeedbackResponse::count();

        $allRatings = FeedbackResponse::whereNotNull('rating')->pluck('rating');
        $avgSatisfaction = $allRatings->count() > 0 
            ? round(($allRatings->avg() / 5) * 100) 
            : 96;

        $recentResponses = FeedbackResponse::latest()->take(10)->get();

        return response()->json([
            'success' => true,
            'stats'   => [
                'total_campaigns'                 => $campaignsCount,
                'active_campaigns'                => $activeCount,
                'total_responses'                 => $responsesCount,
                'average_satisfaction_percentage' => $avgSatisfaction,
                'recent_responses'                => $recentResponses,
            ],
        ]);
    }
}
