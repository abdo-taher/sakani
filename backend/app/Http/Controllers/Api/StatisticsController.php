<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Location;
use App\Models\Property;
use App\Models\Reservation;

class StatisticsController extends Controller
{
    public function index()
    {
        $cards = [
            'properties'   => Property::count(),
            'reservations' => Reservation::count(),
            'locations'    => Location::count(),
            'categories'   => Category::count(),
            'available'    => Property::where('status', 'available')->count(),
            'sold'         => Property::where('status', 'sold')->count(),
            'rented'       => Property::where('status', 'rented')->count(),
        ];

        // توزيع العقارات حسب القسم (ديناميكي حسب الأقسام الموجودة فعلياً)
        $propertyDistribution = Property::selectRaw('category_id, COUNT(*) as total')
            ->groupBy('category_id')
            ->with('category:id,name')
            ->get()
            ->map(function ($row) {
                return [
                    'name'  => $row->category->name ?? 'غير محدد',
                    'value' => $row->total,
                ];
            });

        // حالة طلبات الحجز
        $statusLabels = [
            'pending'  => 'قيد الانتظار',
            'accepted' => 'مقبول',
            'rejected' => 'مرفوض',
        ];

        $reservationStatus = Reservation::selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->get()
            ->map(function ($row) use ($statusLabels) {
                return [
                    'name'  => $statusLabels[$row->status] ?? $row->status,
                    'value' => $row->total,
                ];
            });

        // آخر نشاط بالموقع (عقارات + حجوزات + أماكن + أقسام)
        $activity = collect();

        Property::latest()->take(5)->get()->each(function ($p) use ($activity) {
            $activity->push([
                'type'        => 'property',
                'title'       => 'تم إضافة عقار جديد',
                'description' => $p->title,
                'time'        => $p->created_at,
            ]);
        });

        Reservation::latest()->take(5)->get()->each(function ($r) use ($activity) {
            $activity->push([
                'type'        => 'reservation',
                'title'       => 'تم استلام طلب حجز جديد',
                'description' => 'العميل: ' . $r->name,
                'time'        => $r->created_at,
            ]);
        });

        Location::latest()->take(5)->get()->each(function ($l) use ($activity) {
            $activity->push([
                'type'        => 'location',
                'title'       => 'تم إضافة مكان جديد',
                'description' => $l->name,
                'time'        => $l->created_at,
            ]);
        });

        Category::latest()->take(5)->get()->each(function ($c) use ($activity) {
            $activity->push([
                'type'        => 'category',
                'title'       => 'تم إنشاء قسم جديد',
                'description' => $c->name,
                'time'        => $c->created_at,
            ]);
        });

        $recentActivity = $activity->sortByDesc('time')->take(8)->values();

        // الملخص والتحليل
        $mostActiveLocation = Property::selectRaw('location_id, COUNT(*) as total')
            ->groupBy('location_id')
            ->orderByDesc('total')
            ->with('location:id,name')
            ->first();

        $mostCommonCategory = Property::selectRaw('category_id, COUNT(*) as total')
            ->groupBy('category_id')
            ->orderByDesc('total')
            ->with('category:id,name')
            ->first();

        $avgSalePrice = Property::where('status', 'sold')->avg('price');
        $avgRentPrice = Property::where('status', 'rented')->avg('price');

        $totalProperties = Property::count();
$saleRatio = $totalProperties > 0
    ? round(($cards['sold'] / $totalProperties) * 100)
    : 0;

        $pendingReservations = Reservation::where('status', 'pending')->count();

        $summary = [
            'most_active_location' => $mostActiveLocation->location->name ?? '—',
            'most_common_category' => $mostCommonCategory->category->name ?? '—',
            'avg_sale_price'       => $avgSalePrice ? round($avgSalePrice) : 0,
            'avg_rent_price'       => $avgRentPrice ? round($avgRentPrice) : 0,
            'sale_ratio'           => $saleRatio,
            'pending_reservations' => $pendingReservations,
        ];

        return response()->json([
            'cards'                  => $cards,
            'property_distribution'  => $propertyDistribution,
            'reservation_status'     => $reservationStatus,
            'recent_activity'        => $recentActivity,
            'summary'                => $summary,
        ]);
    }

    public function publicStats()
    {
        $availableProperties = Property::where('status', 'available')->where('is_uploading', false)->count();
        $locationsCount = Location::count();
        $reservationsCount = Reservation::count();
        $roomsCount = \Illuminate\Support\Facades\DB::table('rooms')->where('status', 'available')->count();
        $totalViews = Property::sum('views');

        return response()->json([
            'success' => true,
            'data' => [
                'available_properties' => $availableProperties,
                'locations_count' => $locationsCount,
                'reservations_count' => $reservationsCount,
                'available_rooms' => $roomsCount,
                'total_views' => $totalViews,
                'satisfaction_rate' => 98,
                'commission_rate' => '2.5%',
            ]
        ]);
    }
}