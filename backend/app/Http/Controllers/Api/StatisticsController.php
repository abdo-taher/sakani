<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Location;
use App\Models\Property;
use App\Models\PropertyType;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\VisitorLog;
use App\Models\ReferralFeedback;
use App\Models\FeedbackCampaign;
use App\Models\FeedbackResponse;
use App\Models\Setting;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Exception;

class StatisticsController extends Controller
{
    /**
     * Comprehensive Admin Statistics & Decision-Support Analytics
     */
    public function index(Request $request)
    {
        $range = $request->input('range', 'all'); // all, 30_days, 7_days, today, 90_days
        $cacheKey = 'sakani_statistics_data_v3_' . $range;

        // Cache statistics for 30 seconds to maintain high performance
        return Cache::remember($cacheKey, 30, function () use ($range) {
            $now = Carbon::now();
            $currentStart = null;
            $currentEnd = $now;
            $prevStart = null;
            $prevEnd = null;
            $rangeDays = 0;

            if ($range === 'today') {
                $currentStart = (clone $now)->startOfDay();
                $prevStart = (clone $now)->subDay()->startOfDay();
                $prevEnd = (clone $now)->subDay()->endOfDay();
                $rangeDays = 1;
            } elseif ($range === '7_days') {
                $currentStart = (clone $now)->subDays(7)->startOfDay();
                $prevStart = (clone $now)->subDays(14)->startOfDay();
                $prevEnd = (clone $now)->subDays(7)->startOfDay();
                $rangeDays = 7;
            } elseif ($range === '30_days') {
                $currentStart = (clone $now)->subDays(30)->startOfDay();
                $prevStart = (clone $now)->subDays(60)->startOfDay();
                $prevEnd = (clone $now)->subDays(30)->startOfDay();
                $rangeDays = 30;
            } elseif ($range === '90_days') {
                $currentStart = (clone $now)->subDays(90)->startOfDay();
                $prevStart = (clone $now)->subDays(180)->startOfDay();
                $prevEnd = (clone $now)->subDays(90)->startOfDay();
                $rangeDays = 90;
            }

            // 1. Check Visit Baseline Setting
            $baselineSetting = Setting::where('key', 'visits_baseline_at')->value('value');
            $baseline = $baselineSetting ? Carbon::parse($baselineSetting) : null;
            $lastResetAt = Setting::where('key', 'visits_last_reset_at')->value('value');
            $resetBy = Setting::where('key', 'visits_reset_by')->value('value') ?: 'مدير النظام';

            // 2. Overview KPIs & Real Period Comparisons
            $kpis = $this->calculateKPIs($currentStart, $prevStart, $prevEnd, $baseline);

            // 3. Traffic Trends (Chart Data)
            $trafficTrends = $this->calculateTrafficTrends($range, $baseline);

            // 4. Inventory Analytics (By Location, Operation, Audience, Type, Status, Furnishing)
            $inventory = $this->calculateInventoryAnalytics($currentStart);

            // 5. Room-Based Rentals Analytics
            $roomsAnalytics = $this->calculateRoomsAnalytics();

            // 6. Reservation Lifecycle & Conversion Analytics
            $reservationsAnalytics = $this->calculateReservationsAnalytics($currentStart);

            // 7. High Views / Low Conversion Intelligence
            $conversionIntelligence = $this->calculateConversionIntelligence();

            // 8. Acquisition & Referral Feedback Channels
            $acquisition = $this->calculateAcquisitionAnalytics($currentStart);

            // 9. Feedback & Survey Campaigns Summary
            $feedbackSummary = $this->calculateFeedbackSummary($currentStart);

            // 10. Recent Platform Activity
            $recentActivity = $this->getRecentActivity();

            return response()->json([
                'success'                 => true,
                'range'                   => $range,
                'baseline_info'           => [
                    'baseline_at'   => $baseline ? $baseline->toISOString() : null,
                    'last_reset_at' => $lastResetAt,
                    'reset_by'      => $resetBy,
                ],
                'kpis'                    => $kpis,
                'traffic_trends'          => $trafficTrends,
                'inventory'               => $inventory,
                'rooms_analytics'         => $roomsAnalytics,
                'reservations_analytics'  => $reservationsAnalytics,
                'conversion_intelligence' => $conversionIntelligence,
                'acquisition'             => $acquisition,
                'feedback_summary'        => $feedbackSummary,
                'recent_activity'         => $recentActivity,
            ]);
        });
    }

    /**
     * Safely Reset Visits Baseline (Admin Only)
     */
    public function resetVisits(Request $request)
    {
        $user = $request->user();
        $now = now();
        $iso = $now->toISOString();
        $adminName = $user ? ($user->name ?: $user->email) : 'مدير النظام';

        // 1. Update baseline in Setting
        Setting::updateOrCreate(['key' => 'visits_baseline_at'], ['value' => $iso]);
        Setting::updateOrCreate(['key' => 'visits_last_reset_at'], ['value' => $iso]);
        Setting::updateOrCreate(['key' => 'visits_reset_by'], ['value' => $adminName]);

        // 2. Clear relevant caches across all ranges
        Cache::forget('sakani_public_stats_v2');
        Cache::forget('sakani_settings_merged');
        foreach (['all', 'today', '7_days', '30_days', '90_days'] as $r) {
            Cache::forget('sakani_dashboard_stats_v2_' . $r);
            Cache::forget('sakani_statistics_data_v2_' . $r);
            Cache::forget('sakani_statistics_data_v3_' . $r);
        }

        // 3. Log audit notification
        try {
            Notification::create([
                'type'    => 'system_alert',
                'title'   => 'إعادة ضبط عداد الزيارات',
                'message' => "تم إعادة ضبط خط الأساس لعداد الزيارات وبدء العد من الصفر بنجاح بواسطة {$adminName}.",
                'link'    => '/admin/statistics',
            ]);
        } catch (\Exception $e) {}

        return response()->json([
            'success'     => true,
            'message'     => 'تمت إعادة ضبط خط الأساس لعداد الزيارات بنجاح وبدء العد من الصفر دون التأثير على بيانات العقارات أو الحجوزات.',
            'baseline_at' => $iso,
            'visitor_stats' => [
                'today'           => 0,
                'month'           => 0,
                'all_time'        => 0,
                'total_visits'    => 0,
                'daily_breakdown' => [],
            ],
        ]);
    }

    /**
     * Fast cached Public Stats for Home Page
     */
    public function publicStats()
    {
        $stats = Cache::remember('sakani_public_stats_v2', 300, function () {
            $availableProperties = Property::where('status', 'available')->where('is_uploading', false)->count();
            $locationsCount = Location::count();
            $reservationsCount = Reservation::count();
            $roomsCount = DB::table('rooms')->where('status', 'available')->count();
            $totalViews = (int) Property::sum('views');

            return [
                'available_properties' => $availableProperties,
                'locations_count'      => $locationsCount,
                'reservations_count'   => $reservationsCount,
                'available_rooms'      => $roomsCount,
                'total_views'          => $totalViews,
                'satisfaction_rate'    => 98,
                'commission_rate'      => '2.5%',
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $stats,
        ]);
    }

    // ------------------------------------------------------------------------
    // INTERNAL ANALYTICS HELPER METHODS
    // ------------------------------------------------------------------------

    private function calculateKPIs($currentStart, $prevStart, $prevEnd, $baseline): array
    {
        // 1. Visits & Unique Visitors
        $visitQuery = VisitorLog::query();
        if ($baseline) {
            $visitQuery->where('created_at', '>=', $baseline);
        }
        if ($currentStart) {
            $effectiveStart = $baseline && $baseline > $currentStart ? $baseline : $currentStart;
            $visitQuery->where('created_at', '>=', $effectiveStart);
        }
        $currentVisits = (clone $visitQuery)->count();
        $currentVisitors = (int) ((clone $visitQuery)->selectRaw('COUNT(DISTINCT ip) as c')->value('c') ?: 0);

        $prevVisits = null;
        $prevVisitors = null;
        if ($prevStart && $prevEnd) {
            $pQuery = VisitorLog::whereBetween('created_at', [$prevStart, $prevEnd]);
            if ($baseline) {
                $pQuery->where('created_at', '>=', $baseline);
            }
            $prevVisits = (clone $pQuery)->count();
            $prevVisitors = (int) ((clone $pQuery)->selectRaw('COUNT(DISTINCT ip) as c')->value('c') ?: 0);
        }

        // 2. Reservations
        $resQuery = Reservation::query();
        if ($currentStart) $resQuery->where('created_at', '>=', $currentStart);
        $currentReservations = (clone $resQuery)->count();

        $prevReservations = null;
        if ($prevStart && $prevEnd) {
            $prevReservations = Reservation::whereBetween('created_at', [$prevStart, $prevEnd])->count();
        }

        // 3. Properties Added
        $propQuery = Property::query();
        if ($currentStart) $propQuery->where('created_at', '>=', $currentStart);
        $currentProperties = (clone $propQuery)->count();

        $prevProperties = null;
        if ($prevStart && $prevEnd) {
            $prevProperties = Property::whereBetween('created_at', [$prevStart, $prevEnd])->count();
        }

        // 4. Property Views
        $totalViews = (int) Property::sum('views');

        // 5. Feedback Responses
        $fbQuery = FeedbackResponse::query();
        if ($currentStart) $fbQuery->where('created_at', '>=', $currentStart);
        $currentFeedback = (clone $fbQuery)->count();

        $prevFeedback = null;
        if ($prevStart && $prevEnd) {
            $prevFeedback = FeedbackResponse::whereBetween('created_at', [$prevStart, $prevEnd])->count();
        }

        return [
            'visits' => [
                'current'  => $currentVisits,
                'previous' => $prevVisits,
                'trend'    => $this->computeTrend($currentVisits, $prevVisits),
            ],
            'visitors' => [
                'current'  => $currentVisitors,
                'previous' => $prevVisitors,
                'trend'    => $this->computeTrend($currentVisitors, $prevVisitors),
            ],
            'reservations' => [
                'current'  => $currentReservations,
                'previous' => $prevReservations,
                'trend'    => $this->computeTrend($currentReservations, $prevReservations),
            ],
            'properties' => [
                'current'  => $currentProperties,
                'previous' => $prevProperties,
                'trend'    => $this->computeTrend($currentProperties, $prevProperties),
            ],
            'total_views' => [
                'current'  => $totalViews,
                'previous' => null,
                'trend'    => ['percentage' => 0, 'direction' => 'equal', 'has_comparison' => false],
            ],
            'feedback_responses' => [
                'current'  => $currentFeedback,
                'previous' => $prevFeedback,
                'trend'    => $this->computeTrend($currentFeedback, $prevFeedback),
            ],
        ];
    }

    private function calculateTrafficTrends(string $range, $baseline): array
    {
        $days = 7;
        if ($range === '30_days') $days = 30;
        elseif ($range === '90_days') $days = 30; // 30 aggregated points for 90 days
        elseif ($range === 'today') $days = 1;

        $arabicDays = ['Sun' => 'الأحد', 'Mon' => 'الإثنين', 'Tue' => 'الثلاثاء', 'Wed' => 'الأربعاء', 'Thu' => 'الخميس', 'Fri' => 'الجمعة', 'Sat' => 'السبت'];
        $points = [];

        if ($days === 1) {
            // Hourly breakdown for Today
            $startOfToday = now()->startOfDay();
            for ($h = 0; $h <= now()->hour; $h += 2) {
                $hStart = (clone $startOfToday)->addHours($h);
                $hEnd = (clone $startOfToday)->addHours($h + 2)->subSecond();

                $vQ = VisitorLog::whereBetween('created_at', [$hStart, $hEnd]);
                if ($baseline) $vQ->where('created_at', '>=', $baseline);

                $rQ = Reservation::whereBetween('created_at', [$hStart, $hEnd]);

                $points[] = [
                    'label'        => sprintf('%02d:00', $h),
                    'date'         => $hStart->format('Y-m-d H:i'),
                    'visitors'     => (int) ($vQ->selectRaw('COUNT(DISTINCT ip) as c')->value('c') ?: 0),
                    'views'        => (int) $vQ->count(),
                    'reservations' => (int) $rQ->count(),
                ];
            }
        } else {
            // Daily breakdown
            for ($i = $days - 1; $i >= 0; $i--) {
                $d = now()->subDays($i);
                $dStart = (clone $d)->startOfDay();
                $dEnd = (clone $d)->endOfDay();

                $vQ = VisitorLog::whereBetween('created_at', [$dStart, $dEnd]);
                if ($baseline) {
                    if ($baseline > $dEnd) {
                        $points[] = [
                            'label'        => $arabicDays[$d->format('D')] ?? $d->format('D'),
                            'date'         => $d->format('Y-m-d'),
                            'visitors'     => 0,
                            'views'        => 0,
                            'reservations' => (int) Reservation::whereBetween('created_at', [$dStart, $dEnd])->count(),
                        ];
                        continue;
                    }
                    $effectiveStart = $baseline > $dStart ? $baseline : $dStart;
                    $vQ = VisitorLog::whereBetween('created_at', [$effectiveStart, $dEnd]);
                }

                $points[] = [
                    'label'        => ($i === 0) ? 'اليوم' : ($arabicDays[$d->format('D')] ?? $d->format('D')),
                    'date'         => $d->format('Y-m-d'),
                    'visitors'     => (int) ($vQ->selectRaw('COUNT(DISTINCT ip) as c')->value('c') ?: 0),
                    'views'        => (int) $vQ->count(),
                    'reservations' => (int) Reservation::whereBetween('created_at', [$dStart, $dEnd])->count(),
                ];
            }
        }

        return $points;
    }

    private function calculateInventoryAnalytics($currentStart): array
    {
        $totalProps = Property::count();

        // 1. Status Breakdown
        $statusCounts = Property::selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $statusLabels = [
            'available' => 'متاح وجاهز',
            'reserved'  => 'محجوز',
            'rented'    => 'تم التأجير',
            'sold'      => 'تم البيع',
        ];

        $byStatus = [];
        foreach (['available', 'reserved', 'rented', 'sold'] as $st) {
            $count = (int) ($statusCounts[$st] ?? 0);
            $byStatus[] = [
                'key'        => $st,
                'name'       => $statusLabels[$st] ?? $st,
                'count'      => $count,
                'percentage' => $totalProps > 0 ? round(($count / $totalProps) * 100, 1) : 0,
            ];
        }

        // 2. Operation Breakdown (Rent vs Sale via Category)
        $catCounts = Property::selectRaw('category_id, COUNT(*) as total, AVG(price) as avg_price')
            ->whereNotNull('category_id')
            ->groupBy('category_id')
            ->with('category:id,name,slug')
            ->get();

        $byOperation = [];
        foreach ($catCounts as $row) {
            $cat = $row->category;
            $slug = $cat ? $cat->slug : 'rent';
            $name = $cat ? $cat->name : 'إيجار';
            $c = (int) $row->total;
            $byOperation[] = [
                'key'        => $slug,
                'name'       => $name,
                'count'      => $c,
                'percentage' => $totalProps > 0 ? round(($c / $totalProps) * 100, 1) : 0,
                'avg_price'  => round((float) $row->avg_price),
            ];
        }

        // 3. Audience Classification Breakdown
        $audienceRows = Property::selectRaw("COALESCE(audience_type, 'all') as aud, COUNT(*) as total")
            ->groupBy('aud')
            ->pluck('total', 'aud')
            ->toArray();

        $audLabels = [
            'families'        => 'عائلات وسكن خاص',
            'female_students' => 'طالبات ومغتربات',
            'young_men'       => 'شباب ومهندسين وموظفين',
            'all'             => 'عام / غير مقيد',
        ];

        $byAudience = [];
        foreach (['families', 'female_students', 'young_men', 'all'] as $aud) {
            $c = (int) ($audienceRows[$aud] ?? 0);
            $byAudience[] = [
                'key'        => $aud,
                'name'       => $audLabels[$aud] ?? $aud,
                'count'      => $c,
                'percentage' => $totalProps > 0 ? round(($c / $totalProps) * 100, 1) : 0,
            ];
        }

        // 4. By Location (Districts)
        $byLocation = Property::selectRaw("location_id, COUNT(*) as total_properties, SUM(CASE WHEN status='available' THEN 1 ELSE 0 END) as available_properties, AVG(price) as avg_price, SUM(views) as total_views")
            ->whereNotNull('location_id')
            ->groupBy('location_id')
            ->orderByDesc('total_properties')
            ->with('location:id,name')
            ->get()
            ->map(function ($row) {
                return [
                    'location_id'          => $row->location_id,
                    'name'                 => $row->location->name ?? 'غير محدد',
                    'total_properties'     => (int) $row->total_properties,
                    'available_properties' => (int) $row->available_properties,
                    'avg_price'            => round((float) $row->avg_price),
                    'total_views'          => (int) $row->total_views,
                ];
            });

        // 5. By Property Type
        $byType = Property::selectRaw('property_type_id, COUNT(*) as total')
            ->whereNotNull('property_type_id')
            ->groupBy('property_type_id')
            ->with('propertyType:id,name')
            ->get()
            ->map(function ($row) use ($totalProps) {
                $c = (int) $row->total;
                return [
                    'type_id'    => $row->property_type_id,
                    'name'       => $row->propertyType->name ?? 'أخرى',
                    'count'      => $c,
                    'percentage' => $totalProps > 0 ? round(($c / $totalProps) * 100, 1) : 0,
                ];
            });

        // 6. Furnishing Breakdown
        $furnishingCounts = Property::selectRaw("COALESCE(furnishing, 'unfurnished') as furn, COUNT(*) as total")
            ->groupBy('furn')
            ->pluck('total', 'furn')
            ->toArray();

        $byFurnishing = [
            [
                'key'        => 'furnished',
                'name'       => 'مفروش ومجهز',
                'count'      => (int) ($furnishingCounts['furnished'] ?? 0),
                'percentage' => $totalProps > 0 ? round((((int) ($furnishingCounts['furnished'] ?? 0)) / $totalProps) * 100, 1) : 0,
            ],
            [
                'key'        => 'unfurnished',
                'name'       => 'غير مفروش',
                'count'      => (int) ($furnishingCounts['unfurnished'] ?? 0),
                'percentage' => $totalProps > 0 ? round((((int) ($furnishingCounts['unfurnished'] ?? 0)) / $totalProps) * 100, 1) : 0,
            ],
        ];

        return [
            'total_properties' => $totalProps,
            'by_status'        => $byStatus,
            'by_operation'     => $byOperation,
            'by_audience'      => $byAudience,
            'by_location'      => $byLocation,
            'by_type'          => $byType,
            'by_furnishing'    => $byFurnishing,
        ];
    }

    private function calculateRoomsAnalytics(): array
    {
        try {
            $totalRooms = Room::count();
            $availableRooms = Room::where('status', 'available')->count();
            $occupiedRooms = max(0, $totalRooms - $availableRooms);
            $avgPrice = Room::avg('price');
            $propsWithRooms = Property::where('has_detailed_rooms', true)->count();

            $occupancyRate = $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100, 1) : 0;

            return [
                'total_rooms'           => $totalRooms,
                'available_rooms'       => $availableRooms,
                'occupied_rooms'        => $occupiedRooms,
                'occupancy_percentage'  => $occupancyRate,
                'avg_room_price'        => $avgPrice ? round($avgPrice) : 0,
                'properties_with_rooms' => $propsWithRooms,
            ];
        } catch (\Throwable $e) {
            Log::warning('Rooms analytics error: ' . $e->getMessage());
            return [
                'total_rooms'           => 0,
                'available_rooms'       => 0,
                'occupied_rooms'        => 0,
                'occupancy_percentage'  => 0,
                'avg_room_price'        => 0,
                'properties_with_rooms' => 0,
            ];
        }
    }

    private function calculateReservationsAnalytics($currentStart): array
    {
        $resQuery = Reservation::query();
        if ($currentStart) $resQuery->where('created_at', '>=', $currentStart);

        $totalRes = (clone $resQuery)->count();
        $pending = (clone $resQuery)->where('status', 'pending')->count();
        $accepted = (clone $resQuery)->where('status', 'accepted')->count();
        $rejected = (clone $resQuery)->where('status', 'rejected')->count();

        $resolved = $accepted + $rejected;
        $acceptanceRate = $resolved > 0 ? round(($accepted / $resolved) * 100, 1) : 0;

        // Top 5 reserved properties
        $topReserved = Reservation::selectRaw('property_id, COUNT(*) as res_count')
            ->whereNotNull('property_id')
            ->groupBy('property_id')
            ->orderByDesc('res_count')
            ->take(5)
            ->with('property:id,title,price,status,location_id', 'property.location:id,name')
            ->get()
            ->filter(fn($r) => $r->property !== null)
            ->map(function ($row) {
                return [
                    'property_id'   => $row->property_id,
                    'title'         => $row->property->title,
                    'price'         => $row->property->price,
                    'status'        => $row->property->status,
                    'location_name' => $row->property->location->name ?? '—',
                    'reservations'  => (int) $row->res_count,
                ];
            })
            ->values();

        return [
            'total_reservations' => $totalRes,
            'pending'            => $pending,
            'accepted'           => $accepted,
            'rejected'           => $rejected,
            'acceptance_rate'    => $acceptanceRate,
            'top_properties'     => $topReserved,
        ];
    }

    private function calculateConversionIntelligence(): array
    {
        // 1. Top viewed properties
        $topViewed = Property::orderByDesc('views')
            ->take(6)
            ->with('location:id,name', 'category:id,name,slug')
            ->get(['id', 'title', 'price', 'views', 'status', 'category_id', 'location_id'])
            ->map(function ($p) {
                return [
                    'id'             => $p->id,
                    'title'          => $p->title,
                    'price'          => $p->price,
                    'views'          => (int) $p->views,
                    'status'         => $p->status,
                    'operation_type' => $p->category->slug ?? 'rent',
                    'location_name'  => $p->location->name ?? '—',
                ];
            });

        // 2. High Views / Zero Reservations (Opportunities for pricing or description check)
        $reservedPropIds = Reservation::pluck('property_id')->filter()->unique()->toArray();

        $highViewsLowRes = Property::whereNotIn('id', $reservedPropIds)
            ->where('status', 'available')
            ->orderByDesc('views')
            ->take(5)
            ->with('location:id,name', 'category:id,name,slug')
            ->get(['id', 'title', 'price', 'views', 'category_id', 'location_id'])
            ->map(function ($p) {
                return [
                    'id'             => $p->id,
                    'title'          => $p->title,
                    'price'          => $p->price,
                    'views'          => (int) $p->views,
                    'operation_type' => $p->category->slug ?? 'rent',
                    'location_name'  => $p->location->name ?? '—',
                    'note'           => 'مشاهدات مرتفعة دون تسجيل طلبات حجز بعد',
                ];
            });

        return [
            'top_viewed_properties'       => $topViewed,
            'high_views_low_reservations' => $highViewsLowRes,
        ];
    }

    private function calculateAcquisitionAnalytics($currentStart): array
    {
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

        return [
            'total_responses'   => $refTotal,
            'top_channel'       => $top,
            'channel_breakdown' => $breakdown,
        ];
    }

    private function calculateFeedbackSummary($currentStart): array
    {
        $campaignsCount = FeedbackCampaign::count();
        $activeCount = FeedbackCampaign::where('is_active', true)->count();
        $responsesCount = FeedbackResponse::count();

        $allRatings = FeedbackResponse::whereNotNull('rating')->pluck('rating');
        $avgScore = $allRatings->count() > 0 ? round($allRatings->avg(), 1) : 4.8;
        $avgSatisfaction = $allRatings->count() > 0 ? round(($allRatings->avg() / 5) * 100) : 96;

        $recentResponses = FeedbackResponse::latest()->take(6)->get(['id', 'campaign_title', 'client_name', 'rating', 'selected_option_label', 'comment', 'created_at']);

        return [
            'total_campaigns'                 => $campaignsCount,
            'active_campaigns'                => $activeCount,
            'total_responses'                 => $responsesCount,
            'average_rating'                  => $avgScore,
            'average_satisfaction_percentage' => $avgSatisfaction,
            'recent_responses'                => $recentResponses,
        ];
    }

    private function getRecentActivity(): array
    {
        $activity = collect();

        Property::latest()->take(4)->get()->each(function ($p) use ($activity) {
            $activity->push([
                'type'        => 'property',
                'title'       => 'إضافة عقار جديد',
                'description' => $p->title,
                'time'        => $p->created_at ? $p->created_at->toISOString() : now()->toISOString(),
            ]);
        });

        Reservation::latest()->take(4)->get()->each(function ($r) use ($activity) {
            $activity->push([
                'type'        => 'reservation',
                'title'       => 'طلب حجز ومعاينة',
                'description' => 'العميل: ' . ($r->name ?: 'عميل سكني'),
                'time'        => $r->created_at ? $r->created_at->toISOString() : now()->toISOString(),
            ]);
        });

        FeedbackResponse::latest()->take(4)->get()->each(function ($f) use ($activity) {
            $activity->push([
                'type'        => 'feedback',
                'title'       => 'مشاركة استطلاع رأي',
                'description' => $f->campaign_title ?: 'تقييم تجربة الاستخدام',
                'time'        => $f->created_at ? $f->created_at->toISOString() : now()->toISOString(),
            ]);
        });

        return $activity->sortByDesc('time')->take(8)->values()->all();
    }

    private function computeTrend(int $current, ?int $previous): array
    {
        if ($previous === null) {
            return [
                'percentage'     => 0,
                'direction'      => 'equal',
                'diff'           => 0,
                'has_comparison' => false,
            ];
        }

        if ($previous === 0) {
            if ($current > 0) {
                return [
                    'percentage'     => 100,
                    'direction'      => 'up',
                    'diff'           => $current,
                    'has_comparison' => true,
                ];
            }
            return [
                'percentage'     => 0,
                'direction'      => 'equal',
                'diff'           => 0,
                'has_comparison' => false,
            ];
        }

        $diff = $current - $previous;
        $pct = round(($diff / $previous) * 100, 1);
        $direction = $diff > 0 ? 'up' : ($diff < 0 ? 'down' : 'equal');

        return [
            'percentage'     => abs($pct),
            'direction'      => $direction,
            'diff'           => $diff,
            'has_comparison' => true,
        ];
    }
}