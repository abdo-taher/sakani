<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Location;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\VisitorLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Exception;

class DashboardController extends Controller
{
    public function index()
    {
        $counts = ['properties' => 0, 'locations' => 0, 'categories' => 0, 'reservations' => 0, 'total_views' => 0];
        $recentProperties = [];
        $recentReservations = [];
        $monthlyStats = collect();
        $categoryDistribution = collect();
        $visitorStats = ['today' => 0, 'month' => 0, 'all_time' => 0, 'total_visits' => 0];
        $dailyVisitors = collect();

        try {
            $counts['properties'] = Property::count();
        } catch (Exception $e) { Log::warning('Dashboard count properties: ' . $e->getMessage()); }

        try {
            $counts['locations'] = Location::count();
        } catch (Exception $e) { Log::warning('Dashboard count locations: ' . $e->getMessage()); }

        try {
            $counts['categories'] = Category::count();
        } catch (Exception $e) { Log::warning('Dashboard count categories: ' . $e->getMessage()); }

        try {
            $counts['reservations'] = Reservation::count();
        } catch (Exception $e) { Log::warning('Dashboard count reservations: ' . $e->getMessage()); }

        try {
            $counts['total_views'] = (int) Property::sum('views');
        } catch (Exception $e) { Log::warning('Dashboard sum views: ' . $e->getMessage()); }

        try {
            $recentProperties = Property::latest()->take(5)->get();
        } catch (Exception $e) { Log::warning('Dashboard recent properties: ' . $e->getMessage()); }

        try {
            $recentReservations = Reservation::latest()->take(5)->get();
        } catch (Exception $e) { Log::warning('Dashboard recent reservations: ' . $e->getMessage()); }

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
                    'properties'   => $propertiesMonthly[$month] ?? 0,
                    'reservations' => $reservationsMonthly[$month] ?? 0,
                ];
            });
        } catch (Exception $e) { Log::warning('Dashboard monthly stats: ' . $e->getMessage()); }

        try {
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
        } catch (Exception $e) { Log::warning('Dashboard category distribution: ' . $e->getMessage()); }

        try {
            $today     = now()->startOfDay();
            $monthStart = now()->startOfMonth();

            $visitorStats = [
                'today'     => VisitorLog::where('created_at', '>=', $today)->distinct('ip')->count(),
                'month'     => VisitorLog::where('created_at', '>=', $monthStart)->distinct('ip')->count(),
                'all_time'  => VisitorLog::distinct('ip')->count(),
                'total_visits' => VisitorLog::count(),
            ];

            $dailyVisitors = VisitorLog::selectRaw("DATE(created_at) as date, COUNT(DISTINCT ip) as unique_visits, COUNT(*) as total_visits")
                ->where('created_at', '>=', now()->subDays(6)->startOfDay())
                ->groupBy('date')
                ->pluck('unique_visits', 'date')
                ->mapWithKeys(fn ($val, $key) => [$key => (int) $val]);
        } catch (Exception $e) { Log::warning('Dashboard visitor stats: ' . $e->getMessage()); }

        return response()->json([
            'counts'                => $counts,
            'recent_properties'     => $recentProperties,
            'recent_reservations'   => $recentReservations,
            'monthly_stats'         => $monthlyStats,
            'category_distribution' => $categoryDistribution,
            'visitor_stats'         => $visitorStats,
            'daily_visitors'        => $dailyVisitors,
        ]);
    }
}
