import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property, PropertyType, OperationType } from '../../types';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { AdminRoomManagementModal } from '../../components/AdminRoomManagementModal';
import { AdminOfferModal } from '../../components/AdminOfferModal';
import { evaluatePropertyOffer } from '../../utils/offerUtils';
import { DashboardTableSkeleton, ModernStateFeedback } from '../../components/Skeletons';
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  SlidersHorizontal,
  MapPin,
  Maximize2,
  BedDouble,
  Bath,
  DoorOpen,
  Pencil,
  ExternalLink,
  Flame,
  Tag,
  MoreVertical,
  Star,
  CloudUpload,
  Loader2
} from 'lucide-react';

interface AdminPropertiesPageProps {
  onOpenAddProperty?: () => void;
}

export const AdminPropertiesPage: React.FC<AdminPropertiesPageProps> = ({ onOpenAddProperty }) => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [districts, setDistricts] = useState(StorageService.getDistricts());
  const [selectedPropertyForRooms, setSelectedPropertyForRooms] = useState<Property | null>(null);
  const [selectedPropertyForOffer, setSelectedPropertyForOffer] = useState<Property | null>(null);
  const [openActionDropdownId, setOpenActionDropdownId] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterOperation, setFilterOperation] = useState<'all' | OperationType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | Property['status']>('all');
  const [filterOffer, setFilterOffer] = useState<'all' | 'active_offers' | 'expired_offers' | 'no_offers'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Immediate fallback render
    setProperties(StorageService.getProperties());
    setDistricts(StorageService.getDistricts());

    // Fetch from backend API
    try {
      const apiProps = await ApiService.getProperties({ all_statuses: 1 });
      if (Array.isArray(apiProps) && apiProps.length > 0) {
        const mapped: Property[] = apiProps.map((p: any) => ({
          id: String(p.id),
          ref_id: p.ref_id || `SK-${p.id}`,
          title: p.title,
          description: p.description || '',
          price: Number(p.price) || 0,
          is_negotiable: Boolean(p.is_negotiable),
          has_offer: Boolean(p.has_offer),
          offer_price: p.offer_price ? Number(p.offer_price) : undefined,
          offer_discount_percentage: p.offer_discount_percentage ? Number(p.offer_discount_percentage) : undefined,
          offer_start_date: p.offer_start_date || undefined,
          offer_end_date: p.offer_end_date || undefined,
          offer_title: p.offer_title || undefined,
          offer_badge: p.offer_badge || undefined,
          rent_duration: p.rent_duration || 'monthly',
          operation_type: p.category?.slug === 'rent' || p.operation_type === 'rent' ? 'rent' : 'sale',
          property_type: p.property_type?.slug || p.property_type || 'apartment',
          location_id: String(p.location_id || p.location?.id || ''),
          district_name: p.location?.name || 'دمياط الجديدة',
          area: Number(p.area) || 0,
          rooms: Number(p.rooms) || 0,
          bathrooms: Number(p.bathrooms) || 0,
          floor: Number(p.floor) || 0,
          balconies: Number(p.balconies) || 1,
          finishing: p.finishing || 'super_lux',
          furnishing: p.furnishing || 'unfurnished',
          audience_type: p.audience_type || 'families',
          images: p.images?.map((img: any) => img.image_url) || (p.image_url ? [p.image_url] : []),
          video_url: p.video_url || '',
          video_thumbnail_url: p.video_thumbnail_url || '',
          status: p.status || 'available',
          featured: Boolean(p.featured),
          is_uploading: Boolean(p.is_uploading),
          views: p.views || 0,
          amenities: p.amenities?.map((a: any) => a.slug || a.name) || [],
          has_detailed_rooms: Boolean(p.has_detailed_rooms),
          detailed_rooms: p.detailed_rooms || p.detailedRooms || [],
          latitude: p.latitude ? Number(p.latitude) : undefined,
          longitude: p.longitude ? Number(p.longitude) : undefined,
          owner_name: p.submitter_name || p.owner_name || '',
          owner_phone: p.submitter_phone || p.owner_phone || '',
          created_at: p.created_at || new Date().toISOString(),
        }));
        setProperties(mapped);
      }
    } catch (e) {}
  };

  const handleMarkUploadComplete = async (id: string) => {
    StorageService.markPropertyUploadComplete(id);
    const numId = parseInt(id.replace(/\D/g, ''), 10);
    if (numId) {
      try {
        await ApiService.markPropertyUploadComplete(numId);
      } catch {}
    }
    loadData();
  };

  const handleUpdatePropertyStatus = async (id: string, newStatus: Property['status']) => {
    // 1. Update in local storage
    StorageService.updatePropertyStatus(id, newStatus);
    
    // 2. Also try API if numeric ID
    const numId = parseInt(id.replace(/\D/g, ''), 10);
    if (numId) {
      try {
        await ApiService.updateProperty(numId, { status: newStatus });
      } catch {}
    }

    loadData();
  };

  const handleToggleFeatured = async (id: string, currentVal: boolean) => {
    const prop = StorageService.getPropertyById(id);
    if (prop) {
      StorageService.saveProperty({ ...prop, featured: !currentVal });
      
      const numId = parseInt(id.replace(/\D/g, ''), 10);
      if (numId) {
        try {
          await ApiService.updateProperty(numId, { featured: !currentVal });
        } catch {}
      }
      loadData();
    }
  };

  const handleDeleteProperty = async (id: string, title: string) => {
    if (window.confirm(`هل أنت متأكد من حذف العقار: "${title}" نهائياً من النظام؟`)) {
      StorageService.deleteProperty(id);
      
      const numId = parseInt(id.replace(/\D/g, ''), 10);
      if (numId) {
        try {
          await ApiService.deleteProperty(numId);
        } catch {}
      }
      loadData();
    }
  };

  const categoryNames: Record<PropertyType, string> = {
    apartment: 'شقة',
    villa: 'فيلا',
    duplex: 'دوبلكس',
    penthouse: 'بنتهاوس',
    chalet: 'شاليه',
    studio: 'استوديو',
    shop: 'محل تجاري',
    office: 'مكتب إداري',
    land: 'أرض',
    building: 'عمارة',
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG').format(price);
  };

  // Filter properties
  const filteredProperties = properties.filter((p) => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ref_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.district_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDistrict = filterDistrict === 'all' || p.location_id === filterDistrict || (p as any).district_id === filterDistrict;
    const matchesType = filterType === 'all' || p.property_type === filterType;
    const matchesOp = filterOperation === 'all' || p.operation_type === filterOperation;
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;

    const offerInfo = evaluatePropertyOffer(p);
    const matchesOffer =
      filterOffer === 'all' ||
      (filterOffer === 'active_offers' && offerInfo.isActive) ||
      (filterOffer === 'expired_offers' && offerInfo.status === 'expired') ||
      (filterOffer === 'no_offers' && !offerInfo.isActive && !p.has_offer);

    return matchesSearch && matchesDistrict && matchesType && matchesOp && matchesStatus && matchesOffer;
  });

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-7 h-7 text-[#8D6A28]" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed">
              إدارة العقارات والوحدات
            </h1>
          </div>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">
            عرض، تصفية، تعديل حالة، وتحديث كافة العقارات المعروضة على منصة سكني ({properties.length} عقار مسجل)
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/properties/create')}
          className="px-4 py-2.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عقار جديد</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم، كود العقار (REF)، أو المنطقة..."
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#8D6A28] focus:ring-1 focus:ring-[#8D6A28] outline-none transition"
            />
          </div>

          {/* District Filter */}
          <select
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#8D6A28]"
          >
            <option value="all">كافة المناطق</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#8D6A28]"
          >
            <option value="all">كافة الأنواع</option>
            <option value="apartment">شقق</option>
            <option value="villa">فيلات</option>
            <option value="duplex">دوبلكس</option>
            <option value="chalet">شاليهات</option>
            <option value="shop">محلات</option>
            <option value="office">مكاتب</option>
            <option value="land">أراضي</option>
          </select>

          {/* Operation Filter */}
          <select
            value={filterOperation}
            onChange={(e) => setFilterOperation(e.target.value as any)}
            className="w-full md:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#8D6A28]"
          >
            <option value="all">كافة العمليات</option>
            <option value="sale">للبيع</option>
            <option value="rent">للإيجار</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full md:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#8D6A28]"
          >
            <option value="all">كافة الحالات</option>
            <option value="available">متاح</option>
            <option value="reserved">محجوز</option>
            <option value="sold">تم البيع</option>
            <option value="rented">تم التأجير</option>
          </select>

          {/* Offer Filter */}
          <select
            value={filterOffer}
            onChange={(e) => setFilterOffer(e.target.value as any)}
            className="w-full md:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#8D6A28]"
          >
            <option value="all">كافة العروض والتخفيضات</option>
            <option value="active_offers">🔥 عروض نشطة وتخفيضات</option>
            <option value="expired_offers">عروض منتهية الصلاحية</option>
            <option value="no_offers">بدون عروض</option>
          </select>
        </div>

        {/* Active Filters Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>نتائج الفلترة: <strong className="text-slate-900">{filteredProperties.length}</strong> عقار</span>
          {(searchTerm || filterDistrict !== 'all' || filterType !== 'all' || filterOperation !== 'all' || filterStatus !== 'all' || filterOffer !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterDistrict('all');
                setFilterType('all');
                setFilterOperation('all');
                setFilterStatus('all');
                setFilterOffer('all');
              }}
              className="text-[#8D6A28] font-bold hover:underline cursor-pointer"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Properties Content: Desktop Table & Mobile Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
              <tr>
                <th className="p-4">العقار</th>
                <th className="p-4">الكود المرجعي</th>
                <th className="p-4">المنطقة</th>
                <th className="p-4 text-center">النوع / العملية</th>
                <th className="p-4">السعر</th>
                <th className="p-4 text-center">العرض الترويجي</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">المشاهدات</th>
                <th className="p-4 text-center">تحديث الحالة</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredProperties.map((prop) => (
                <tr 
                  key={prop.id} 
                  className={`transition ${
                    prop.is_uploading 
                      ? 'bg-amber-50/50 opacity-80 border-r-4 border-r-amber-500' 
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  <td 
                    className="p-4 cursor-pointer group"
                    onClick={() => navigate(`/admin/properties/show/${prop.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <img 
                          src={prop.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=200&q=80'} 
                          alt={prop.title}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200 group-hover:scale-105 transition-transform" 
                        />
                        {prop.is_uploading && (
                          <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-amber-300 animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <span className="font-extrabold text-sm text-slate-900 block truncate max-w-xs group-hover:text-[#8D6A28] transition-colors">{prop.title}</span>
                        <span className="text-[11px] text-slate-400 block">{prop.area} م² • {prop.rooms} غرف • {prop.bathrooms} حمام</span>
                        {prop.is_uploading && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                            <CloudUpload className="w-3 h-3 animate-bounce text-amber-700" />
                            <span>جاري رفع الوسائط</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkUploadComplete(prop.id);
                              }}
                              className="mr-1 px-1.5 py-0.2 rounded bg-amber-600 hover:bg-amber-700 text-white text-[9px] cursor-pointer"
                              title="اعتماد اكتمال الرفع"
                            >
                              اعتماد
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono font-bold text-[#8D6A28]">
                    {prop.ref_id}
                  </td>
                  <td className="p-4 text-slate-600 font-bold">
                    {prop.district_name}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black shadow-2xs ${
                      prop.operation_type === 'sale' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200/80' 
                        : prop.has_detailed_rooms
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                    }`}>
                      {prop.operation_type === 'sale' 
                        ? 'للبيع' 
                        : prop.has_detailed_rooms 
                        ? `إيجار بالغرف (${prop.detailed_rooms?.length || 0} غرف)` 
                        : 'إيجار بالكامل'}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900 font-mono text-sm">
                    {prop.has_detailed_rooms && prop.detailed_rooms && prop.detailed_rooms.length > 0
                      ? `يبدأ من ${formatPrice(Math.min(...prop.detailed_rooms.map(r => r.price).filter(p => p > 0)))} ج.م`
                      : `${formatPrice(prop.price)} ج.م`}
                  </td>
                  <td className="p-4 text-center">
                    {(() => {
                      const offer = evaluatePropertyOffer(prop);
                      if (offer.isActive) {
                        return (
                          <button
                            onClick={() => setSelectedPropertyForOffer(prop)}
                            className="inline-flex flex-col items-center gap-0.5 p-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-300 hover:border-amber-500 text-slate-800 transition cursor-pointer group"
                            title="تعديل العرض الترويجي"
                          >
                            <span className="flex items-center gap-1 font-black text-[10px] text-rose-700">
                              <Flame className="w-3 h-3 fill-rose-500 text-rose-500 animate-pulse" />
                              {offer.badgeText}
                            </span>
                            <span className="text-[9px] font-mono text-slate-600 font-black">
                              {formatPrice(offer.offerPrice)} ج.م
                            </span>
                            {offer.remainingText && (
                              <span className="text-[8px] font-bold text-amber-700 bg-amber-100/80 px-1 rounded">
                                {offer.remainingText}
                              </span>
                            )}
                          </button>
                        );
                      } else if (offer.status === 'upcoming') {
                        return (
                          <button
                            onClick={() => setSelectedPropertyForOffer(prop)}
                            className="px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-[10px] hover:bg-blue-100 transition cursor-pointer"
                          >
                            يبدأ قريباً
                          </button>
                        );
                      } else if (offer.status === 'expired') {
                        return (
                          <button
                            onClick={() => setSelectedPropertyForOffer(prop)}
                            className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-bold text-[10px] hover:bg-slate-200 transition cursor-pointer"
                          >
                            منتهي الصلاحية
                          </button>
                        );
                      }
                      return (
                        <button
                          onClick={() => setSelectedPropertyForOffer(prop)}
                          className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-400 hover:text-[#8D6A28] border border-dashed border-slate-300 hover:border-[#8D6A28] text-[10px] font-bold transition cursor-pointer inline-flex items-center gap-1"
                          title="إضافة عرض ترويجي وتخفيض"
                        >
                          <Plus className="w-3 h-3" />
                          <span>إضافة عرض</span>
                        </button>
                      );
                    })()}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap inline-flex items-center justify-center shrink-0 ${
                      prop.status === 'available'
                        ? 'bg-emerald-100 text-emerald-800'
                        : prop.status === 'sold'
                        ? 'bg-rose-100 text-rose-800'
                        : prop.status === 'rented'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {prop.status === 'available' ? 'متاح' : prop.status === 'sold' ? 'تم البيع' : prop.status === 'rented' ? 'تم التأجير' : 'محجوز'}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-600 text-center font-bold">
                    {prop.views || 0}
                  </td>
                  <td className="p-4 text-center">
                    <select
                      value={prop.status}
                      onChange={(e) => handleUpdatePropertyStatus(prop.id, e.target.value as Property['status'])}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#8D6A28]"
                    >
                      <option value="available">متاح</option>
                      <option value="reserved">محجوز</option>
                      <option value="sold">تم البيع</option>
                      <option value="rented">تم التأجير</option>
                    </select>
                  </td>
                  <td className="p-4 text-center relative">
                    {/* Unified Actions Dropdown */}
                    <div className="relative inline-block text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionDropdownId(openActionDropdownId === prop.id ? null : prop.id);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          openActionDropdownId === prop.id
                            ? 'bg-[#0F172A] text-white shadow-md'
                            : 'bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-[#8D6A28] border border-slate-200/80'
                        }`}
                      >
                        <span>الإجراءات</span>
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {openActionDropdownId === prop.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setOpenActionDropdownId(null)}
                          />

                          <div className="absolute left-0 mt-1 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 py-1.5 divide-y divide-slate-100 animate-in fade-in zoom-in-95 text-right">
                            <div className="p-1 space-y-0.5">
                              <button
                                onClick={() => {
                                  setOpenActionDropdownId(null);
                                  navigate(`/admin/properties/show/${prop.id}`);
                                }}
                                className="w-full px-3 py-2 text-xs font-bold text-slate-800 hover:bg-amber-50 hover:text-[#8D6A28] rounded-xl transition flex items-center gap-2 text-right cursor-pointer"
                              >
                                <Eye className="w-4 h-4 text-slate-500" />
                                <span>عرض تفاصيل العقار</span>
                              </button>

                              <button
                                onClick={() => {
                                  setOpenActionDropdownId(null);
                                  navigate(`/admin/properties/edit/${prop.id}`);
                                }}
                                className="w-full px-3 py-2 text-xs font-bold text-slate-800 hover:bg-amber-50 hover:text-[#8D6A28] rounded-xl transition flex items-center gap-2 text-right cursor-pointer"
                              >
                                <Pencil className="w-4 h-4 text-slate-500" />
                                <span>تعديل بيانات العقار</span>
                              </button>

                              <button
                                onClick={() => {
                                  setOpenActionDropdownId(null);
                                  setSelectedPropertyForOffer(prop);
                                }}
                                className="w-full px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl transition flex items-center gap-2 text-right cursor-pointer"
                              >
                                <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
                                <span>إدارة العرض الترويجي والخصم {evaluatePropertyOffer(prop).isActive ? '🔥' : ''}</span>
                              </button>

                              {prop.operation_type === 'rent' && (
                                <button
                                  onClick={() => {
                                    setOpenActionDropdownId(null);
                                    setSelectedPropertyForRooms(prop);
                                  }}
                                  className="w-full px-3 py-2 text-xs font-bold text-slate-800 hover:bg-amber-50 hover:text-[#8D6A28] rounded-xl transition flex items-center gap-2 text-right cursor-pointer"
                                >
                                  <DoorOpen className="w-4 h-4 text-slate-500" />
                                  <span>إدارة الغرف ({prop.detailed_rooms?.length || 0})</span>
                                </button>
                              )}
                            </div>

                            <div className="p-1 space-y-0.5">
                              <button
                                onClick={() => {
                                  setOpenActionDropdownId(null);
                                  window.open(`/properties/${prop.id}`, '_blank');
                                }}
                                className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition flex items-center gap-2 text-right cursor-pointer"
                              >
                                <ExternalLink className="w-4 h-4 text-slate-400" />
                                <span>معاينة صفحة العميل</span>
                              </button>

                              <button
                                onClick={() => {
                                  setOpenActionDropdownId(null);
                                  handleToggleFeatured(prop.id, prop.featured);
                                }}
                                className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition flex items-center gap-2 text-right cursor-pointer"
                              >
                                <Star className={`w-4 h-4 ${prop.featured ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                                <span>{prop.featured ? 'إلغاء التمييز' : 'تمييز العقار'}</span>
                              </button>
                            </div>

                            <div className="p-1">
                              <button
                                onClick={() => {
                                  setOpenActionDropdownId(null);
                                  handleDeleteProperty(prop.id, prop.title);
                                }}
                                className="w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-2 text-right cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 text-rose-500" />
                                <span>حذف العقار</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredProperties.map((prop) => (
            <div 
              key={prop.id} 
              className={`p-4 space-y-3 transition ${
                prop.is_uploading 
                  ? 'bg-amber-50/50 opacity-80 border-r-4 border-r-amber-500' 
                  : ''
              }`}
            >
              {prop.is_uploading && (
                <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-amber-900 bg-amber-200/90 px-2.5 py-1 rounded-lg border border-amber-300">
                  <div className="flex items-center gap-1.5">
                    <CloudUpload className="w-3.5 h-3.5 animate-bounce text-amber-700" />
                    <span>جاري رفع ومعالجة الوسائط</span>
                    <Loader2 className="w-3 h-3 animate-spin text-amber-700" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkUploadComplete(prop.id);
                    }}
                    className="px-2 py-0.5 rounded bg-amber-700 text-white text-[9px] cursor-pointer"
                  >
                    اعتماد الرفع
                  </button>
                </div>
              )}

              <div 
                className="flex items-start gap-3 cursor-pointer group"
                onClick={() => navigate(`/admin/properties/show/${prop.id}`)}
              >
                <div className="relative shrink-0">
                  <img 
                    src={prop.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=200&q=80'} 
                    alt={prop.title}
                    className="w-20 h-20 rounded-2xl object-cover border border-slate-200 group-hover:scale-105 transition-transform" 
                  />
                  {prop.is_uploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-amber-300 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#8D6A28]">{prop.ref_id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black whitespace-nowrap inline-flex items-center justify-center shrink-0 ${
                      prop.status === 'available'
                        ? 'bg-emerald-100 text-emerald-800'
                        : prop.status === 'sold'
                        ? 'bg-rose-100 text-rose-800'
                        : prop.status === 'rented'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {prop.status === 'available' ? 'متاح' : prop.status === 'sold' ? 'مباع' : prop.status === 'rented' ? 'مؤجر' : 'محجوز'}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-[#8D6A28]">{prop.title}</h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <MapPin className="w-3 h-3 text-[#8D6A28]" />
                    <span>{prop.district_name}</span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs">
                    {formatPrice(prop.price)} ج.م
                  </div>
                  {(() => {
                    const offer = evaluatePropertyOffer(prop);
                    if (offer.isActive) {
                      return (
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-extrabold text-[10px] border border-rose-200 flex items-center gap-1">
                            <Flame className="w-3 h-3 fill-rose-500 text-rose-500" />
                            {offer.badgeText} ({formatPrice(offer.offerPrice)} ج.م)
                          </span>
                          {offer.remainingText && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              {offer.remainingText}
                            </span>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Status Selector & Unified Actions Dropdown on Mobile */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500">الحالة:</span>
                  <select
                    value={prop.status}
                    onChange={(e) => handleUpdatePropertyStatus(prop.id, e.target.value as Property['status'])}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="available">متاح</option>
                    <option value="reserved">محجوز</option>
                    <option value="sold">مباع</option>
                    <option value="rented">مؤجر</option>
                  </select>
                </div>

                <div className="relative inline-block text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionDropdownId(openActionDropdownId === `mobile-${prop.id}` ? null : `mobile-${prop.id}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      openActionDropdownId === `mobile-${prop.id}`
                        ? 'bg-[#0F172A] text-white shadow-md'
                        : 'bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-[#8D6A28] border border-slate-200/80'
                    }`}
                  >
                    <span>الإجراءات</span>
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {openActionDropdownId === `mobile-${prop.id}` && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setOpenActionDropdownId(null)}
                      />

                      <div className="absolute left-0 mt-1 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 py-1.5 divide-y divide-slate-100 animate-in fade-in zoom-in-95 text-right">
                        <div className="p-1 space-y-0.5">
                          <button
                            onClick={() => {
                              setOpenActionDropdownId(null);
                              navigate(`/admin/properties/show/${prop.id}`);
                            }}
                            className="w-full px-3 py-2 text-xs font-bold text-slate-800 hover:bg-amber-50 hover:text-[#8D6A28] rounded-xl transition flex items-center gap-2 text-right cursor-pointer"
                          >
                            <Eye className="w-4 h-4 text-slate-500" />
                            <span>عرض تفاصيل العقار</span>
                          </button>

                          <button
                            onClick={() => {
                              setOpenActionDropdownId(null);
                              navigate(`/admin/properties/edit/${prop.id}`);
                            }}
                            className="w-full px-3 py-2 text-xs font-bold text-slate-800 hover:bg-amber-50 hover:text-[#8D6A28] rounded-xl transition flex items-center gap-2 text-right cursor-pointer"
                          >
                            <Pencil className="w-4 h-4 text-slate-500" />
                            <span>تعديل بيانات العقار</span>
                          </button>

                          <button
                            onClick={() => {
                              setOpenActionDropdownId(null);
                              setSelectedPropertyForOffer(prop);
                            }}
                            className="w-full px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl transition flex items-center gap-2 text-right cursor-pointer"
                          >
                            <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
                            <span>إدارة العرض والخصم {evaluatePropertyOffer(prop).isActive ? '🔥' : ''}</span>
                          </button>

                          {prop.operation_type === 'rent' && (
                            <button
                              onClick={() => {
                                setOpenActionDropdownId(null);
                                setSelectedPropertyForRooms(prop);
                              }}
                              className="w-full px-3 py-2 text-xs font-bold text-slate-800 hover:bg-amber-50 hover:text-[#8D6A28] rounded-xl transition flex items-center gap-2 text-right cursor-pointer"
                            >
                              <DoorOpen className="w-4 h-4 text-slate-500" />
                              <span>إدارة الغرف ({prop.detailed_rooms?.length || 0})</span>
                            </button>
                          )}
                        </div>

                        <div className="p-1 space-y-0.5">
                          <button
                            onClick={() => {
                              setOpenActionDropdownId(null);
                              window.open(`/properties/${prop.id}`, '_blank');
                            }}
                            className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition flex items-center gap-2 text-right cursor-pointer"
                          >
                            <ExternalLink className="w-4 h-4 text-slate-400" />
                            <span>معاينة صفحة العميل</span>
                          </button>

                          <button
                            onClick={() => {
                              setOpenActionDropdownId(null);
                              handleToggleFeatured(prop.id, prop.featured);
                            }}
                            className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition flex items-center gap-2 text-right cursor-pointer"
                          >
                            <Star className={`w-4 h-4 ${prop.featured ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                            <span>{prop.featured ? 'إلغاء التمييز' : 'تمييز العقار'}</span>
                          </button>
                        </div>

                        <div className="p-1">
                          <button
                            onClick={() => {
                              setOpenActionDropdownId(null);
                              handleDeleteProperty(prop.id, prop.title);
                            }}
                            className="w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-2 text-right cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                            <span>حذف العقار</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProperties.length === 0 && (
          <div className="p-4">
            <ModernStateFeedback
              type="empty"
              title="لا توجد عقارات مطابقة للبحث"
              description="جرب تغيير كلمات البحث أو إعادة ضبط خيارات الفلترة المحددة، أو أضف عقاراً جديداً إلى المنظومة الآن."
              actionText="إعادة ضبط جميع الفلاتر"
              onAction={() => {
                setSearchTerm('');
                setFilterDistrict('all');
                setFilterType('all');
                setFilterOperation('all');
                setFilterStatus('all');
                setFilterOffer('all');
              }}
              secondaryActionText={onOpenAddProperty ? "إضافة عقار جديد" : undefined}
              onSecondaryAction={onOpenAddProperty}
            />
          </div>
        )}

      </div>

      {/* Admin Room Management Modal */}
      <AdminRoomManagementModal
        property={selectedPropertyForRooms}
        isOpen={Boolean(selectedPropertyForRooms)}
        onClose={() => setSelectedPropertyForRooms(null)}
        onUpdated={loadData}
      />

      {/* Admin Offer Management Modal */}
      <AdminOfferModal
        property={selectedPropertyForOffer}
        isOpen={Boolean(selectedPropertyForOffer)}
        onClose={() => setSelectedPropertyForOffer(null)}
        onOfferUpdated={() => {
          loadData();
        }}
      />

    </div>
  );
};
