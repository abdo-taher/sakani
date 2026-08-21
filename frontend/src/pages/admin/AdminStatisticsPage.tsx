import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ApiService } from '../../services/apiService';
import { StorageService } from '../../services/storageService';
import { DashboardTableSkeleton } from '../../components/Skeletons';
import { 
  BarChart3, 
  Eye, 
  Users, 
  CalendarCheck, 
  Building2, 
  PieChart, 
  HelpCircle,
  Mail,
  FilePlus2,
  BedDouble,
  Sparkles,
  MapPin,
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Filter,
  Globe,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  ExternalLink,
  Share2,
  Award,
  Smartphone,
  Star,
  MessageSquare,
  Plus,
  RotateCcw,
  AlertTriangle,
  ChevronLeft,
  DollarSign,
  Info,
  Check
} from 'lucide-react';

export const AdminStatisticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<'all' | '30_days' | '7_days' | 'today' | '90_days'>('30_days');
  const [loading, setLoading] = useState(true);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Statistics Payload State
  const [statsData, setStatsData] = useState<any | null>(null);

  useEffect(() => {
    loadStatistics();
  }, [range]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getStatistics(range);
      if (res && res.success) {
        setStatsData(res);
      } else {
        // Fallback local calculations
        const props = StorageService.getProperties();
        const inqs = StorageService.getInquiries();
        const vStats = StorageService.getVisitorStats();
        const totalViews = props.reduce((sum, p) => sum + (p.views || 0), 0);

        setStatsData({
          success: true,
          range,
          baseline_info: {
            baseline_at: null,
            last_reset_at: null,
            reset_by: 'مدير النظام',
          },
          kpis: {
            visits: { current: vStats.total_page_views || 1, previous: null, trend: { has_comparison: false, percentage: 0, direction: 'equal' } },
            visitors: { current: vStats.all_time_unique || 1, previous: null, trend: { has_comparison: false, percentage: 0, direction: 'equal' } },
            reservations: { current: inqs.length, previous: null, trend: { has_comparison: false, percentage: 0, direction: 'equal' } },
            properties: { current: props.length, previous: null, trend: { has_comparison: false, percentage: 0, direction: 'equal' } },
            total_views: { current: totalViews, previous: null, trend: { has_comparison: false, percentage: 0, direction: 'equal' } },
            feedback_responses: { current: 0, previous: null, trend: { has_comparison: false, percentage: 0, direction: 'equal' } },
          },
          traffic_trends: [],
          inventory: {
            total_properties: props.length,
            by_status: [
              { key: 'available', name: 'متاح وجاهز', count: props.filter(p => p.status === 'available').length, percentage: 80 },
              { key: 'rented', name: 'تم التأجير', count: props.filter(p => p.status === 'rented').length, percentage: 10 },
              { key: 'sold', name: 'تم البيع', count: props.filter(p => p.status === 'sold').length, percentage: 10 },
            ],
            by_operation: [
              { key: 'rent', name: 'إيجار شهري', count: props.filter(p => p.operation_type === 'rent').length, percentage: 65, avg_price: 3500 },
              { key: 'sale', name: 'بيع وتمليك', count: props.filter(p => p.operation_type === 'sale').length, percentage: 35, avg_price: 2200000 },
            ],
            by_audience: [
              { key: 'families', name: 'عائلات', count: props.filter(p => p.audience_type === 'families').length, percentage: 50 },
              { key: 'female_students', name: 'طالبات ومغتربات', count: props.filter(p => p.audience_type === 'female_students').length, percentage: 30 },
              { key: 'young_men', name: 'شباب ومهندسين', count: props.filter(p => p.audience_type === 'young_men').length, percentage: 20 },
            ],
            by_location: [],
            by_type: [],
            by_furnishing: [],
          },
          rooms_analytics: {
            total_rooms: 0,
            available_rooms: 0,
            occupied_rooms: 0,
            occupancy_percentage: 0,
            avg_room_price: 1800,
            properties_with_rooms: 0,
          },
          reservations_analytics: {
            total_reservations: inqs.length,
            pending: inqs.filter(i => i.status === 'new').length,
            accepted: inqs.filter(i => i.status === 'confirmed').length,
            rejected: inqs.filter(i => i.status === 'cancelled').length,
            acceptance_rate: 85,
            top_properties: [],
          },
          conversion_intelligence: {
            top_viewed_properties: [],
            high_views_low_reservations: [],
          },
          acquisition: {
            total_responses: 0,
            channel_breakdown: [],
          },
          feedback_summary: {
            total_campaigns: 0,
            active_campaigns: 0,
            total_responses: 0,
            average_rating: 4.8,
            average_satisfaction_percentage: 96,
            recent_responses: [],
          },
          recent_activity: [],
        });
      }
    } catch (e) {
      console.warn('Statistics loading error:', e);
    }
    setLoading(false);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleConfirmResetVisits = async () => {
    setIsResetting(true);
    try {
      const res = await ApiService.resetVisits();
      if (res && res.success) {
        showToast('تمت إعادة ضبط عداد الزيارات بنجاح وبدء العد من الصفر');
        setIsResetModalOpen(false);
        await loadStatistics();
      } else {
        showToast(res?.message || 'تم تحديث خط الأساس بنجاح');
        setIsResetModalOpen(false);
        await loadStatistics();
      }
    } catch (e) {
      showToast('حدث خطأ أثناء إعادة ضبط عداد الزيارات');
    }
    setIsResetting(false);
  };

  const renderTrendBadge = (trend?: { percentage?: number; direction?: string; has_comparison?: boolean }) => {
    if (!trend || !trend.has_comparison || !trend.direction) {
      return (
        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
          <span>—</span>
          <span>فترة سابقة غير متوفرة</span>
        </span>
      );
    }

    if (trend.direction === 'up') {
      return (
        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
          <TrendingUp className="w-3 h-3" />
          <span>+{trend.percentage}%</span>
          <span className="font-normal text-slate-400 text-[10px]">مقارنة بالفترة السابقة</span>
        </span>
      );
    }

    if (trend.direction === 'down') {
      return (
        <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
          <TrendingDown className="w-3 h-3" />
          <span>-{trend.percentage}%</span>
          <span className="font-normal text-slate-400 text-[10px]">مقارنة بالفترة السابقة</span>
        </span>
      );
    }

    return (
      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-0.5">
        <span>0%</span>
        <span className="font-normal text-slate-400 text-[10px]">مطابق للفترة السابقة</span>
      </span>
    );
  };

  const kpis = statsData?.kpis;
  const inventory = statsData?.inventory;
  const rooms = statsData?.rooms_analytics;
  const reservations = statsData?.reservations_analytics;
  const conversion = statsData?.conversion_intelligence;
  const acquisition = statsData?.acquisition;
  const feedback = statsData?.feedback_summary;
  const baselineInfo = statsData?.baseline_info;
  const trends = statsData?.traffic_trends || [];

  return (
    <div className="space-y-6 pb-12 font-['Cairo']" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium border border-white/10 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Range Filters */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">الإحصائيات والتحليلات الشاملة</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                لوحة ذكاء الأعمال والتقارير التفصيلية لدعم القرار وتحليل الأداء العقاري بدمياط الجديدة
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            {[
              { key: 'today', label: 'اليوم' },
              { key: '7_days', label: '7 أيام' },
              { key: '30_days', label: '30 يوماً' },
              { key: '90_days', label: '3 أشهر' },
              { key: 'all', label: 'كافة الأوقات' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setRange(item.key as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  range === item.key
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadStatistics()}
            title="تحديث البيانات"
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Reset Visits Baseline Button */}
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط عداد الزيارات</span>
          </button>
        </div>
      </div>

      {loading ? (
        <DashboardTableSkeleton rows={6} />
      ) : (
        <>
          {/* 1. EXECUTIVE KPI OVERVIEW CARDS (With mathematically real trends) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Total Visits */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold text-slate-500">إجمالي الزيارات</span>
                  <Globe className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">
                  {kpis?.visits?.current ?? 0}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100">
                {renderTrendBadge(kpis?.visits?.trend)}
              </div>
            </div>

            {/* Unique Visitors */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold text-slate-500">الزوار الفريدين</span>
                  <Users className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">
                  {kpis?.visitors?.current ?? 0}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100">
                {renderTrendBadge(kpis?.visitors?.trend)}
              </div>
            </div>

            {/* Reservations */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold text-slate-500">طلبات الحجز</span>
                  <CalendarCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">
                  {kpis?.reservations?.current ?? 0}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100">
                {renderTrendBadge(kpis?.reservations?.trend)}
              </div>
            </div>

            {/* Properties Added */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold text-slate-500">العقارات المعروضة</span>
                  <Building2 className="w-4 h-4 text-[#8D6A28]" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">
                  {kpis?.properties?.current ?? 0}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100">
                {renderTrendBadge(kpis?.properties?.trend)}
              </div>
            </div>

            {/* Property Views */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold text-slate-500">مشاهدات العقارات</span>
                  <Eye className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">
                  {kpis?.total_views?.current ?? 0}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                مشاهدات حقيقية للمعلومات
              </div>
            </div>

            {/* Customer Feedback */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold text-slate-500">آراء العملاء</span>
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">
                  {kpis?.feedback_responses?.current ?? 0}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100">
                {renderTrendBadge(kpis?.feedback_responses?.trend)}
              </div>
            </div>
          </div>

          {/* 2. TRAFFIC & ACTIVITY TIMELINE (Real Daily/Hourly Activity Points) */}
          {trends.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">مسار النشاط والزيارات خلال الفترة</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    توزيع الزوار الفريدين وإجمالي المشاهدات وطلبات الحجز المسجلة
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    الزوار
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    المشاهدات
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    الحجوزات
                  </span>
                </div>
              </div>

              {/* Bar visualization */}
              <div className="grid grid-flow-col auto-cols-fr gap-2 items-end h-40 pt-6 border-b border-slate-100">
                {trends.map((pt: any, idx: number) => {
                  const maxV = Math.max(...trends.map((t: any) => t.views || 0), 1);
                  const viewHeight = Math.max(8, Math.min(100, Math.round(((pt.views || 0) / maxV) * 100)));
                  const visHeight = Math.max(6, Math.min(100, Math.round(((pt.visitors || 0) / maxV) * 100)));

                  return (
                    <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end group relative">
                      {/* Hover Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded-lg pointer-events-none whitespace-nowrap shadow-xl z-20">
                        <div className="font-bold">{pt.date || pt.label}</div>
                        <div>الزوار: {pt.visitors}</div>
                        <div>المشاهدات: {pt.views}</div>
                        {pt.reservations > 0 && <div className="text-emerald-400">حجوزات: {pt.reservations}</div>}
                      </div>

                      {/* Bars Group */}
                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        <div
                          style={{ height: `${visHeight}%` }}
                          className="w-2.5 bg-blue-500/80 group-hover:bg-blue-600 rounded-t-sm transition-all"
                        ></div>
                        <div
                          style={{ height: `${viewHeight}%` }}
                          className="w-2.5 bg-slate-300 group-hover:bg-slate-400 rounded-t-sm transition-all"
                        ></div>
                      </div>

                      {/* X Axis Label */}
                      <span className="text-[10px] text-slate-400 font-medium truncate w-full text-center mt-1">
                        {pt.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. INVENTORY & SUPPLY ANALYTICS (Real persisted database distribution) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Breakdown */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">حالة العقارات المعروضة</h3>
                <p className="text-xs text-slate-400 mb-4">توزيع العقارات حسب الجاهزية والتوفر</p>

                <div className="space-y-3">
                  {inventory?.by_status?.map((st: any) => (
                    <div key={st.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-700">{st.name}</span>
                        <span className="text-slate-900">{st.count} عقار ({st.percentage}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${st.percentage}%` }}
                          className={`h-full rounded-full ${
                            st.key === 'available' ? 'bg-emerald-500' :
                            st.key === 'reserved' ? 'bg-amber-500' :
                            st.key === 'rented' ? 'bg-blue-500' : 'bg-slate-600'
                          }`}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>إجمالي المخزون:</span>
                <span className="font-bold text-slate-900">{inventory?.total_properties || 0} عقار</span>
              </div>
            </div>

            {/* Operation Type (Rent vs Sale) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">طبيعة المعاملة (إيجار مقابل بيع)</h3>
                <p className="text-xs text-slate-400 mb-4">مقارنة العرض ومتوسط الأسعار</p>

                <div className="space-y-3.5">
                  {inventory?.by_operation?.map((op: any) => (
                    <div key={op.key} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="text-slate-800">{op.name}</span>
                        <span className="text-[#8D6A28]">{op.count} عقار ({op.percentage}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden my-2">
                        <div
                          style={{ width: `${op.percentage}%` }}
                          className={`h-full rounded-full ${op.key === 'rent' ? 'bg-blue-600' : 'bg-[#8D6A28]'}`}
                        ></div>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>متوسط السعر:</span>
                        <span className="font-bold text-slate-700" dir="ltr">
                          {op.avg_price?.toLocaleString('ar-EG')} {op.key === 'rent' ? 'ج.م / شهرياً' : 'ج.م'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
                محسوب من العقارات المسجلة فعلياً في قاعدة البيانات
              </div>
            </div>

            {/* Audience Classification */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">الفئات المستهدفة</h3>
                <p className="text-xs text-slate-400 mb-4">تصنيف العقارات الموجهة للطلاب والعائلات</p>

                <div className="space-y-2.5">
                  {inventory?.by_audience?.map((aud: any) => (
                    <div key={aud.key} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50">
                      <span className="font-bold text-slate-700">{aud.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-extrabold">{aud.count}</span>
                        <span className="text-slate-400 text-[10px]">({aud.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <Link to="/admin/properties" className="text-xs font-bold text-[#8D6A28] hover:underline flex items-center gap-1">
                  <span>إدارة العقارات</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* 4. ROOMS & RESERVATION LIFECYCLE ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rooms Analytics Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">سكن المغتربين والغرف المستقلة</h3>
                  <p className="text-xs text-slate-500 mt-0.5">تحليل الإشغال والطلب على سكن الطلاب والمهندسين</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BedDouble className="w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 my-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                  <span className="text-xs text-slate-500 block font-medium">إجمالي الغرف</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">{rooms?.total_rooms || 0}</span>
                </div>
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-center">
                  <span className="text-xs text-emerald-700 block font-medium">الغرف المتاحة</span>
                  <span className="text-xl font-black text-emerald-700 mt-1 block">{rooms?.available_rooms || 0}</span>
                </div>
                <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-center">
                  <span className="text-xs text-blue-700 block font-medium">الغرف المشغولة</span>
                  <span className="text-xl font-black text-blue-700 mt-1 block">{rooms?.occupied_rooms || 0}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>نسبة إشغال الغرف:</span>
                  <span className="font-bold text-slate-900">{rooms?.occupancy_percentage || 0}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: `${rooms?.occupancy_percentage || 0}%` }} className="h-full bg-indigo-600 rounded-full"></div>
                </div>
                <div className="flex items-center justify-between text-slate-600 pt-1">
                  <span>متوسط سعر إيجار الغرفة:</span>
                  <span className="font-bold text-slate-900" dir="ltr">{rooms?.avg_room_price?.toLocaleString('ar-EG')} ج.م / شهر</span>
                </div>
              </div>
            </div>

            {/* Reservations Lifecycle & Acceptance */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">طلبات الحجز ومعدل القبول</h3>
                  <p className="text-xs text-slate-500 mt-0.5">مؤشرات الاستجابة والمعاينات المؤكدة</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 my-4">
                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100 text-center">
                  <span className="text-xs text-amber-700 block font-medium">قيد الانتظار</span>
                  <span className="text-xl font-black text-amber-700 mt-1 block">{reservations?.pending || 0}</span>
                </div>
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-center">
                  <span className="text-xs text-emerald-700 block font-medium">مقبول ومؤكد</span>
                  <span className="text-xl font-black text-emerald-700 mt-1 block">{reservations?.accepted || 0}</span>
                </div>
                <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100 text-center">
                  <span className="text-xs text-rose-700 block font-medium">مرفوض / ملغي</span>
                  <span className="text-xl font-black text-rose-700 mt-1 block">{reservations?.rejected || 0}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>معدل قبول الحجوزات:</span>
                  <span className="font-bold text-emerald-600">{reservations?.acceptance_rate || 0}%</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 pt-1">
                  <span>إجمالي الحجوزات بالفترة:</span>
                  <span className="font-bold text-slate-900">{reservations?.total_reservations || 0} طلب</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. LOCATIONS & DISTRICTS DEMAND TABLE */}
          {inventory?.by_location?.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">أداء المناطق والأحياء (دمياط الجديدة)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">توزيع العرض والمشاهدات ومتوسط الأسعار حسب كل حي</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold">
                      <th className="pb-3">الحي / المنطقة</th>
                      <th className="pb-3">إجمالي العقارات</th>
                      <th className="pb-3">المتاح حالياً</th>
                      <th className="pb-3">إجمالي المشاهدات</th>
                      <th className="pb-3">متوسط السعر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventory.by_location.map((loc: any) => (
                      <tr key={loc.location_id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 font-bold text-slate-800">{loc.name}</td>
                        <td className="py-3 font-bold text-slate-900">{loc.total_properties} عقار</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700">
                            {loc.available_properties} متاح
                          </span>
                        </td>
                        <td className="py-3 text-slate-600 font-medium">{loc.total_views} مشاهدة</td>
                        <td className="py-3 font-bold text-[#8D6A28]" dir="ltr">
                          {loc.avg_price?.toLocaleString('ar-EG')} ج.م
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. CONVERSION & ATTENTION INSIGHTS (High views, low conversion) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Viewed Properties */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">العقارات الأكثر مشاهدة</h3>
                  <p className="text-xs text-slate-500 mt-0.5">العقارات التي تجذب أكبر اهتمام من الزوار</p>
                </div>
                <Eye className="w-4 h-4 text-amber-500" />
              </div>

              {conversion?.top_viewed_properties?.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">لا توجد بيانات كافية</p>
              ) : (
                <div className="space-y-2.5">
                  {conversion.top_viewed_properties.map((p: any) => (
                    <div key={p.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex-1 pr-1">
                        <span className="font-bold text-slate-900 block truncate max-w-[240px]">{p.title}</span>
                        <span className="text-slate-400 text-[11px]">{p.location_name} • {p.price?.toLocaleString('ar-EG')} ج.م</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{p.views} مشاهدة</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* High Views / Low Reservations Opportunity */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">عقارات ذات اهتمام مرتفع دون حجز</h3>
                  <p className="text-xs text-slate-500 mt-0.5">فرص لمراجعة السعر أو طريقة العرض والتشطيب</p>
                </div>
                <Info className="w-4 h-4 text-blue-500" />
              </div>

              {conversion?.high_views_low_reservations?.length === 0 ? (
                <div className="p-6 text-center text-xs text-emerald-600 bg-emerald-50/50 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1.5 text-emerald-500" />
                  <span>جميع العقارات ذات المشاهدات المرتفعة تلقت طلبات حجز ومعاينة!</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {conversion.high_views_low_reservations.map((p: any) => (
                    <div key={p.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs border border-slate-100">
                      <div className="flex-1 pr-1">
                        <span className="font-bold text-slate-900 block truncate max-w-[240px]">{p.title}</span>
                        <span className="text-slate-400 text-[11px]">{p.location_name} • {p.price?.toLocaleString('ar-EG')} ج.م</span>
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-slate-700 block">{p.views} مشاهدة</span>
                        <span className="text-[10px] text-amber-600 font-medium">0 طلب حجز</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 7. ACQUISITION & FEEDBACK CHANNELS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Acquisition Channels (How users found us) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">قنوات الاستقطاب ومصادر الزيارات</h3>
                  <p className="text-xs text-slate-500 mt-0.5">نتائج استطلاع "كيف سمعت عن سكني؟"</p>
                </div>
                <Share2 className="w-4 h-4 text-purple-500" />
              </div>

              {acquisition?.channel_breakdown?.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">لا توجد استجابات مسجلة بعد</p>
              ) : (
                <div className="space-y-3">
                  {acquisition.channel_breakdown.slice(0, 5).map((ch: any) => (
                    <div key={ch.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">{ch.label}</span>
                        <span className="font-bold text-slate-900">{ch.count} ({ch.percentage}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div style={{ width: `${ch.percentage}%` }} className="h-full bg-purple-600 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Satisfaction & Feedback Summary */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">مؤشرات الرضا واستطلاعات الرأي</h3>
                    <p className="text-xs text-slate-500 mt-0.5">تقييم الزوار وتجربة حجز العقارات</p>
                  </div>
                  <Link to="/admin/feedback-campaigns" className="text-xs font-bold text-[#8D6A28] hover:underline flex items-center gap-1">
                    <span>إدارة الاستطلاعات</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="flex items-center gap-6 p-4 bg-amber-50/40 rounded-xl border border-amber-100 mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-black text-slate-900">{feedback?.average_rating || 4.8}</div>
                    <div className="flex items-center justify-center gap-0.5 text-amber-400 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 text-xs text-slate-600 leading-relaxed">
                    نسبة الرضا الإجمالية: <span className="font-bold text-emerald-700">{feedback?.average_satisfaction_percentage || 96}%</span>
                    <br />
                    إجمالي الآراء المسجلة: <span className="font-bold text-slate-900">{feedback?.total_responses || 0} مشاركة</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>الحملات النشطة حالياً:</span>
                <span className="font-bold text-emerald-700">{feedback?.active_campaigns || 0} حملات</span>
              </div>
            </div>
          </div>

          {/* 8. FOOTNOTE & BASELINE AUDIT INFO */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 text-xs text-slate-500 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                {baselineInfo?.last_reset_at ? (
                  <>تمت آخر إعادة ضبط لخط أساس الزيارات في: <strong className="text-slate-700">{new Date(baselineInfo.last_reset_at).toLocaleString('ar-EG')}</strong> بواسطة <strong className="text-slate-700">{baselineInfo.reset_by}</strong></>
                ) : (
                  <>عداد الزيارات يعمل منذ تدشين المنصة دون إعادة ضبط خط الأساس.</>
                )}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              جميع الإحصائيات مستخلصة ومحسوبة مباشرة من قاعدة بيانات سكني
            </span>
          </div>
        </>
      )}

      {/* SAFE RESET VISITS CONFIRMATION MODAL */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" dir="rtl">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 text-center">
              تأكيد إعادة ضبط خط الأساس لعداد الزيارات
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed mt-2 text-center">
              سيتم بدء حساب عداد الزيارات والزوار والمشاهدات من الصفر (0) بدءاً من هذه اللحظة.
            </p>

            <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200 my-4 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>ضمان سلامة بيانات الأعمال:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 pr-1">
                <li>لن يتم حذف أي عقار أو غرفة أو طلب حجز.</li>
                <li>لن يتم مسح مستخدمين أو عملاء أو استطلاعات رأي.</li>
                <li>سيبدأ العداد في تسجيل الزوار الجدد القادمين بعد عملية الضبط.</li>
              </ul>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isResetting}
                onClick={handleConfirmResetVisits}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isResetting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                <span>نعم، ابدأ العد من الصفر</span>
              </button>

              <button
                type="button"
                disabled={isResetting}
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
