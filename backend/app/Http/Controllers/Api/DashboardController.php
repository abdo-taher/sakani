<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Location;
use App\Models\Property;
use App\Models\Reservation;
use Illuminate\Support\Facades\DB;
use Exception;

class DashboardController extends Controller
{
    public function index()
    {
        try {
            $counts = [
                'properties'   => Property::count(),
                'locations'    => Location::count(),
                'categories'   => Category::count(),
                'reservations' => Reservation::count(),
            ];

            $recentProperties   = Property::latest()->take(5)->get();
            $recentReservations = Reservation::latest()->take(5)->get();

            $months = collect(range(5, 0))->map(function ($i) {
                return now()->subMonths($i)->format('Y-m');
            })->values();

            $propertiesMonthly = Property::selectRaw("strftime('%Y-%m', created_at) as month, COUNT(*) as total")
                ->where('created_at', '>=', now()->subMonths(5)->startOfMonth())
                ->groupBy('month')
                ->pluck('total', 'month');

            $reservationsMonthly = Reservation::selectRaw("strftime('%Y-%m', created_at) as month, COUNT(*) as total")
                ->where('created_at', '>=', now()->subMonths(5)->startOfMonth())
                ->groupBy('month')
                ->pluck('total', 'month');

            $monthlyStats = $months->map(function ($month) use ($propertiesMonthly, $reservationsMonthly) {
                return [
                    'month'        => $month,
                    'properties'   => $propertiesMonthly[$month] ?? 0,
                    'reservations' => $reservationsMonthly[$month] ?? 0,
                ];
            });

            $categoryDistribution = Property::selectRaw('category_id, COUNT(*) as total')
                ->groupBy('category_id')
                ->get()
                ->map(function ($row) {
                    $cat = Category::find($row->category_id);
                    return [
                        'name'  => $cat->name ?? 'غير محدد',
                        'value' => $row->total,
                    ];
                });

            return response()->json([
                'counts'                => $counts,
                'recent_properties'     => $recentProperties,
                'recent_reservations'   => $recentReservations,
                'monthly_stats'         => $monthlyStats,
                'category_distribution' => $categoryDistribution,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'counts'                => ['properties' => 0, 'locations' => 0, 'categories' => 0, 'reservations' => 0],
                'recent_properties'     => [],
                'recent_reservations'   => [],
                'monthly_stats'         => [],
                'category_distribution' => [],
                'error'                 => $e->getMessage(),
            ], 200);
        }
    }
}
