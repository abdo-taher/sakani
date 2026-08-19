import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { Property } from '../../types';
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
  Activity,
  ArrowUpRight,
  ShieldCheck,
  ExternalLink,
  Share2,
  Award,
  Smartphone,
  Star,
  MessageSquare,
  Plus
} from 'lucide-react';
import { DashboardTableSkeleton } from '../../components/Skeletons';
import { AdminFeedbackCampaignModal } from '../../components/AdminFeedbackCampaignModal';
import { FeedbackCampaignStats } from '../../types';

export const AdminStatisticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'all' | '30_days' | '7_days' | 'today'>('all');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  
  const [statsData, setStatsData] = useState<{
    counts: Record<string, number>;
    audience_distribution: any[];
    category_distribution: any[];
    location_distribution: any[];
    top_viewed_properties: any[];
    monthly_stats: any[];
    visitor_stats: {
      today: number;
      month: number;
      all_time: number;
      total_visits: number;
      property_views?: number;
      daily_breakdown?: Array<{
        date: string;
        day_name: string;
        visitors: number;
        views: number;
      }>;
    };
    referral_stats?: {
      total_responses: number;
      top_channel?: { key: string; label: string; count: number; percentage: number } | null;
      channel_breakdown: Array<{ key: string; label: string; count: number; percentage: number }>;
      recent_feedbacks?: any[];
    };
    feedback_stats?: FeedbackCampaignStats;
  }>({
    counts: {},
    audience_distribution: [],
    category_distribution: [],
    location_distribution: [],
    top_viewed_properties: [],
    monthly_stats: [],
    visitor_stats: {
      today: 1,
      month: 1,
      all_time: 1,
      total_visits: 1,
    },
    referral_stats: {
      total_responses: 0,
      channel_breakdown: [],
      recent_feedbacks: [],
    },
    feedback_stats: undefined,
  });

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getDashboardData(dateRange);
      if (res && res.counts) {
        setStatsData({
          counts: res.counts || {},
          audience_distribution: res.audience_distribution || [],
          category_distribution: res.category_distribution || [],
          location_distribution: res.location_distribution || [],
          top_viewed_properties: res.top_viewed_properties || [],
          monthly_stats: res.monthly_stats || [],
          visitor_stats: res.visitor_stats || {
            today: 1,
            month: 1,
            all_time: 1,
            total_visits: 1,
          },
          referral_stats: res.referral_stats || StorageService.getReferralStats(),
          feedback_stats: StorageService.getFeedbackStats(),
        });
      } else {
        // Fallback compute from local storage
        const props = StorageService.getProperties();
        const inqs = StorageService.getInquiries();
        const needs = StorageService.getNeedRequests();
        const msgs = StorageService.getContactMessages();
        const vStats = StorageService.getVisitorStats();

        const totalPropViews = props.reduce((a, b) => a + (b.views || 0), 0);

        setStatsData({
          counts: {
            total_properties: props.length,
            available_properties: props.filter(p => p.status === 'available').length,
            rented_properties: props.filter(p => p.status === 'rented').length,
            sold_properties: props.filter(p => p.status === 'sold').length,
            pending_submissions: props.filter(p => p.status === 'pending_review').length,
            approved_submissions: props.filter(p => p.status === 'available').length,
            rejected_submissions: 0,
            total_reservations: inqs.length,
            pending_reservations: inqs.filter(i => i.status === 'new').length,
            need_requests: needs.length,
            contact_messages: msgs.length,
            total_views: totalPropViews,
          },
          audience_distribution: [
            { name: 'عائلات', key: 'families', value: props.filter(p => p.audience_type === 'families').length },
            { name: 'شباب ومهندسين', key: 'young_men', value: props.filter(p => p.audience_type === 'young_men').length },
            { name: 'طالبات ومغتربات', key: 'female_students', value: props.filter(p => p.audience_type === 'female_students').length },
          ],
          category_distribution: [],
          location_distribution: [],
          top_viewed_properties: [...props].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6),
          monthly_stats: StorageService.getMonthlyStats(),
          visitor_stats: {
            today: vStats.today_visitors || 1,
            month: vStats.month_visitors || 1,
            all_time: vStats.all_time_unique || 1,
            total_visits: vStats.total_page_views || totalPropViews || 1,
            property_views: totalPropViews,
            daily_breakdown: vStats.daily_breakdown || [],
          },
          referral_stats: StorageService.getReferralStats(),
          feedback_stats: StorageService.getFeedbackStats(),
        });
      }
    } catch (e) {
      console.warn('Stats fetch error:', e);
    }
    setLoading(false);
  };

  const counts = statsData.counts || {};
  const vStats = statsData.visitor_stats || { today: 1, month: 1, all_time: 1, total_visits: 1 };
  const totalProperties = counts.total_properties || 0;
  const totalViews = counts.total_views || vStats.property_views || 0;
  const totalReservations = counts.total_reservations || 0;

  return (
    <div className="space-y-6 animate-fade-in min-w-0" dir="rtl">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-[#8D6A28] border border-amber-200/70 flex items-center justify-center font-black shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                لوحة الإحصائيات والتحليلات الحية
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                تتبع زوار الـ IP الفريدين، تفاعل وتصفح العقارات، والحجوزات ومعدلات النمو
              </p>
            </div>
          </div>
        </div>

        {/* Date Range Selector & Refresh */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/70">
            {[
              { id: 'all', label: 'الكل' },
              { id: '30_days', label: 'آخر 30 يوم' },
              { id: '7_days', label: 'آخر 7 أيام' },
              { id: 'today', label: 'اليوم' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setDateRange(r.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  dateRange === r.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={loadStats}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer border border-slate-200/70"
            title="تحديث البيانات الفعلي"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#8D6A28]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ---------------- SECTION 1: UNIQUE VISITORS & TRAFFIC INTELLIGENCE ---------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#8D6A28]" />
            <span>حركة الزوار الفريدين وإجمالي المشاهدات (Unique IP Analytics)</span>
          </h2>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            تحديث فوري مع كاش ذكي
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Today Unique Visitors */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2 relative overflow-hidden group hover:border-[#8D6A28]/50 transition">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-black text-slate-600">زوار اليوم (فريد)</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              {(vStats.today || 1).toLocaleString('ar-EG')}
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
              <span className="text-slate-500 font-medium">عناوين IP فريدة خلال 24 ساعة</span>
              <span className="text-emerald-600 font-bold font-mono">اليوم</span>
            </div>
          </div>

          {/* 2. Month Unique Visitors */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2 relative overflow-hidden group hover:border-[#8D6A28]/50 transition">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-black text-slate-600">زوار الشهر (فريد)</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              {(vStats.month || 1).toLocaleString('ar-EG')}
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
              <span className="text-slate-500 font-medium">تصفح خلال الشهر الجاري</span>
              <span className="text-emerald-600 font-bold font-mono">الشهر الحالي</span>
            </div>
          </div>

          {/* 3. All Pages Total Visits */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2 relative overflow-hidden group hover:border-[#8D6A28]/50 transition">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-black text-slate-600">إجمالي الزيارات</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Globe className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              {(vStats.total_visits || 1).toLocaleString('ar-EG')}
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
              <span className="text-slate-500 font-medium">إجمالي مرات فتح وتصفح الصفحات</span>
              <span className="text-purple-600 font-bold font-mono">كل الصفحات</span>
            </div>
          </div>

          {/* 4. All-Time Cumulative Unique Visitors */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2 relative overflow-hidden group hover:border-[#8D6A28]/50 transition">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-black text-slate-600">الزوار الأصليون (كل الأوقات)</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#8D6A28] flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              {(vStats.all_time || 1).toLocaleString('ar-EG')}
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
              <span className="text-slate-500 font-medium">قاعدة الزوار التراكمية الفريدة</span>
              <span className="text-[#8D6A28] font-bold font-mono">كل الأوقات</span>
            </div>
          </div>

        </div>
      </div>

      {/* ---------------- SECTION 2: DAILY VISITOR TRAFFIC BREAKDOWN (LAST 7 DAYS) ---------------- */}
      {vStats.daily_breakdown && vStats.daily_breakdown.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900">مخطط حركة الزوار اليومي (آخر 7 أيام)</h3>
              <p className="text-xs text-slate-500">مقارنة بين الزوار الفريدين (Unique IPs) وإجمالي المشاهدات اليومية</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-3 rounded-full bg-[#8D6A28]" />
                <span>زوار فريدون (IP)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span>إجمالي التصفح</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="h-56 min-w-[500px] flex items-end justify-between gap-3 pt-6 pb-2 px-4 bg-slate-50 rounded-2xl border border-slate-100">
              {vStats.daily_breakdown.map((item, idx) => {
                const maxDay = Math.max(10, ...vStats.daily_breakdown!.map(d => Math.max(d.visitors, d.views)));
                const vHeight = Math.min(100, Math.max(12, (item.visitors / maxDay) * 100));
                const pHeight = Math.min(100, Math.max(12, (item.views / maxDay) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="flex items-end gap-1.5 w-full justify-center h-full">
                      {/* Visitors Bar */}
                      <div 
                        className="w-4 sm:w-6 bg-[#8D6A28] rounded-t-lg transition-all relative group/bar cursor-pointer hover:brightness-110"
                        style={{ height: `${vHeight}%` }}
                      >
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-[#0F172A] text-white px-2 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition whitespace-nowrap z-20 pointer-events-none shadow-md">
                          {item.visitors} زائر فريد
                        </span>
                      </div>

                      {/* Views Bar */}
                      <div 
                        className="w-4 sm:w-6 bg-blue-500 rounded-t-lg transition-all relative group/bar cursor-pointer hover:brightness-110"
                        style={{ height: `${pHeight}%` }}
                      >
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-[#0F172A] text-white px-2 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition whitespace-nowrap z-20 pointer-events-none shadow-md">
                          {item.views} تصفح
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 truncate">{item.day_name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SECTION 3: CORE PROPERTY & INVENTORY KPIS ---------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-1.5 min-w-0">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-black text-slate-600">إجمالي العقارات</span>
            <Building2 className="w-4 h-4 text-[#8D6A28]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {totalProperties.toLocaleString('ar-EG')}
          </div>
          <span className="text-[11px] text-emerald-600 font-bold block truncate">
            {counts.available_properties || 0} متاح حالياً للعرض
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-1.5 min-w-0">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-black text-slate-600">إجمالي الحجوزات</span>
            <CalendarCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {totalReservations.toLocaleString('ar-EG')}
          </div>
          <span className="text-[11px] text-amber-600 font-bold block truncate">
            {counts.pending_reservations || 0} بانتظار المعاينة والتأكيد
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-1.5 min-w-0">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-black text-slate-600">مشاهدات العقارات</span>
            <Eye className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {totalViews.toLocaleString('ar-EG')}
          </div>
          <span className="text-[11px] text-purple-600 font-bold block truncate">
            تفاعل الزوار على صفحات العقارات
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-1.5 min-w-0">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-black text-slate-600">طلبات البحث الخاصة</span>
            <HelpCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {(counts.need_requests || 0).toLocaleString('ar-EG')}
          </div>
          <span className="text-[11px] text-slate-500 font-bold block truncate">
            طلبات عملاء تحتاج مطابقة
          </span>
        </div>
      </div>

      {/* ---------------- SECTION 4: MARKET STATUS & AUDIENCE BREAKDOWN ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Properties Status Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 min-w-0">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#8D6A28]" />
            <span>حالات العقارات في المنصة</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-emerald-50 text-emerald-900 font-bold border border-emerald-100">
              <span>العقارات المتاحة (Available):</span>
              <span className="font-black font-mono text-sm">{counts.available_properties || 0}</span>
            </div>

            <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-blue-50 text-blue-900 font-bold border border-blue-100">
              <span>المؤجرة (Rented):</span>
              <span className="font-black font-mono text-sm">{counts.rented_properties || 0}</span>
            </div>

            <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-purple-50 text-purple-900 font-bold border border-purple-100">
              <span>المباعة (Sold):</span>
              <span className="font-black font-mono text-sm">{counts.sold_properties || 0}</span>
            </div>

            <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-amber-50 text-amber-900 font-bold border border-amber-100">
              <span>قيد مراجعة الإدارة:</span>
              <span className="font-black font-mono text-sm">{counts.pending_submissions || 0}</span>
            </div>
          </div>
        </div>

        {/* Customer Submissions Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 min-w-0">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <FilePlus2 className="w-4 h-4 text-[#8D6A28]" />
            <span>عقارات أضافها العملاء</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-amber-50 text-amber-900 font-bold border border-amber-100">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>بانتظار المراجعة والاعتماد:</span>
              </span>
              <span className="font-black font-mono text-sm">{counts.pending_submissions || 0}</span>
            </div>

            <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-emerald-50 text-emerald-900 font-bold border border-emerald-100">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>تمت الموافقة والنشر:</span>
              </span>
              <span className="font-black font-mono text-sm">{counts.approved_submissions || 0}</span>
            </div>

            <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-rose-50 text-rose-900 font-bold border border-rose-100">
              <span className="flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>المرفوضة:</span>
              </span>
              <span className="font-black font-mono text-sm">{counts.rejected_submissions || 0}</span>
            </div>
          </div>
        </div>

        {/* Audience Classification Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 min-w-0">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-[#8D6A28]" />
            <span>تصنيف الفئة المستهدفة</span>
          </h3>

          <div className="space-y-3">
            {statsData.audience_distribution.map((aud) => (
              <div key={aud.key} className="flex items-center justify-between text-xs p-3 rounded-2xl bg-slate-50 text-slate-800 font-bold border border-slate-100">
                <span>{aud.name}:</span>
                <span className="font-black font-mono text-sm">{aud.value} عقار</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ---------------- SECTION 5: MONTHLY ACTIVITY & GROWTH TRENDS ---------------- */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-slate-900">معدل النشاط والنمو الشهري</h3>
            <p className="text-xs text-slate-500">مقارنة إضافة العقارات الجديدة وطلبات الحجز المستلمة على مدار الشهور</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded-full bg-[#8D6A28]" />
              <span>العقارات المضافة</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span>طلبات الحجز</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="h-64 min-w-[480px] flex items-end justify-between gap-4 pt-8 pb-3 px-4 bg-slate-50 rounded-2xl border border-slate-100">
            {statsData.monthly_stats.map((item, idx) => {
              const propCount = item.properties || item.properties_added || 0;
              const resCount = item.reservations || item.reservations_count || 0;
              const maxVal = Math.max(20, propCount * 1.3, resCount * 1.3);
              const propHeight = Math.min(100, Math.max(10, (propCount / maxVal) * 100));
              const resHeight = Math.min(100, Math.max(10, (resCount / maxVal) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="flex items-end gap-2 w-full justify-center h-full">
                    <div 
                      className="w-5 sm:w-8 bg-[#8D6A28] rounded-t-xl transition-all relative group/bar cursor-pointer"
                      style={{ height: `${propHeight}%` }}
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-[#0F172A] text-white px-2 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition whitespace-nowrap z-20 pointer-events-none shadow-md">
                        {propCount} عقار
                      </span>
                    </div>
                    <div 
                      className="w-5 sm:w-8 bg-blue-500 rounded-t-xl transition-all relative group/bar cursor-pointer"
                      style={{ height: `${resHeight}%` }}
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-[#0F172A] text-white px-2 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition whitespace-nowrap z-20 pointer-events-none shadow-md">
                        {resCount} حجز
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 truncate">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------------- SECTION 6: TOP VIEWED & ENGAGING PROPERTIES ---------------- */}
      {statsData.top_viewed_properties.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8D6A28]" />
              <span>العقارات الأكثر مشاهدة وتفاعلاً في المنصة</span>
            </h3>
            <span className="text-xs text-slate-500 font-bold">أعلى 6 عقارات</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {statsData.top_viewed_properties.map((p, idx) => (
              <div 
                key={p.id || idx} 
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 min-w-0 hover:bg-white hover:border-[#8D6A28]/40 transition shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-xl bg-amber-100 text-[#8D6A28] font-black text-xs flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-black text-xs text-slate-900 truncate">{p.title}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                      <span>{Number(p.price).toLocaleString('ar-EG')} ج.م</span>
                      {p.ref_id && <span className="text-[#8D6A28] font-bold">({p.ref_id})</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 text-xs font-black flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{p.views || 0}</span>
                  </div>
                  <a
                    href={`#/admin/properties/show/${p.id}`}
                    className="p-1.5 rounded-lg bg-slate-200/70 hover:bg-[#8D6A28] hover:text-white text-slate-700 transition"
                    title="فتح صفحة العقار"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- SECTION 7: HOW USERS FOUND US (ACQUISITION & REFERRAL ANALYTICS) ---------------- */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#8D6A28] border border-amber-200/70 flex items-center justify-center font-black">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>مصادر معرفة العملاء بالمنصة (قنوات الوصول والانتشار)</span>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                    استطلاع أول زيارة
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  توزيع قنوات التسويق والوسائل الأكثر جذباً للعملاء في دمياط الجديدة
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {statsData.referral_stats?.top_channel && statsData.referral_stats.top_channel.count > 0 && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-black text-[#8D6A28] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#8D6A28]" />
                <span>الأعلى: {statsData.referral_stats.top_channel.label} ({statsData.referral_stats.top_channel.percentage}%)</span>
              </div>
            )}

            <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-black flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>إجمالي الاستجابات: {statsData.referral_stats?.total_responses || 0}</span>
            </div>
          </div>
        </div>

        {/* Progress Bars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(statsData.referral_stats?.channel_breakdown || []).map((ch) => {
            const isTop = statsData.referral_stats?.top_channel?.key === ch.key && ch.count > 0;
            
            let barGradient = 'from-[#8D6A28] to-amber-500';
            let iconEmoji = '📢';
            if (ch.key === 'facebook') { barGradient = 'from-blue-600 to-blue-400'; iconEmoji = '📱'; }
            else if (ch.key === 'instagram') { barGradient = 'from-pink-600 to-rose-400'; iconEmoji = '📸'; }
            else if (ch.key === 'tiktok') { barGradient = 'from-slate-900 to-slate-700'; iconEmoji = '🎵'; }
            else if (ch.key === 'friend_recommendation') { barGradient = 'from-amber-600 to-amber-400'; iconEmoji = '👥'; }
            else if (ch.key === 'google_search') { barGradient = 'from-emerald-600 to-teal-400'; iconEmoji = '🔍'; }
            else if (ch.key === 'horus_damietta_university') { barGradient = 'from-indigo-600 to-purple-400'; iconEmoji = '🎓'; }
            else if (ch.key === 'whatsapp_telegram_groups') { barGradient = 'from-emerald-700 to-emerald-500'; iconEmoji = '💬'; }
            else if (ch.key === 'billboards_damietta') { barGradient = 'from-amber-700 to-amber-500'; iconEmoji = '🏙️'; }
            else if (ch.key === 'broker_office') { barGradient = 'from-purple-700 to-purple-500'; iconEmoji = '🏢'; }

            return (
              <div 
                key={ch.key} 
                className={`p-3.5 rounded-2xl border transition-all ${
                  isTop 
                    ? 'bg-amber-50/70 border-amber-200 shadow-2xs' 
                    : 'bg-slate-50 border-slate-100 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{iconEmoji}</span>
                    <span className="text-slate-800">{ch.label}</span>
                    {isTop && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#8D6A28] text-white">الأكثر انتشاراً</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-black font-mono">{ch.count} عميل</span>
                    <span className="text-slate-500 text-[11px] font-mono font-bold">({ch.percentage}%)</span>
                  </div>
                </div>

                <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${barGradient} rounded-full transition-all duration-700`}
                    style={{ width: `${Math.max(ch.percentage, ch.count > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------- SECTION 8: CUSTOMER FEEDBACK & EXPERIENCE SURVEYS ---------------- */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#8D6A28] border border-amber-200/70 flex items-center justify-center font-black">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>استطلاعات الرأي ومعدلات رضا العملاء (Feedback Intelligence)</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {statsData.feedback_stats?.average_satisfaction_percentage || 95}% نسبة الرضا
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  حملات الاستطلاع الموجهة للعملاء لقياس جودة الخدمات والسرعة وسكن الطلاب
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#8D6A28] hover:bg-[#73541D] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إدارة وإنشاء حملات الاستطلاع</span>
            </button>
          </div>
        </div>

        {/* Feedback Cards & Recent Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Campaigns Overview (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#8D6A28]" />
              <span>الحملات الفعالة حالياً ({statsData.feedback_stats?.active_campaigns || 0})</span>
            </h4>

            {(!statsData.feedback_stats?.campaigns || statsData.feedback_stats.campaigns.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">لا توجد حملات منشأة</p>
            ) : (
              <div className="space-y-2.5">
                {statsData.feedback_stats.campaigns.map((camp) => (
                  <div key={camp.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 truncate">{camp.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                        camp.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {camp.is_active ? 'نشط' : 'متوقف'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">❓ {camp.question}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
                      <span>الاستجابات: {camp.responses_count || 0}</span>
                      {camp.average_rating && (
                        <span className="text-amber-600 font-bold flex items-center gap-0.5">
                          ⭐ {camp.average_rating} / 5
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Client Reviews & Comments (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#8D6A28]" />
              <span>أحدث تقييمات وآراء العملاء (Live Reviews)</span>
            </h4>

            {(!statsData.feedback_stats?.recent_responses || statsData.feedback_stats.recent_responses.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">لا توجد تقييمات بعد</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto divide-y divide-slate-100">
                {statsData.feedback_stats.recent_responses.map((resp) => (
                  <div key={resp.id} className="pt-2 first:pt-0 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">{resp.client_name || 'عميل'}</span>
                        {resp.rating && (
                          <span className="flex items-center gap-0.5 text-amber-500 font-bold text-[11px]">
                            ⭐ {resp.rating}/5
                          </span>
                        )}
                        {resp.selected_option_label && (
                          <span className="text-[10px] text-[#8D6A28] bg-amber-50 px-1.5 py-0.5 rounded-md font-bold">
                            {resp.selected_option_label}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                        {new Date(resp.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {resp.comment && (
                      <p className="text-[11px] text-slate-600 bg-amber-50/40 p-2 rounded-xl border border-amber-100/60 leading-relaxed">
                        "{resp.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Feedback Campaign Modal */}
      <AdminFeedbackCampaignModal
        isOpen={isFeedbackModalOpen}
        onClose={() => {
          setIsFeedbackModalOpen(false);
          loadStats();
        }}
      />

    </div>
  );
};

