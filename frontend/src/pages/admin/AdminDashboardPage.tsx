import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Property, InquiryReservation, PropertyType, ReferralStatsSummary } from '../../types';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { FALLBACK_PROPERTY_IMAGE } from '../../utils/media';
import { 
  Building2, 
  MapPin, 
  Layers, 
  CalendarCheck, 
  Eye, 
  Users, 
  Clock, 
  Globe, 
  BarChart3, 
  TrendingUp, 
  ArrowUpRight, 
  Sparkles, 
  MessageCircle, 
  Activity,
  Plus,
  Pencil,
  ExternalLink,
  Share2,
  Smartphone,
  Award,
  ThumbsUp,
  Radio,
  CheckCircle2
} from 'lucide-react';
import { ModernStateFeedback } from '../../components/Skeletons';
import { AdminFeedbackCampaignModal } from '../../components/AdminFeedbackCampaignModal';

interface AdminDashboardPageProps {
  onOpenAddProperty?: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onOpenAddProperty }) => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<InquiryReservation[]>([]);
  const [districts, setDistricts] = useState(StorageService.getDistricts());
  const [visitorStats, setVisitorStats] = useState(StorageService.getVisitorStats());
  const [activityLogs, setActivityLogs] = useState(StorageService.getActivityLogs());
  const [monthlyStats, setMonthlyStats] = useState(StorageService.getMonthlyStats());
  const [referralStats, setReferralStats] = useState<ReferralStatsSummary>(() => StorageService.getReferralStats());
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const props = StorageService.getProperties();
    const inqs = StorageService.getInquiries();
    setProperties(props);
    setInquiries(inqs);
    setDistricts(StorageService.getDistricts());
    setVisitorStats(StorageService.getVisitorStats());
    setActivityLogs(StorageService.getActivityLogs());
    setMonthlyStats(StorageService.getMonthlyStats());
    setReferralStats(StorageService.getReferralStats());

    // Try fetching live data from backend if available
    ApiService.getDashboardData().then((res) => {
      if (res) {
        if (res.visitor_stats) {
          setVisitorStats((prev) => ({
            ...prev,
            today_visitors: res.visitor_stats.today ?? prev.today_visitors,
            month_visitors: res.visitor_stats.month ?? prev.month_visitors,
            all_time_unique: res.visitor_stats.all_time ?? prev.all_time_unique,
            total_page_views: res.visitor_stats.total_visits ?? prev.total_page_views,
          }));
        }
        if (res.referral_stats) {
          setReferralStats(res.referral_stats);
        }
      }
    }).catch(() => {});

    // Also fetch dedicated referral stats to be doubly sure
    ApiService.getReferralStats().then((res) => {
      if (res && res.success) {
        setReferralStats({
          total_responses: res.total_responses || 0,
          top_channel: res.top_channel,
          channel_breakdown: res.channel_breakdown || [],
          device_breakdown: res.device_breakdown || [],
          recent_feedbacks: res.recent_feedbacks || [],
        });
      }
    }).catch(() => {});
  };

  const availablePropertiesCount = properties.filter((p) => p.status === 'available').length;
  const soldOrRentedCount = properties.filter((p) => p.status === 'sold' || p.status === 'rented').length;
  const newInquiriesCount = inquiries.filter((i) => i.status === 'new').length;
  const completedInquiriesCount = inquiries.filter((i) => i.status === 'completed').length;
  const totalViews = properties.reduce((acc, curr) => acc + (curr.views || 0), 0);

  const categoryCounts: Record<PropertyType, number> = {
    apartment: properties.filter((p) => p.property_type === 'apartment').length,
    villa: properties.filter((p) => p.property_type === 'villa').length,
    duplex: properties.filter((p) => p.property_type === 'duplex').length,
    penthouse: properties.filter((p) => p.property_type === 'penthouse').length,
    chalet: properties.filter((p) => p.property_type === 'chalet').length,
    studio: properties.filter((p) => p.property_type === 'studio').length,
    shop: properties.filter((p) => p.property_type === 'shop').length,
    office: properties.filter((p) => p.property_type === 'office').length,
    land: properties.filter((p) => p.property_type === 'land').length,
    building: properties.filter((p) => p.property_type === 'building').length,
  };

  const categoryNames: Record<PropertyType, string> = {
    apartment: 'شقق سكنية',
    villa: 'فيلات مستقلة',
    duplex: 'دوبلكس',
    penthouse: 'بنتهاوس',
    chalet: 'شاليهات',
    studio: 'استوديو',
    shop: 'محلات تجارية',
    office: 'مكاتب ومقرات إدارية',
    land: 'أراضي ومواقع بناء',
    building: 'عمارات ومباني كاملة',
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG').format(price);
  };

  return (
    <div className="space-y-8 animate-fade-in" dir="rtl">
      
      {/* 1. TOP AREA / WELCOME HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed">
            مرحباً بك في لوحة التحكم 👋
          </h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">
            إليك ملخص سريع وشامل لحالة العقارات والزوار والنشاط اليومي.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/admin/properties/create')}
            className="px-4 py-2.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة عقار جديد</span>
          </button>
          <Link
            to="/"
            target="_blank"
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <Globe className="w-4 h-4 text-[#8D6A28]" />
            <span className="hidden sm:inline">معاينة الموقع</span>
          </Link>
        </div>
      </div>

      {/* 2. PRIMARY STATISTICS CARDS (5 Cards) */}
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          
          {/* Card 1: عدد العقارات */}
          <div 
            onClick={() => navigate('/admin/properties')}
            className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-[#8D6A28] transition cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {availablePropertiesCount} متاح
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block">عدد العقارات</span>
              <span className="text-2xl font-black text-slate-900">{properties.length}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              {soldOrRentedCount} تم البيع / التأجير
            </div>
          </div>

          {/* Card 2: طلبات الحجز */}
          <div 
            onClick={() => navigate('/admin/reservations')}
            className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-[#8D6A28] transition cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition">
                <CalendarCheck className="w-5 h-5" />
              </div>
              {newInquiriesCount > 0 && (
                <span className="text-[10px] font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full animate-pulse">
                  {newInquiriesCount} جديد
                </span>
              )}
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block">طلبات الحجز</span>
              <span className="text-2xl font-black text-slate-900">{inquiries.length}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              {completedInquiriesCount} معاينات مكتملة
            </div>
          </div>

          {/* Card 3: الأقسام */}
          <div 
            onClick={() => navigate('/admin/categories')}
            className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-[#8D6A28] transition cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                9 فئات
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block">الأقسام</span>
              <span className="text-2xl font-black text-slate-900">9</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              شقق، فيلات، محلات، أراضي...
            </div>
          </div>

          {/* Card 4: الأماكن */}
          <div 
            onClick={() => navigate('/admin/locations')}
            className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-[#8D6A28] transition cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#8D6A28] flex items-center justify-center group-hover:scale-105 transition">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-[#8D6A28] bg-amber-50 px-2 py-0.5 rounded-full">
                دمياط الجديدة
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block">الأماكن</span>
              <span className="text-2xl font-black text-slate-900">{districts.length}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              تغطية شاملة لكافة الأحياء
            </div>
          </div>

          {/* Card 5: إجمالي مشاهدات العقارات */}
          <div 
            onClick={() => navigate('/admin/statistics')}
            className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-[#8D6A28] transition cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
                <Eye className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                +{visitorStats.today_visitors} اليوم
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block">إجمالي مشاهدات العقارات</span>
              <span className="text-2xl font-black text-slate-900">
                {new Intl.NumberFormat('ar-EG').format(totalViews)}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              {visitorStats.all_time_unique} زائر فريد
            </div>
          </div>

        </div>
      </div>

      {/* 3. VISITOR STATISTICS CARDS (4 Cards) */}
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                اليوم
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block">زوار اليوم (فريد)</span>
              <span className="text-2xl font-black text-indigo-950">{visitorStats.today_visitors}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              عناوين IP فريدة خلال 24 ساعة
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                الشهر الحالي
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block">زوار الشهر (فريد)</span>
              <span className="text-2xl font-black text-blue-950">
                {new Intl.NumberFormat('ar-EG').format(visitorStats.month_visitors)}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              تصفح خلال الشهر الجاري
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#8D6A28] flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-[#8D6A28] bg-amber-50 px-2 py-0.5 rounded-full">
                كل الصفحات
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block">إجمالي الزيارات</span>
              <span className="text-2xl font-black text-amber-950">
                {new Intl.NumberFormat('ar-EG').format(visitorStats.total_page_views)}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              إجمالي مرات فتح وتصفح الصفحات
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                كل الأوقات
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block">الزوار الأصليون (كل الأوقات)</span>
              <span className="text-2xl font-black text-emerald-950">
                {new Intl.NumberFormat('ar-EG').format(visitorStats.all_time_unique)}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              قاعدة الزوار التراكمية الفريدة
            </div>
          </div>

        </div>
      </div>

      {/* 4. RECENT DATA (أحدث العقارات & أحدث الحجوزات جنبًا إلى جنب) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Recent Properties (أحدث العقارات) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#8D6A28] flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">أحدث العقارات</h3>
                <p className="text-[11px] text-slate-500">آخر العقارات المضافة في دمياط الجديدة</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/properties')}
              className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>عرض الكل ({properties.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {properties.length === 0 ? (
            <div className="p-8 text-center">
              <ModernStateFeedback
                type="empty"
                title="لا توجد عقارات مضافة حتى الآن"
                description="ابدأ بإضافة أول عقار للمنصة لتظهر تفاصيله وإحصائياته هنا."
                actionText="إضافة عقار جديد"
                onAction={() => onOpenAddProperty ? onOpenAddProperty() : navigate('/admin/properties/add')}
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 flex-1">
              {properties.slice(0, 5).map((prop) => (
                <div 
                  key={prop.id} 
                  className="p-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-3 cursor-pointer group"
                  onClick={() => navigate(`/admin/properties/show/${prop.id}`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={prop.images?.[0] || FALLBACK_PROPERTY_IMAGE} 
                      alt={prop.title}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform" 
                      onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
                    />
                    <div className="min-w-0">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 block truncate group-hover:text-[#8D6A28] transition-colors">{prop.title}</span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                        <span className="font-mono font-bold text-[#8D6A28]">{prop.ref_id}</span>
                        <span>•</span>
                        <span>{prop.district_name}</span>
                        <span>•</span>
                        <span className="font-bold text-slate-900">{formatPrice(prop.price)} ج.م</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black whitespace-nowrap inline-flex items-center justify-center shrink-0 ${
                      prop.status === 'available'
                        ? 'bg-emerald-100 text-emerald-800'
                        : prop.status === 'sold'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {prop.status === 'available' ? 'متاح' : prop.status === 'sold' ? 'مباع' : 'محجوز'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/properties/edit/${prop.id}`);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#8D6A28] hover:text-white text-slate-700 transition cursor-pointer"
                      title="تعديل ومعاينة العقار بالإدارة"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/properties/${prop.id}`, '_blank');
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                      title="معاينة صفحة العميل في نافذة جديدة"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reservations (أحدث طلبات الحجز) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">أحدث الحجوزات</h3>
                <p className="text-[11px] text-slate-500">طلبات المعاينة والحجز الواردة حديثاً</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/reservations')}
              className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>عرض الكل ({inquiries.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {inquiries.length === 0 ? (
            <div className="p-8 text-center">
              <ModernStateFeedback
                type="empty"
                title="لا توجد طلبات حجز مسجلة"
                description="طلبات المعاينة والحجز الواردة من العملاء ستظهر هنا فور إرسالها."
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 flex-1">
              {inquiries.slice(0, 5).map((inq) => (
                <div key={inq.id} className="p-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900">{inq.client_name}</span>
                      <span className="text-[10px] font-mono text-slate-500" dir="ltr">{inq.client_phone}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      عقار: <span className="font-bold text-slate-700">{inq.property_title}</span>
                      <span className="font-mono text-[#8D6A28] mr-1">({inq.property_ref})</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono" dir="ltr">
                      {new Date(inq.created_at).toLocaleDateString('ar-EG')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      inq.status === 'new'
                        ? 'bg-rose-100 text-rose-800'
                        : inq.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-800'
                        : inq.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {inq.status === 'new' ? 'جديد' : inq.status === 'in_progress' ? 'متابعة' : inq.status === 'completed' ? 'تم' : 'ملغي'}
                    </span>
                    {inq.client_phone && (
                      <a
                        href={`https://wa.me/${inq.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً ${inq.client_name}، نتواصل معك من منصة سكني بخصوص طلب معاينة العقار كود ${inq.property_ref}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition"
                        title="واتساب سريع"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 5. CHARTS: MONTHLY STATISTICS & CATEGORY DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Monthly Statistics Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#8D6A28]" />
                <h3 className="text-base font-extrabold text-slate-900">الإحصائيات الشهرية (Monthly Statistics)</h3>
              </div>
              <p className="text-xs text-slate-500">حركة نشر العقارات وطلبات الحجز على مدار الأشهر السابقة</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-full bg-[#8D6A28]" />
                <span>العقارات المضافة</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span>طلبات الحجز</span>
              </div>
            </div>
          </div>

          {/* Visual Multi-Bar Chart */}
          <div className="h-52 flex items-end justify-between gap-3 pt-6 pb-2 px-4 bg-slate-50 rounded-2xl border border-slate-100">
            {monthlyStats.map((item, idx) => {
              const maxVal = 35;
              const propHeight = (item.properties_added / maxVal) * 100;
              const resHeight = (item.reservations_count / maxVal) * 100;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="flex items-end gap-1.5 w-full justify-center h-full">
                    {/* Properties bar */}
                    <div 
                      className="w-3.5 sm:w-5 bg-[#8D6A28] rounded-t-lg transition-all relative group/bar"
                      style={{ height: `${propHeight}%` }}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-[#0F172A] text-white px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition whitespace-nowrap z-20 pointer-events-none">
                        {item.properties_added} عقار
                      </span>
                    </div>
                    {/* Reservations bar */}
                    <div 
                      className="w-3.5 sm:w-5 bg-blue-500 rounded-t-lg transition-all relative group/bar"
                      style={{ height: `${resHeight}%` }}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-[#0F172A] text-white px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition whitespace-nowrap z-20 pointer-events-none">
                        {item.reservations_count} حجز
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 truncate">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Core Listing Model Distribution Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#8D6A28]" />
                <h3 className="text-base font-extrabold text-slate-900">أنماط العقارات (Listing Model)</h3>
              </div>
              <p className="text-xs text-slate-500">توزيع العقارات والغرف حسب النموذج التجاري</p>
            </div>
            <span className="text-xs font-black text-[#8D6A28] bg-amber-50 px-2.5 py-1 rounded-xl">
              {properties.length} عقار
            </span>
          </div>

          {/* Progress Distribution List */}
          <div className="space-y-3.5 pt-1">
            {[
              {
                label: 'شقق للبيع',
                count: properties.filter((p) => p.operation_type === 'sale').length,
                color: 'from-[#0F172A] to-slate-700',
              },
              {
                label: 'شقق للإيجار بالكامل',
                count: properties.filter((p) => p.operation_type === 'rent' && !p.has_detailed_rooms).length,
                color: 'from-emerald-700 to-emerald-500',
              },
              {
                label: 'شقق إيجار بالغرف',
                count: properties.filter((p) => p.operation_type === 'rent' && p.has_detailed_rooms).length,
                color: 'from-[#8D6A28] to-amber-500',
              },
            ].map((item) => {
              const percent = properties.length > 0 ? Math.round((item.count / properties.length) * 100) : 0;

              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 font-extrabold">{item.count} عقار</span>
                      <span className="text-slate-400 text-[11px] font-mono">({percent}%)</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Room breakdown box */}
            {properties.some((p) => p.has_detailed_rooms) && (
              <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-slate-900 block">إحصائيات الغرف المستقلة</span>
                  <span className="text-slate-500 text-[11px]">نظام الإيجار بالغرف</span>
                </div>
                <div className="flex items-center gap-2 font-bold">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg text-[10px]">
                    {properties.reduce((acc, p) => acc + (p.detailed_rooms?.filter((r) => r.status === 'available').length || 0), 0)} متاح
                  </span>
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg text-[10px]">
                    {properties.reduce((acc, p) => acc + (p.detailed_rooms?.filter((r) => r.status === 'reserved' || r.status === 'rented').length || 0), 0)} محجوز
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 6. ACQUISITION CHANNELS & REFERRAL INTELLIGENCE (مصادر معرفة العملاء بسكنك) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#8D6A28] border border-amber-200/70 flex items-center justify-center font-black">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>مصادر معرفة العملاء بسكنك (قنوات الوصول والانتشار)</span>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                    استطلاع أول زيارة
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  تحليلات دقيقة توضح من أين يتعرف الزوار والعملاء على المنصة لتحسين التسويق والإنفاق الإعلاني
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Top Channel Badge */}
            {referralStats?.top_channel && referralStats.top_channel.count > 0 && (
              <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/80 border border-amber-200 text-xs font-black text-[#8D6A28] flex items-center gap-1.5 shadow-2xs">
                <Award className="w-4 h-4 text-[#8D6A28]" />
                <span>أعلى قناة: {referralStats.top_channel.label} ({referralStats.top_channel.percentage}%)</span>
              </div>
            )}

            <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-black flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>إجمالي الاستجابات: {referralStats?.total_responses || 0}</span>
            </div>

            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#8D6A28] hover:bg-[#73541D] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إدارة حملات الاستطلاع (Feedback)</span>
            </button>
          </div>
        </div>

        {/* 2-Columns: Breakdown Bars + Recent Responses */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Column A: Channel Distribution Bars (7 cols) */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span>توزيع القنوات حسب عدد المستجيبين</span>
              <span>النسبة المئوية</span>
            </div>

            <div className="space-y-3">
              {(referralStats?.channel_breakdown || []).map((ch) => {
                const isTop = referralStats?.top_channel?.key === ch.key && ch.count > 0;
                
                // Color palette mapping based on channel
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
                    className={`p-3 rounded-2xl border transition-all ${
                      isTop 
                        ? 'bg-amber-50/60 border-amber-200 shadow-2xs' 
                        : 'bg-slate-50/60 border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">{iconEmoji}</span>
                        <span className="text-slate-800">{ch.label}</span>
                        {isTop && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#8D6A28] text-white">الأكثر فاعلية</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-black font-mono">{ch.count} عميل</span>
                        <span className="text-slate-500 text-[11px] font-mono font-bold">({ch.percentage}%)</span>
                      </div>
                    </div>

                    {/* Progress Track */}
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

          {/* Column B: Recent Feedback Logs & Insights (5 cols) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#8D6A28]" />
                  <span>أحدث استجابات الزوار (Recent Logs)</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">تسجيل فوري</span>
              </div>

              {(!referralStats?.recent_feedbacks || referralStats.recent_feedbacks.length === 0) ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  لا توجد استجابات مسجلة بعد. ستظهر هنا فور إجابة الزوار على سؤال أول زيارة.
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {referralStats.recent_feedbacks.map((item, idx) => (
                    <div key={item.id || idx} className="pt-2 first:pt-0 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-slate-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{item.source_label}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      {item.custom_note && (
                        <p className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-100 leading-relaxed">
                          "{item.custom_note}"
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>الجهاز: {item.device_type === 'mobile' ? '📱 هاتف' : item.device_type === 'tablet' ? '📟 تابلت' : '💻 كمبيوتر'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Smart Marketing Tip Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200/80 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Sparkles className="w-3.5 h-3.5 text-[#8D6A28]" />
                <span>نصيحة ذكية للتسويق:</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                ركّز حملاتك الإعلانية على القنوات الأعلى جذباً للعملاء، واستغل جروبات الجامعة لدعم سكن الطلاب والطالبات في دمياط الجديدة.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 7. DAILY VISITORS BREAKDOWN */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#8D6A28]" />
              <h3 className="text-base font-extrabold text-slate-900">سجل الزيارات اليومية (Daily Visitors)</h3>
            </div>
            <p className="text-xs text-slate-500">حركة الزوار وتصفح الصفحات خلال آخر 7 أيام</p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
            تسجيل مشفر ومحمي للخصوصية (Masked IPs)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
              <tr>
                <th className="p-3">التاريخ واليوم</th>
                <th className="p-3 text-center">الزوار الفريدين</th>
                <th className="p-3 text-center">مشاهدات الصفحات</th>
                <th className="p-3 text-left">معدل التفاعل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(visitorStats?.daily_breakdown || []).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80">
                  <td className="p-3 font-bold text-slate-800">
                    {row.day_name} <span className="text-[11px] text-slate-400 font-mono font-normal">({row.date})</span>
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-900">
                    {row.visitors}
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-[#8D6A28]">
                    {row.views}
                  </td>
                  <td className="p-3 text-left font-mono text-emerald-600 font-bold">
                    {row.visitors > 0 ? (row.views / row.visitors).toFixed(1) : '0.0'} صفحة/زائر
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. LIVE ACTIVITY FEED */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#8D6A28]" />
            <h3 className="text-base font-extrabold text-slate-900">سجل النشاط المباشر (Recent Activity)</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">آخر الأحداث</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {activityLogs.slice(0, 4).map((log) => (
            <div key={log.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-900 truncate">{log.title}</span>
                <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                  {new Date(log.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">{log.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Feedback & Surveys Campaign Manager Modal */}
      <AdminFeedbackCampaignModal
        isOpen={isFeedbackModalOpen}
        onClose={() => {
          setIsFeedbackModalOpen(false);
          loadData();
        }}
      />

    </div>
  );
};
