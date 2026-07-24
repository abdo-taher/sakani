import React, { useEffect, useState } from "react";
import usePageTitle from "../../hooks/usePageTitle";

import {
  Building2,
  ClipboardList,
  FolderTree,
  MapPinned,
  Users,
  CalendarDays,
  Globe,
  BarChart3,
} from "lucide-react";

import StatCard from "../../components/dashboard/StatCard";
import RecentProperties from "../../components/dashboard/RecentProperties";
import RecentReservations from "../../components/dashboard/RecentReservations";
import Charts from "../../components/dashboard/Charts";

import { COFFEE } from "../../constants/constants";
import { getDashboardData } from "../../services/dashboardService";

function AdminDashboard() {
  usePageTitle("لوحة التحكم — سكني");
  const [counts, setCounts] = useState({
    properties: 0,
    reservations: 0,
    categories: 0,
    locations: 0,
  });

  const [recentProperties, setRecentProperties] = useState([]);
  const [recentReservations, setRecentReservations] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [visitorStats, setVisitorStats] = useState({ today: 0, month: 0, all_time: 0, total_visits: 0 });
  const [dailyVisitors, setDailyVisitors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDashboardData();

        setCounts(data.counts);
        setRecentProperties(data.recent_properties || []);
        setRecentReservations(data.recent_reservations || []);
        setMonthlyStats(data.monthly_stats || []);
        setCategoryDistribution(data.category_distribution || []);
        setVisitorStats(data.visitor_stats || { today: 0, month: 0, all_time: 0, total_visits: 0 });
        setDailyVisitors(data.daily_visitors || {});
      } catch (error) {
        console.error("فشل تحميل بيانات لوحة التحكم:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  return (
    <div style={{ padding: "32px" }}>

      {/* عنوان الصفحة */}
      <div className="mb-8" style={{ paddingRight: "4px" }}>

        <h1
          className="text-4xl font-extrabold leading-relaxed"
          style={{ color: COFFEE.dark }}
        >
          مرحباً بك في لوحة التحكم 👋
        </h1>

        <p className="text-stone-500 mt-2">
          إليك ملخص سريع لحالة الموقع.
        </p>

      </div>

      {/* الإحصائيات الأساسية */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

        <StatCard
          title="عدد العقارات"
          value={loading ? "..." : counts.properties}
          icon={Building2}
        />

        <StatCard
          title="طلبات الحجز"
          value={loading ? "..." : counts.reservations}
          icon={ClipboardList}
        />

        <StatCard
          title="الأقسام"
          value={loading ? "..." : counts.categories}
          icon={FolderTree}
        />

        <StatCard
          title="الأماكن"
          value={loading ? "..." : counts.locations}
          icon={MapPinned}
        />

      </div>

      {/* إحصائيات الزوار */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

        <StatCard
          title="زوار اليوم (فريد)"
          value={loading ? "..." : visitorStats.today}
          icon={Users}
        />

        <StatCard
          title="زوار الشهر (فريد)"
          value={loading ? "..." : visitorStats.month}
          icon={CalendarDays}
        />

        <StatCard
          title="إجمالي الزيارات"
          value={loading ? "..." : visitorStats.total_visits}
          icon={Globe}
        />

        <StatCard
          title="الزوار الأصليون (كل الأوقات)"
          value={loading ? "..." : visitorStats.all_time}
          icon={BarChart3}
        />

      </div>

      {/* آخر البيانات */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">

        <RecentProperties properties={recentProperties} loading={loading} />

        <RecentReservations reservations={recentReservations} loading={loading} />

      </div>

      {/* الرسم البياني */}

      <Charts
        monthlyStats={monthlyStats}
        categoryDistribution={categoryDistribution}
        dailyVisitors={dailyVisitors}
        last7Days={last7Days}
        loading={loading}
      />

    </div>
  );
}

export default AdminDashboard;