<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Location;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\NeedRequest;
use App\Models\ContactMessage;
use App\Models\Room;
use App\Models\VisitorLog;
use App\Models\ReferralFeedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Exception;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $range = $request->input('range', 'all'); // today, 7_days, 30_days, all
        $cacheKey = 'sakani_dashboard_stats_v2_' . $range;

        // Cache dashboard aggregation for 30 seconds to keep DB light and responsive
        return Cache::remember($cacheKey, 30, function () use ($range) {
            $dateFilter = null;
            if ($range === 'today') {
                $dateFilter = now()->startOfDay();
            } elseif ($range === '7_days') {
                $dateFilter = now()->subDays(7)->startOfDay();
            } elseif ($range === '30_days') {
                $dateFilter = now()->subDays(30)->startOfDay();
            }

            $counts = [
                'total_properties'     => 0,
                'available_properties' => 0,
                'rented_properties'    => 0,
                'sold_properties'      => 0,
                'pending_submissions'  => 0,
                'approved_submissions' => 0,
                'rejected_submissions' => 0,
                'total_rooms'          => 0,
                'available_rooms'      => 0,
                'total_reservations'   => 0,
                'pending_reservations' => 0,
                'accepted_reservations'=> 0,
                'rejected_reservations'=> 0,
                'need_requests'        => 0,
                'contact_messages'     => 0,
                'total_views'          => 0,
                'total_customers'      => 0,
                'referral_feedbacks'   => 0,
            ];

            try {
                $propQuery = Property::query();
                if ($dateFilter) $propQuery->where('created_at', '>=', $dateFilter);

                $counts['total_properties']     = (clone $propQuery)->count();
                $counts['available_properties'] = (clone $propQuery)->where('status', 'available')->count();
                $counts['rented_properties']    = (clone $propQuery)->where('status', 'rented')->count();
                $counts['sold_properties']      = (clone $propQuery)->where('status', 'sold')->count();
                $counts['pending_submissions']  = (clone $propQuery)->where(function($q){
                    $q->where('submission_status', 'pending_review')->orWhere('status', 'pending_review');
                })->count();
                $counts['approved_submissions'] = (clone $propQuery)->where('submission_status', 'approved')->count();
                $counts['rejected_submissions'] = (clone $propQuery)->where(function($q){
                    $q->where('submission_status', 'rejected')->orWhere('status', 'rejected');
                })->count();
                $counts['total_views']          = (int) (clone $propQuery)->sum('views');
            } catch (Exception $e) { Log::warning('Dashboard prop stats: ' . $e->getMessage()); }

            try {
                $counts['total_rooms'] = Room::count();
                $counts['available_rooms'] = Room::where('is_available', true)->count();
            } catch (Exception $e) { Log::warning('Dashboard room stats: ' . $e->getMessage()); }

            try {
                $resQuery = Reservation::query();
                if ($dateFilter) $resQuery->where('created_at', '>=', $dateFilter);

                $counts['total_reservations']    = (clone $resQuery)->count();
                $counts['pending_reservations']  = (clone $resQuery)->where('status', 'pending')->count();
                $counts['accepted_reservations'] = (clone $resQuery)->where('status', 'accepted')->count();
                $counts['rejected_reservations'] = (clone $resQuery)->where('status', 'rejected')->count();
            } catch (Exception $e) { Log::warning('Dashboard res stats: ' . $e->getMessage()); }

            try {
                $needQuery = NeedRequest::query();
                if ($dateFilter) $needQuery->where('created_at', '>=', $dateFilter);
                $counts['need_requests'] = $needQuery->count();
            } catch (Exception $e) {}

            try {
                $msgQuery = ContactMessage::query();
                if ($dateFilter) $msgQuery->where('created_at', '>=', $dateFilter);
                $counts['contact_messages'] = $msgQuery->count();
            } catch (Exception $e) {}

            try {
                $refQuery = ReferralFeedback::query();
                if ($dateFilter) $refQuery->where('created_at', '>=', $dateFilter);
                $counts['referral_feedbacks'] = $refQuery->count();
            } catch (Exception $e) {}

            // Audience classification distribution
            $audienceDistribution = [];
            try {
                $audienceDistribution = [
                    ['name' => 'عائلات', 'key' => 'families', 'value' => Property::where('audience_type', 'families')->count()],
                    ['name' => 'شباب ومهندسين', 'key' => 'young_men', 'value' => Property::where('audience_type', 'young_men')->count()],
                    ['name' => 'طالبات ومغتربات', 'key' => 'female_students', 'value' => Property::where('audience_type', 'female_students')->count()],
                    ['name' => 'الكل / عام', 'key' => 'all', 'value' => Property::where(function($q){ $q->whereNull('audience_type')->orWhere('audience_type', 'all'); })->count()],
                ];
            } catch (Exception $e) {}

            // Category distribution
            $categoryDistribution = [];
            try {
                $categoryDistribution = Property::selectRaw('category_id, COUNT(*) as total')
                    ->groupBy('category_id')
                    ->get()
                    ->map(function ($row) {
                        $cat = Category::find($row->category_id);
                        return [
                            'name'  => $cat->name ?? 'غير محدد',
                            'value' => (int) $row->total,
                        ];
                    });
            } catch (Exception $e) {}

            // Location / District distribution
            $locationDistribution = [];
            try {
                $locationDistribution = Property::selectRaw('location_id, COUNT(*) as total')
                    ->groupBy('location_id')
                    ->get()
                    ->map(function ($row) {
                        $loc = Location::find($row->location_id);
                        return [
                            'name'  => $loc->name ?? 'غير محدد',
                            'value' => (int) $row->total,
                        ];
                    });
            } catch (Exception $e) {}

            // Top viewed properties
            $topViewedProperties = [];
            try {
                $topViewedProperties = Property::orderByDesc('views')
                    ->take(6)
                    ->get(['id', 'title', 'price', 'views', 'status', 'operation_type', 'location_id']);
            } catch (Exception $e) {}

            // Monthly stats (past 6 months)
            $monthlyStats = collect();
            try {
                $months = collect(range(5, 0))->map(function ($i) {
                    return now()->subMonths($i)->format('Y-m');
                })->values();

                $propertiesMonthly = Property::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as total")
                    ->where('created_at', '>=', now()->subMonths(5)->startOfMonth())
                    ->groupBy('month')
                    ->pluck('total', 'month');

                $reservationsMonthly = Reservation::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as total")
                    ->where('created_at', '>=', now()->subMonths(5)->startOfMonth())
                    ->groupBy('month')
                    ->pluck('total', 'month');

                $monthlyStats = $months->map(function ($month) use ($propertiesMonthly, $reservationsMonthly) {
                    return [
                        'month'        => $month,
                        'properties'   => (int) ($propertiesMonthly[$month] ?? 0),
                        'reservations' => (int) ($reservationsMonthly[$month] ?? 0),
                    ];
                });
            } catch (Exception $e) {}

            // Visitor stats (Unique IPs across Today, Month, All-Time + Total Pageviews)
            $visitorStats = [
                'today'            => 1,
                'month'            => 1,
                'all_time'         => 1,
                'total_visits'     => 1,
                'property_views'   => $counts['total_views'] ?? 0,
                'daily_breakdown'  => [],
            ];

            try {
                $today      = now()->startOfDay();
                $monthStart = now()->startOfMonth();

                $todayUnique = (int) (VisitorLog::where('created_at', '>=', $today)->selectRaw('COUNT(DISTINCT ip) as c')->value('c') ?: 0);
                $monthUnique = (int) (VisitorLog::where('created_at', '>=', $monthStart)->selectRaw('COUNT(DISTINCT ip) as c')->value('c') ?: 0);
                $allTimeUnique = (int) (VisitorLog::selectRaw('COUNT(DISTINCT ip) as c')->value('c') ?: 0);
                $totalVisits = (int) VisitorLog::count();

                // Last 7 days breakdown
                $dailyBreakdown = [];
                $arabicDays = ['Sun' => 'الأحد', 'Mon' => 'الإثنين', 'Tue' => 'الثلاثاء', 'Wed' => 'الأربعاء', 'Thu' => 'الخميس', 'Fri' => 'الجمعة', 'Sat' => 'السبت'];
                for ($i = 6; $i >= 0; $i--) {
                    $d = now()->subDays($i);
                    $dStart = (clone $d)->startOfDay();
                    $dEnd = (clone $d)->endOfDay();
                    $dayUnique = (int) (VisitorLog::whereBetween('created_at', [$dStart, $dEnd])->selectRaw('COUNT(DISTINCT ip) as c')->value('c') ?: 0);
                    $dayViews = (int) VisitorLog::whereBetween('created_at', [$dStart, $dEnd])->count();
                    $dayName = ($i === 0) ? 'اليوم (' . ($arabicDays[$d->format('D')] ?? '') . ')' : ($arabicDays[$d->format('D')] ?? $d->format('D'));
                    $dailyBreakdown[] = [
                        'date'      => $d->format('Y-m-d'),
                        'day_name'  => $dayName,
                        'visitors'  => max($dayUnique, $i === 0 ? 1 : 0),
                        'views'     => max($dayViews, $dayUnique),
                    ];
                }

                $visitorStats = [
                    'today'            => max(1, $todayUnique),
                    'month'            => max($todayUnique, $monthUnique),
                    'all_time'         => max($monthUnique, $allTimeUnique),
                    'total_visits'     => max($totalVisits, ($counts['total_views'] ?? 0)),
                    'property_views'   => $counts['total_views'] ?? 0,
                    'daily_breakdown'  => $dailyBreakdown,
                ];
            } catch (Exception $e) {
                Log::warning('Visitor stats calculation error: ' . $e->getMessage());
            }

            // Acquisition Channels & Referral Stats (How users found us)
            $referralStats = [
                'total_responses'   => 0,
                'top_channel'       => null,
                'channel_breakdown' => [],
                'recent_feedbacks'  => [],
            ];
            try {
                $refTotal = ReferralFeedback::count();
                $labelMap = ReferralFeedback::getSourceLabelMap();
                $refGrouped = ReferralFeedback::select('source_key', 'source_label', DB::raw('COUNT(*) as count'))
                    ->groupBy('source_key', 'source_label')
                    ->orderByDesc('count')
                    ->get();

                $breakdown = [];
                $foundKeys = [];

                foreach ($refGrouped as $row) {
                    $c = (int) $row->count;
                    $foundKeys[] = $row->source_key;
                    $breakdown[] = [
                        'key'        => $row->source_key,
                        'label'      => $row->source_label ?: ($labelMap[$row->source_key] ?? $row->source_key),
                        'count'      => $c,
                        'percentage' => $refTotal > 0 ? round(($c / $refTotal) * 100, 1) : 0,
                    ];
                }

                foreach ($labelMap as $k => $lbl) {
                    if (!in_array($k, $foundKeys, true)) {
                        $breakdown[] = [
                            'key'        => $k,
                            'label'      => $lbl,
                            'count'      => 0,
                            'percentage' => 0,
                        ];
                    }
                }

                usort($breakdown, fn($a, $b) => $b['count'] <=> $a['count']);

                $top = $breakdown[0] ?? null;
                if ($top && $top['count'] === 0) {
                    $top = null;
                }

                $recent = ReferralFeedback::latest()->take(6)->get(['id', 'source_key', 'source_label', 'custom_note', 'device_type', 'created_at']);

                $referralStats = [
                    'total_responses'   => $refTotal,
                    'top_channel'       => $top,
                    'channel_breakdown' => $breakdown,
                    'recent_feedbacks'  => $recent,
                ];
            } catch (Exception $e) {
                Log::warning('Referral stats calculation error: ' . $e->getMessage());
            }

            return response()->json([
                'success'               => true,
                'counts'                => $counts,
                'audience_distribution' => $audienceDistribution,
                'category_distribution' => $categoryDistribution,
                'location_distribution' => $locationDistribution,
                'top_viewed_properties' => $topViewedProperties,
                'monthly_stats'         => $monthlyStats,
                'visitor_stats'         => $visitorStats,
                'referral_stats'        => $referralStats,
            ]);
        });
    }
}
