import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Property, 
  InquiryReservation, 
  NeedRequest, 
  ContactMessage, 
  SystemSettings,
  ActivityLog,
  WhyUsItem,
  VisitorLog,
  VisitorStats,
  MonthlyStatsItem,
  LocationDistrict,
  PropertyType
} from '../types';
import { StorageService } from '../services/storageService';
import { ApiService } from '../services/apiService';
import { AMENITIES_LIST } from '../data/mockData';
import { resolveImageUrl, FALLBACK_PROPERTY_IMAGE } from '../utils/media';
import { 
  LayoutDashboard, 
  Building2, 
  CalendarCheck, 
  HelpCircle, 
  Mail, 
  Settings, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Phone, 
  MessageCircle, 
  Eye, 
  Trash2, 
  Sparkles, 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  LogOut, 
  RotateCcw,
  Check,
  AlertCircle,
  Video,
  FileText,
  DollarSign,
  Briefcase,
  Activity,
  Globe,
  BellRing,
  Award,
  MapPin,
  Layers,
  Tag,
  BarChart3,
  ExternalLink,
  Filter,
  ArrowUpRight,
  Smartphone,
  Laptop,
  Compass
} from 'lucide-react';

interface AdminDashboardProps {
  properties: Property[];
  onRefreshData: () => void;
  onSelectProperty: (property: Property) => void;
  onOpenAddProperty: () => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  properties,
  onRefreshData,
  onSelectProperty,
  onOpenAddProperty,
  onLogout,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const setTab = (tab: string) => {
    setSearchParams({ tab });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Data states
  const [inquiries, setInquiries] = useState<InquiryReservation[]>(() => StorageService.getInquiries());
  const [needRequests, setNeedRequests] = useState<NeedRequest[]>(() => StorageService.getNeedRequests());
  const [messages, setMessages] = useState<ContactMessage[]>(() => StorageService.getContactMessages());
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => StorageService.getActivityLogs());
  const [settings, setSettings] = useState<SystemSettings>(() => StorageService.getSettings());
  const [districts, setDistricts] = useState<LocationDistrict[]>(() => StorageService.getDistricts());
  const [visitorStats, setVisitorStats] = useState<VisitorStats>(() => StorageService.getVisitorStats());
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>(() => StorageService.getVisitorLogs());
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStatsItem[]>(() => StorageService.getMonthlyStats());

  // UI States
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState(settings.hero_video_url);

  // Property Filters inside admin
  const [propertySearch, setPropertySearch] = useState('');
  const [propertyOpFilter, setPropertyOpFilter] = useState<'all' | 'sale' | 'rent'>('all');
  const [propertyStatusFilter, setPropertyStatusFilter] = useState<'all' | 'available' | 'sold' | 'reserved'>('all');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all');

  // Inquiries Filters
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryFilter, setInquiryFilter] = useState<'all' | 'new' | 'in_progress' | 'completed' | 'cancelled'>('all');

  // Need Requests Filter
  const [needSearch, setNeedSearch] = useState('');

  // Contact Messages Filter
  const [messageSearch, setMessageSearch] = useState('');

  // Reload data when component mounts or updates
  useEffect(() => {
    setInquiries(StorageService.getInquiries());
    setNeedRequests(StorageService.getNeedRequests());
    setMessages(StorageService.getContactMessages());
    setActivityLogs(StorageService.getActivityLogs());
    setSettings(StorageService.getSettings());
    setDistricts(StorageService.getDistricts());
    setVisitorStats(StorageService.getVisitorStats());
    setVisitorLogs(StorageService.getVisitorLogs());
    setMonthlyStats(StorageService.getMonthlyStats());
  }, [properties]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG').format(price);
  };

  const handleUpdateInquiryStatus = async (id: string, status: InquiryReservation['status']) => {
    try {
      const numericId = parseInt(id.replace(/\D/g, ''), 10);
      if (numericId) {
        await ApiService.updateReservationStatus(numericId, status);
      }
    } catch (err) {}
    StorageService.updateInquiryStatus(id, status);
    setInquiries(StorageService.getInquiries());
    setActivityLogs(StorageService.getActivityLogs());
    onRefreshData();
  };

  const handleDeleteProperty = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العقار نهائياً؟')) {
      StorageService.deleteProperty(id);
      onRefreshData();
      setActivityLogs(StorageService.getActivityLogs());
    }
  };

  const handleTogglePropertyStatus = (id: string, status: Property['status']) => {
    StorageService.updatePropertyStatus(id, status);
    onRefreshData();
    setActivityLogs(StorageService.getActivityLogs());
  };

  const handleTogglePropertyFeatured = (id: string, currentFeatured: boolean) => {
    const prop = StorageService.getPropertyById(id);
    if (prop) {
      StorageService.saveProperty({
        ...prop,
        featured: !currentFeatured,
      });
      onRefreshData();
    }
  };

  const handleUpdateNeedStatus = (id: string, status: NeedRequest['status']) => {
    StorageService.updateNeedRequestStatus(id, status);
    setNeedRequests(StorageService.getNeedRequests());
  };

  const handleUpdateMessageStatus = (id: string, status: ContactMessage['status']) => {
    StorageService.updateContactMessageStatus(id, status);
    setMessages(StorageService.getContactMessages());
  };

  const handleDeleteMessage = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
      StorageService.deleteContactMessage(id);
      setMessages(StorageService.getContactMessages());
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.updateSettings(settings);
    } catch (err) {
      // Fallback
    }
    StorageService.saveSettings(settings);
    setSaveSuccess(true);
    setActivityLogs(StorageService.getActivityLogs());
    onRefreshData();
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleWhyUsChange = (index: number, field: keyof WhyUsItem, value: string) => {
    const updated = [...(settings.why_us_items || [])];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value };
      setSettings({ ...settings, why_us_items: updated });
    }
  };

  const handleResetDemoData = () => {
    if (window.confirm('هل تريد بالتأكيد إعادة تعيين كافة البيانات إلى الحالة الافتراضية الأولية؟')) {
      StorageService.resetAllData();
      onRefreshData();
      setInquiries(StorageService.getInquiries());
      setNeedRequests(StorageService.getNeedRequests());
      setMessages(StorageService.getContactMessages());
      setSettings(StorageService.getSettings());
      setActivityLogs(StorageService.getActivityLogs());
      alert('تمت استعادة كافة البيانات الافتراضية بنجاح!');
    }
  };

  // KPIs
  const totalViews = properties.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalPortfolioValue = properties.reduce((acc, p) => acc + (p.operation_type === 'sale' ? p.price : 0), 0);
  const totalInquiries = inquiries.length;
  const newInquiriesCount = inquiries.filter(i => i.status === 'new').length;
  const inProgressInquiriesCount = inquiries.filter(i => i.status === 'in_progress').length;
  const completedInquiriesCount = inquiries.filter(i => i.status === 'completed').length;
  const availablePropertiesCount = properties.filter(p => p.status === 'available').length;
  const soldOrRentedCount = properties.filter(p => p.status !== 'available').length;
  const featuredCount = properties.filter(p => p.featured).length;

  // Category Breakdown Calculations
  const categoryCounts: Record<PropertyType, number> = {
    apartment: properties.filter(p => p.property_type === 'apartment').length,
    villa: properties.filter(p => p.property_type === 'villa').length,
    duplex: properties.filter(p => p.property_type === 'duplex').length,
    shop: properties.filter(p => p.property_type === 'shop').length,
    land: properties.filter(p => p.property_type === 'land').length,
    office: properties.filter(p => p.property_type === 'office').length,
    penthouse: properties.filter(p => p.property_type === 'penthouse').length,
    chalet: properties.filter(p => p.property_type === 'chalet').length,
    studio: properties.filter(p => p.property_type === 'studio').length,
    building: properties.filter(p => p.property_type === 'building').length,
  };

  const categoryNames: Record<PropertyType, string> = {
    apartment: 'شقق سكنية',
    villa: 'فيلات مستقلة',
    duplex: 'دوبلكس',
    shop: 'محلات تجارية',
    land: 'أراضي',
    office: 'مكاتب إدارية',
    penthouse: 'بنتهاوس',
    chalet: 'شاليهات مصيفية',
    studio: 'استوديو وغرف',
    building: 'عمارات ومباني كاملة',
  };

  // Filtered lists
  const filteredInquiries = inquiries.filter(i => {
    const matchesFilter = inquiryFilter === 'all' || i.status === inquiryFilter;
    if (!inquirySearch.trim()) return matchesFilter;
    const q = inquirySearch.toLowerCase();
    return (
      matchesFilter && (
        i.client_name.toLowerCase().includes(q) ||
        i.client_phone.includes(q) ||
        i.property_ref.toLowerCase().includes(q) ||
        i.property_title.toLowerCase().includes(q)
      )
    );
  });

  const filteredProperties = properties.filter(p => {
    const matchesOp = propertyOpFilter === 'all' || p.operation_type === propertyOpFilter;
    const matchesStatus = propertyStatusFilter === 'all' || p.status === propertyStatusFilter;
    const matchesType = propertyTypeFilter === 'all' || p.property_type === propertyTypeFilter;
    if (!propertySearch.trim()) return matchesOp && matchesStatus && matchesType;
    const q = propertySearch.toLowerCase();
    return (
      matchesOp &&
      matchesStatus &&
      matchesType && (
        p.title.toLowerCase().includes(q) ||
        p.ref_id.toLowerCase().includes(q) ||
        p.district_name.toLowerCase().includes(q)
      )
    );
  });

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* ---------------- SECTION 1: TOP AREA / WELCOME BANNER ---------------- */}
      <div className="bg-[#0F172A] text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-[#8D6A28]/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center text-white shadow-lg shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black">
                مرحباً بك في لوحة تحكم سكني
              </h1>
              <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                النظام نشط وموثق
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              إدارة العقارات، متابعة طلبات الحجز والمعاينة في دمياط الجديدة، والتحكم بمحتوى الموقع بالكامل
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          <button
            onClick={onOpenAddProperty}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة عقار جديد</span>
          </button>

          <Link
            to="/"
            target="_blank"
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Globe className="w-4 h-4 text-[#D6A94E]" />
            <span className="hidden sm:inline">معاينة الموقع</span>
          </Link>
        </div>
      </div>

      {/* ---------------- TAB NAVIGATION BAR ---------------- */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
        {[
          { id: 'overview', label: 'الرئيسية', icon: LayoutDashboard },
          { id: 'properties', label: `إدارة العقارات (${properties.length})`, icon: Building2 },
          { id: 'categories', label: 'إدارة الأقسام', icon: Layers },
          { id: 'locations', label: `إدارة الأماكن (${districts.length})`, icon: MapPin },
          { id: 'tags', label: 'إدارة التاجات', icon: Tag },
          { id: 'amenities', label: 'إدارة المميزات', icon: Sparkles },
          { id: 'inquiries', label: `طلبات الحجز (${inquiries.length})`, icon: CalendarCheck, badge: newInquiriesCount > 0 ? `${newInquiriesCount} جديد` : null },
          { id: 'needs', label: `طلبات العملاء (${needRequests.length})`, icon: HelpCircle },
          { id: 'messages', label: `رسائل التواصل (${messages.length})`, icon: Mail },
          { id: 'analytics', label: 'الإحصائيات', icon: BarChart3 },
          { id: 'cms', label: 'محتوى الموقع (CMS)', icon: Globe },
          { id: 'settings', label: 'الإعدادات', icon: Settings },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = currentTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#8D6A28] text-white shadow-sm'
                  : 'text-slate-600 bg-white hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
              {t.badge && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* ---------------- TAB 1: OVERVIEW (ORIGINAL STRUCTURE PRESERVED) --------- */}
      {/* ========================================================================= */}
      {currentTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Welcome Area Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-relaxed">
                مرحباً بك في لوحة التحكم 👋
              </h2>
              <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">
                إليك ملخص سريع وشامل لحالة العقارات والزوار والنشاط اليومي.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                آخر تحديث: {new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* 1. PRIMARY STATISTICS CARDS (5 Cards: عدد العقارات، طلبات الحجز، الأقسام، الأماكن، إجمالي المشاهدات) */}
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              
              {/* Card 1: عدد العقارات */}
              <div 
                onClick={() => setTab('properties')}
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
                onClick={() => setTab('inquiries')}
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
                  <span className="text-2xl font-black text-slate-900">{totalInquiries}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {completedInquiriesCount} معاينات مكتملة
                </div>
              </div>

              {/* Card 3: الأقسام */}
              <div 
                onClick={() => setTab('categories')}
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
                onClick={() => setTab('locations')}
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
                onClick={() => setTab('analytics')}
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

          {/* 2. VISITOR STATISTICS CARDS (4 Cards: زوار اليوم، زوار الشهر، إجمالي الزيارات، الزوار الأصليون) */}
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

          {/* 3. RECENT DATA (أحدث العقارات & أحدث الحجوزات جنبًا إلى جنب على الديسكتوب) */}
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
                  onClick={() => setTab('properties')}
                  className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <span>عرض الكل ({properties.length})</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 flex-1">
                {properties.slice(0, 5).map((prop) => (
                  <div key={prop.id} className="p-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={resolveImageUrl(prop.images[0])} 
                        alt={prop.title}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" 
                        onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
                      />
                      <div className="min-w-0">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 block truncate">{prop.title}</span>
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
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        prop.status === 'available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : prop.status === 'sold'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {prop.status === 'available' ? 'متاح' : prop.status === 'sold' ? 'مباع' : 'محجوز'}
                      </span>
                      <button
                        onClick={() => onSelectProperty(prop)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        title="معاينة العقار"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
                  onClick={() => setTab('inquiries')}
                  className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <span>عرض الكل ({inquiries.length})</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

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
                      <a
                        href={`https://wa.me/${inq.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً ${inq.client_name}، نتواصل معك من منصة سكني بخصوص طلب معاينة العقار كود ${inq.property_ref}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition"
                        title="واتساب سريع"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 4. CHARTS: MONTHLY STATISTICS & CATEGORY DISTRIBUTION */}
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

            {/* Category Distribution Chart (5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-600" />
                    <h3 className="text-base font-extrabold text-slate-900">توزيع الأقسام (Category Distribution)</h3>
                  </div>
                  <p className="text-xs text-slate-500">نسبة انتشار العقارات حسب نوع العقار</p>
                </div>
                <span className="text-xs font-black text-[#8D6A28] bg-amber-50 px-2.5 py-1 rounded-xl">
                  {properties.length} إجمالي
                </span>
              </div>

              {/* Progress Distribution List */}
              <div className="space-y-3 pt-1">
                {(['apartment', 'villa', 'duplex', 'shop', 'office', 'chalet'] as PropertyType[]).map((type) => {
                  const count = categoryCounts[type] || 0;
                  const percent = properties.length > 0 ? Math.round((count / properties.length) * 100) : 0;

                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-700">{categoryNames[type]}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 font-extrabold">{count} عقار</span>
                          <span className="text-slate-400 text-[11px] font-mono">({percent}%)</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#8D6A28] to-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* 5. DAILY VISITORS BREAKDOWN (الزوار اليوميون) */}
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
                  {visitorStats.daily_breakdown.map((row, idx) => (
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
                        {(row.views / row.visitors).toFixed(1)} صفحة/زائر
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. LIVE ACTIVITY FEED */}
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

        </div>
      )}

      {/* ========================================================================= */}
      {/* ---------------- TAB 2: PROPERTIES MANAGEMENT ---------------------------- */}
      {/* ========================================================================= */}
      {currentTab === 'properties' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6 animate-fade-in">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-black text-slate-900">إدارة العقارات والوحدات</h2>
              <p className="text-xs text-slate-500">عرض، تصفية، تعديل حالة، وحذف العقارات في دمياط الجديدة</p>
            </div>
            <button
              onClick={onOpenAddProperty}
              className="px-4 py-2.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عقار جديد</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="بحث بالعنوان، الكود، الحي..."
                value={propertySearch}
                onChange={(e) => setPropertySearch(e.target.value)}
                className="w-full pl-3 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:bg-white focus:border-[#8D6A28] outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>

            <select
              value={propertyOpFilter}
              onChange={(e) => setPropertyOpFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none"
            >
              <option value="all">كافة العمليات (بيع وإيجار)</option>
              <option value="sale">عقارات للبيع فقط</option>
              <option value="rent">عقارات للإيجار فقط</option>
            </select>

            <select
              value={propertyStatusFilter}
              onChange={(e) => setPropertyStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none"
            >
              <option value="all">كافة الحالات</option>
              <option value="available">متاح للعرض</option>
              <option value="reserved">محجوز</option>
              <option value="sold">تم البيع / التأجير</option>
            </select>

            <select
              value={propertyTypeFilter}
              onChange={(e) => setPropertyTypeFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none"
            >
              <option value="all">كافة أنواع العقارات</option>
              <option value="apartment">شقق سكنية</option>
              <option value="villa">فيلات</option>
              <option value="duplex">دوبلكس</option>
              <option value="shop">محلات تجارية</option>
              <option value="land">أراضي</option>
              <option value="office">مكاتب</option>
              <option value="chalet">شاليهات</option>
            </select>
          </div>

          {/* Desktop Properties Table */}
          <div className="hidden md:block overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-4">العقار</th>
                  <th className="p-4">الكود</th>
                  <th className="p-4">المنطقة</th>
                  <th className="p-4">العملية</th>
                  <th className="p-4">السعر</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">مميز</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProperties.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={resolveImageUrl(prop.images[0])} 
                          alt={prop.title}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" 
                          onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
                        />
                        <div className="min-w-0">
                          <span className="font-extrabold text-slate-900 block truncate max-w-xs">{prop.title}</span>
                          <span className="text-[11px] text-slate-400">{prop.area} م² • {prop.rooms} غرف • {categoryNames[prop.property_type]}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-[#8D6A28]">
                      {prop.ref_id}
                    </td>
                    <td className="p-4 text-slate-600">
                      {prop.district_name}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        prop.operation_type === 'sale' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {prop.operation_type === 'sale' ? 'بيع' : 'إيجار'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {formatPrice(prop.price)} ج.م
                    </td>
                    <td className="p-4">
                      <select
                        value={prop.status}
                        onChange={(e) => handleTogglePropertyStatus(prop.id, e.target.value as any)}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none cursor-pointer"
                      >
                        <option value="available">متاح</option>
                        <option value="reserved">محجوز</option>
                        <option value="sold">تم البيع</option>
                        <option value="rented">تم التأجير</option>
                      </select>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleTogglePropertyFeatured(prop.id, prop.featured)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          prop.featured ? 'bg-amber-100 text-[#8D6A28]' : 'bg-slate-100 text-slate-400 hover:text-amber-600'
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectProperty(prop)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                          title="عرض تفاصيل العقار"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProperty(prop.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                          title="حذف العقار"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Properties Cards (Screen < md) */}
          <div className="md:hidden space-y-3">
            {filteredProperties.map((prop) => (
              <div key={prop.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <img 
                    src={resolveImageUrl(prop.images[0])} 
                    alt={prop.title} 
                    className="w-16 h-16 rounded-xl object-cover border border-slate-100 shrink-0" 
                    onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-xs font-bold text-[#8D6A28]">{prop.ref_id}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${prop.operation_type === 'sale' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                        {prop.operation_type === 'sale' ? 'بيع' : 'إيجار'}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 truncate mt-0.5">{prop.title}</h4>
                    <p className="text-xs text-slate-500">{prop.district_name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="font-black text-slate-900">{formatPrice(prop.price)} ج.م</span>
                  <select
                    value={prop.status}
                    onChange={(e) => handleTogglePropertyStatus(prop.id, e.target.value as any)}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                  >
                    <option value="available">متاح</option>
                    <option value="reserved">محجوز</option>
                    <option value="sold">تم البيع</option>
                    <option value="rented">تم التأجير</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleTogglePropertyFeatured(prop.id, prop.featured)}
                    className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 ${
                      prop.featured ? 'bg-amber-100 text-[#8D6A28]' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{prop.featured ? 'مميز' : 'عادي'}</span>
                  </button>
                  <button
                    onClick={() => onSelectProperty(prop)}
                    className="flex-1 py-2 px-3 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>التفاصيل</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProperty(prop.id)}
                    className="py-2 px-3 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* ---------------- TAB 3: RESERVATIONS & INQUIRIES ------------------------- */}
      {/* ========================================================================= */}
      {currentTab === 'inquiries' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6 animate-fade-in">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-black text-slate-900">إدارة الحجوزات وطلبات المعاينة</h2>
              <p className="text-xs text-slate-500">قاعدة حجز واحد نشط لكل عميل مفعلة تلقائياً ومحمية برمجياً لمنع التكرار</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-50 text-[#8D6A28] text-xs font-black rounded-xl border border-amber-200">
                {inquiries.length} إجمالي الطلبات
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="بحث بالاسم، رقم الهاتف، كود العقار..."
                value={inquirySearch}
                onChange={(e) => setInquirySearch(e.target.value)}
                className="w-full pl-3 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:bg-white focus:border-[#8D6A28] outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>

            <select
              value={inquiryFilter}
              onChange={(e) => setInquiryFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none"
            >
              <option value="all">كافة الحالات</option>
              <option value="new">طلبات جديدة</option>
              <option value="in_progress">قيد المتابعة</option>
              <option value="completed">تمت المعاينة بنجاح</option>
              <option value="cancelled">ملغية</option>
            </select>
          </div>

          {/* Desktop Inquiries Table */}
          <div className="hidden md:block overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-4">اسم العميل</th>
                  <th className="p-4">الهاتف</th>
                  <th className="p-4">العقار</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">ملاحظات العميل</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredInquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-bold text-slate-900">{inq.client_name}</td>
                    <td className="p-4 font-mono text-slate-700" dir="ltr">{inq.client_phone}</td>
                    <td className="p-4">
                      <div>
                        <span className="font-extrabold text-slate-800 block truncate max-w-xs">{inq.property_title}</span>
                        <span className="text-[10px] font-mono text-[#8D6A28] font-bold">كود: {inq.property_ref}</span>
                        {inq.room_name && (
                          <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded mr-1">
                            ({inq.room_name})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-500" dir="ltr">
                      {new Date(inq.created_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="p-4 text-slate-600 max-w-xs truncate">
                      {inq.message || inq.notes || '—'}
                    </td>
                    <td className="p-4">
                      <select
                        value={inq.status}
                        onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value as any)}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-[#8D6A28] cursor-pointer"
                      >
                        <option value="new">طلب جديد</option>
                        <option value="in_progress">قيد المتابعة</option>
                        <option value="completed">تم بنجاح</option>
                        <option value="cancelled">إلغاء</option>
                      </select>
                    </td>
                    <td className="p-4 text-center">
                      <a
                        href={`https://wa.me/${inq.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً ${inq.client_name}، نتواصل معك من منصة سكني بخصوص طلب معاينة العقار كود ${inq.property_ref}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>واتساب</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Inquiries Cards (Screen < md) */}
          <div className="md:hidden space-y-3">
            {filteredInquiries.map((inq) => (
              <div key={inq.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-sm text-slate-900 block">{inq.client_name}</span>
                    <span className="text-xs font-mono text-slate-500" dir="ltr">{inq.client_phone}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(inq.created_at).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>{inq.property_title}</span>
                    <span className="font-mono text-[#8D6A28]">كود: {inq.property_ref}</span>
                  </div>
                  {inq.room_name && (
                    <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded inline-block">
                      غرفة: {inq.room_name}
                    </span>
                  )}
                  {inq.message && <p className="text-[11px] text-slate-600 italic">"{inq.message}"</p>}
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <select
                    value={inq.status}
                    onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value as any)}
                    className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex-1 cursor-pointer"
                  >
                    <option value="new">طلب جديد</option>
                    <option value="in_progress">قيد المتابعة</option>
                    <option value="completed">تم بنجاح</option>
                    <option value="cancelled">إلغاء</option>
                  </select>
                  <a
                    href={`https://wa.me/${inq.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً ${inq.client_name}، نتواصل معك من منصة سكني بخصوص طلب معاينة العقار كود ${inq.property_ref}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>واتساب</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* ---------------- TAB 4: CLIENT NEED REQUESTS ---------------------------- */}
      {/* ========================================================================= */}
      {currentTab === 'needs' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-black text-slate-900">طلبات البحث والعقارات الخاصة (Need Requests)</h2>
              <p className="text-xs text-slate-500">الطلبات المرسلة من نموذج "عايز شقة بمواصفات خاصة"</p>
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-black rounded-xl">
              {needRequests.length} طلب
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {needRequests.map((need) => (
              <div key={need.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">{need.client_name}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    need.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {need.status === 'pending' ? 'قيد البحث' : 'تم التواصل'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">النوع:</span>
                    <span className="font-bold">{need.listing_type === 'buy' ? 'شراء' : 'إيجار'} • {need.property_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">المنطقة المطلوبة:</span>
                    <span className="font-bold">{need.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">الميزانية:</span>
                    <span className="font-bold text-[#8D6A28]">{formatPrice(need.budget)} ج.م</span>
                  </div>
                  {need.notes && (
                    <div className="pt-1 text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-100">
                      "{need.notes}"
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                  <a
                    href={`https://wa.me/${need.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً ${need.client_name}، نتواصل معك من منصة سكني بخصوص طلبك لعقار في منطقة ${need.location}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>تواصل واتساب</span>
                  </a>

                  <button
                    onClick={() => handleUpdateNeedStatus(need.id, need.status === 'pending' ? 'contacted' : 'pending')}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
                  >
                    {need.status === 'pending' ? 'تحديد كـ تم' : 'إعادة قيد البحث'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ---------------- TAB 5: CONTACT MESSAGES --------------------------------- */}
      {/* ========================================================================= */}
      {currentTab === 'messages' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-black text-slate-900">رسائل التواصل والاستفسارات</h2>
              <p className="text-xs text-slate-500">الرسائل الواردة من صفحة اتصل بنا</p>
            </div>
            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-black rounded-xl">
              {messages.length} رسالة
            </span>
          </div>

          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#8D6A28] text-white flex items-center justify-center font-bold text-xs">
                      {msg.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-extrabold text-sm text-slate-900 block">{msg.name}</span>
                      <span className="text-xs text-slate-400 font-mono" dir="ltr">{msg.phone} {msg.email && `• ${msg.email}`}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono" dir="ltr">
                      {new Date(msg.created_at).toLocaleDateString('ar-EG')}
                    </span>
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                      title="حذف الرسالة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  {msg.subject && <div className="font-extrabold text-slate-900 mb-1">{msg.subject}</div>}
                  {msg.message}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <select
                    value={msg.status}
                    onChange={(e) => handleUpdateMessageStatus(msg.id, e.target.value as any)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="new">رسالة جديدة</option>
                    <option value="read">تمت القراءة</option>
                    <option value="replied">تم الرد</option>
                  </select>

                  <a
                    href={`https://wa.me/${msg.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً ${msg.name}، نتواصل معك من منصة سكني بخصوص رسالتك إلينا`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>رد عبر واتساب</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ---------------- TAB 6: LOCATIONS & DISTRICTS ---------------------------- */}
      {/* ========================================================================= */}
      {currentTab === 'locations' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-black text-slate-900">الأماكن والمناطق في دمياط الجديدة</h2>
              <p className="text-xs text-slate-500">قائمة الأحياء والمناطق المغطاة مع عدد العقارات المعروضة</p>
            </div>
            <span className="px-3 py-1 bg-amber-50 text-[#8D6A28] text-xs font-black rounded-xl border border-amber-200">
              {districts.length} أحياء رئيسية
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {districts.map((d) => {
              const count = properties.filter(p => p.location_id === d.id).length;
              return (
                <div key={d.id} className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs group">
                  <div className="h-36 relative overflow-hidden">
                    <img 
                      src={resolveImageUrl(d.image_url)} 
                      alt={d.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                      onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-white">
                      <span className="font-extrabold text-sm">{d.name}</span>
                      <span className="bg-[#8D6A28] text-[10px] font-black px-2 py-0.5 rounded-md">
                        {count} عقار حالياً
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-xs text-slate-600 leading-relaxed">{d.description}</p>
                    {d.coordinates && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono" dir="ltr">
                        <MapPin className="w-3 h-3 text-[#8D6A28]" />
                        <span>Lat: {d.coordinates.lat.toFixed(4)}, Lng: {d.coordinates.lng.toFixed(4)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ---------------- TAB 7: CATEGORIES & PROPERTY TYPES --------------------- */}
      {/* ========================================================================= */}
      {currentTab === 'categories' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-black text-slate-900">الأقسام وأنواع العقارات</h2>
              <p className="text-xs text-slate-500">التصنيفات المعتمدة للعقارات على المنصة ونسب التوزيع</p>
            </div>
            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-black rounded-xl">
              9 تصنيفات رئيسية
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(categoryNames) as PropertyType[]).map((type) => {
              const count = categoryCounts[type] || 0;
              const percent = properties.length > 0 ? Math.round((count / properties.length) * 100) : 0;
              return (
                <div key={type} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                        <Layers className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-sm text-slate-900">{categoryNames[type]}</span>
                    </div>
                    <span className="font-black text-base text-[#8D6A28]">{count}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>حصة السوق</span>
                      <span className="font-bold font-mono">{percent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#8D6A28] rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ---------------- TAB 8: AMENITIES & TAGS -------------------------------- */}
      {/* ========================================================================= */}
      {currentTab === 'amenities' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6 animate-fade-in">
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-lg font-black text-slate-900">المميزات والمرافق والوسوم (Amenities & Tags)</h2>
            <p className="text-xs text-slate-500">المواصفات والخدمات المعتمدة لإدراجها وتصفيتها في إعلانات العقارات</p>
          </div>

          <div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">المرافق والمميزات المعتمدة ({AMENITIES_LIST.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {AMENITIES_LIST.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#8D6A28] shrink-0" />
                  <span className="text-xs font-bold text-slate-800">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">الكلمات الدلالية والوسوم الشائعة (Tags)</h3>
            <div className="flex flex-wrap gap-2">
              {['تشطيب سوبر لوكس', 'فيو حديقة', 'موقع مميز', 'قريب من البحر', 'سكن مصر', 'شارع رئيسي', 'استثمار ناجح', 'تقسيط مريح', 'استلام فوري', 'مكيف'].map((tag, idx) => (
                <span key={idx} className="px-3 py-1 rounded-xl bg-amber-50 text-[#8D6A28] border border-amber-200 text-xs font-bold flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ---------------- TAB 9: DETAILED ANALYTICS ------------------------------ */}
      {/* ========================================================================= */}
      {currentTab === 'analytics' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-black text-slate-900">التقارير والإحصائيات التفصيلية</h2>
              <p className="text-xs text-slate-500">تحليل سجلات الزوار، الأجهزة، والصفحات الأكثر تفاعلاً</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded-xl">
              سجل الزوار المباشر
            </span>
          </div>

          {/* Visitor Log Stream */}
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3.5">عنوان IP (Masked)</th>
                  <th className="p-3.5">الصفحة التي تمت زيارتها</th>
                  <th className="p-3.5">نوع الجهاز</th>
                  <th className="p-3.5">المتصفح</th>
                  <th className="p-3.5">المدينة</th>
                  <th className="p-3.5 text-left">الوقت والتاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium font-mono">
                {visitorLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="p-3.5 text-slate-800 font-bold">{log.ip_masked}</td>
                    <td className="p-3.5 text-[#8D6A28] font-bold">{log.page_visited}</td>
                    <td className="p-3.5 text-slate-600 font-sans">{log.device}</td>
                    <td className="p-3.5 text-slate-600 font-sans">{log.browser}</td>
                    <td className="p-3.5 text-slate-700 font-sans">{log.city}</td>
                    <td className="p-3.5 text-left text-slate-400" dir="ltr">
                      {new Date(log.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString('ar-EG')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ---------------- TAB 10: WEBSITE CONTENT (CMS) --------------------------- */}
      {/* ========================================================================= */}
      {currentTab === 'cms' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6 animate-fade-in">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#8D6A28]" />
                <h2 className="text-lg font-black text-slate-900">إدارة محتوى الموقع العام (Website CMS)</h2>
              </div>
              <p className="text-xs text-slate-500">التحكم في فيديو وصور الهيرو، النصوص الإعلانية، مميزات سكني، ومعلومات الاتصال</p>
            </div>
            {saveSuccess && (
              <div className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-black rounded-xl flex items-center gap-1.5 animate-bounce">
                <Check className="w-4 h-4" />
                <span>تم حفظ التعديلات ونشرها بنجاح!</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-8">
            
            {/* 1. HOME HERO MANAGEMENT */}
            <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b border-amber-200/60 pb-2">
                <Video className="w-4 h-4 text-[#8D6A28]" />
                <span>إعدادات وفيديو واجهة الموقع الرئيسية (Home Hero)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">العنوان الرئيسي للهيرو (Hero Title)</label>
                  <input
                    type="text"
                    value={settings.hero_title}
                    onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-[#8D6A28] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الشعار العلوي (Hero Tagline)</label>
                  <input
                    type="text"
                    value={settings.hero_tagline}
                    onChange={(e) => setSettings({ ...settings, hero_tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-[#8D6A28] outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">الوصف الفرعي (Hero Subtitle)</label>
                  <textarea
                    rows={2}
                    value={settings.hero_subtitle}
                    onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-[#8D6A28] outline-none"
                  />
                </div>

                {/* Hero Video URL */}
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    رابط فيديو خلفية الهيرو المباشر (Hero Video URL - .mp4)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={settings.hero_video_url}
                      onChange={(e) => {
                        setSettings({ ...settings, hero_video_url: e.target.value });
                        setPreviewVideoUrl(e.target.value);
                      }}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-[#8D6A28] outline-none font-mono"
                      placeholder="https://assets.mixkit.co/videos/preview/..."
                    />
                    <label className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.hero_use_video}
                        onChange={(e) => setSettings({ ...settings, hero_use_video: e.target.checked })}
                        className="rounded text-[#8D6A28] focus:ring-[#8D6A28]"
                      />
                      <span>تفعيل خلفية الفيديو</span>
                    </label>
                  </div>

                  {/* Video Live Preview Box in Admin */}
                  {settings.hero_video_url && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 block">معاينة فيديو الهيرو الحالي:</span>
                      <div className="w-full max-w-md h-36 rounded-lg overflow-hidden bg-black">
                        <video
                          src={settings.hero_video_url}
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">صورة الخلفية الاحتياطية (Hero Image Fallback)</label>
                  <input
                    type="url"
                    value={settings.hero_bg_image}
                    onChange={(e) => setSettings({ ...settings, hero_bg_image: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-[#8D6A28] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نص زر الإجراء (Hero CTA Button)</label>
                  <input
                    type="text"
                    value={settings.hero_cta_text || 'بحث عن العقار المناسب'}
                    onChange={(e) => setSettings({ ...settings, hero_cta_text: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-[#8D6A28] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. ANNOUNCEMENT BAR & PROMOTIONS */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                  <BellRing className="w-4 h-4 text-purple-600" />
                  <span>الشريط الإعلاني العلوي (Announcement Bar)</span>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.announcement_enabled}
                    onChange={(e) => setSettings({ ...settings, announcement_enabled: e.target.checked })}
                    className="rounded text-[#8D6A28] focus:ring-[#8D6A28]"
                  />
                  <span>إظهار الشريط الإعلاني</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">نص الإعلان أو العرض الخاص</label>
                  <input
                    type="text"
                    value={settings.announcement_text}
                    onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-[#8D6A28] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رابط الإعلان (اختياري)</label>
                  <input
                    type="text"
                    value={settings.announcement_link || '#'}
                    onChange={(e) => setSettings({ ...settings, announcement_link: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-[#8D6A28] outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 3. WHY US ITEMS (3 PILLARS) */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b border-slate-200/80 pb-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>مميزات سكني (لماذا تختار منصة سكني؟)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(settings.why_us_items || []).map((item, index) => (
                  <div key={item.id} className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                    <span className="text-xs font-black text-[#8D6A28] block">الميزة {index + 1}</span>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleWhyUsChange(index, 'title', e.target.value)}
                      placeholder="عنوان الميزة"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold focus:border-[#8D6A28] outline-none"
                    />
                    <textarea
                      rows={3}
                      value={item.description}
                      onChange={(e) => handleWhyUsChange(index, 'description', e.target.value)}
                      placeholder="شرح وتفاصيل الميزة"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:border-[#8D6A28] outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 4. CONTACT & GLOBAL SITE INFO */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b border-slate-200/80 pb-2">
                <Phone className="w-4 h-4 text-[#8D6A28]" />
                <span>بيانات الاتصال ومواقع التواصل (Global Contact & Socials)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف للاتصال المباشر</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-[#8D6A28] outline-none font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الواتساب مع كود الدولة</label>
                  <input
                    type="text"
                    value={settings.whatsapp}
                    onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-[#8D6A28] outline-none font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني الرسمي</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-[#8D6A28] outline-none font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رابط فيسبوك (Facebook URL)</label>
                  <input
                    type="url"
                    value={settings.facebook_url || ''}
                    onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-[#8D6A28] outline-none font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رابط إنستغرام (Instagram URL)</label>
                  <input
                    type="url"
                    value={settings.instagram_url || ''}
                    onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-[#8D6A28] outline-none font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رابط تيك توك (TikTok URL)</label>
                  <input
                    type="url"
                    value={settings.tiktok_url || ''}
                    onChange={(e) => setSettings({ ...settings, tiktok_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-[#8D6A28] outline-none font-mono"
                    dir="ltr"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">نسبة عمولة سكني المقدرة (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.commission_percentage !== undefined ? settings.commission_percentage : 2.5}
                      onChange={(e) => {
                        const val = e.target.value;
                        const numRate = parseFloat(val) || 0;
                        setSettings(prev => {
                          const currentText = prev.commission_text || `عمولة الوساطة ${numRate}% تدفع عند إتمام التعاقد فقط، والمعاينة مجانية تماماً`;
                          const updatedText = /\d+(\.\d+)?%/.test(currentText)
                            ? currentText.replace(/\d+(\.\d+)?%/, `${numRate}%`)
                            : `${currentText} (${numRate}%)`;
                          return {
                            ...prev,
                            commission_percentage: val === '' ? ('' as any) : numRate,
                            commission_text: updatedText
                          };
                        });
                      }}
                      placeholder="2.5"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-[#8D6A28] outline-none"
                    />
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                  </div>
                </div>

                <div className="sm:col-span-1 lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">نص العمولة والتسويق العقاري</label>
                  <input
                    type="text"
                    value={settings.commission_text}
                    onChange={(e) => setSettings({ ...settings, commission_text: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-[#8D6A28] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="px-8 py-3.5 rounded-2xl gold-gradient gold-gradient-hover text-white font-black text-sm shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-5 h-5" />
                <span>حفظ وتطبيق تغييرات الموقع</span>
              </button>
            </div>

          </form>

        </div>
      )}

      {/* ========================================================================= */}
      {/* ---------------- TAB 11: GENERAL SETTINGS ------------------------------- */}
      {/* ========================================================================= */}
      {currentTab === 'settings' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6 animate-fade-in">
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-lg font-black text-slate-900">إعدادات النظام العامة</h2>
            <p className="text-xs text-slate-500">إدارة الإشعارات وإعادة تعيين البيانات التجريبية</p>
          </div>

          <div className="space-y-6 max-w-2xl">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-sm text-slate-900 block">إشعارات النظام الفورية</span>
                <span className="text-xs text-slate-500">تلقي تنبيهات عند ورود طلبات حجز جديدة</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications_enabled}
                  onChange={(e) => {
                    const upd = { ...settings, notifications_enabled: e.target.checked };
                    setSettings(upd);
                    StorageService.saveSettings(upd);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8D6A28]"></div>
              </label>
            </div>

            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>إعادة تعيين البيانات التجريبية (Demo Reset)</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                استعادة قاعدة البيانات المبدئية للعقارات والحجوزات والأماكن والمناطق وإلغاء أي تعديلات تجريبية.
              </p>
              <button
                onClick={handleResetDemoData}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة البيانات الافتراضية الأصلية</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
