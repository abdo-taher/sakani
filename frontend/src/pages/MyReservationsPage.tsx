import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ApiService } from '../services/apiService';
import { StorageService } from '../services/storageService';
import { onPushNotification, PushNotificationPayload } from '../services/firebaseService';
import { resolveImageUrl, FALLBACK_PROPERTY_IMAGE } from '../utils/media';
import { SEOHead } from '../components/SEOHead';
import { 
  CalendarCheck, 
  Building2, 
  DoorOpen, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  MessageCircle, 
  ExternalLink, 
  RefreshCw, 
  Filter, 
  Search,
  Sparkles,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Eye
} from 'lucide-react';
import { ReservationCardSkeleton, ModernStateFeedback } from '../components/Skeletons';

export interface CustomerReservationItem {
  id: string | number;
  property_id: string | number;
  room_id?: string | number | null;
  is_room_reservation?: boolean;
  client_name?: string;
  client_phone?: string;
  client_message?: string;
  status: 'pending' | 'contacted' | 'accepted' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | string;
  created_at: string;
  updated_at?: string;
  property?: {
    id: string | number;
    ref_id?: string;
    title: string;
    price?: number;
    operation_type?: string;
    location_name?: string;
    status?: string;
    image?: string;
  };
  room?: {
    id: string | number;
    name: string;
    price?: number;
    area?: number;
    status?: string;
    description?: string;
    image?: string;
  };
}

export const MyReservationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [reservations, setReservations] = useState<CustomerReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [clientPhone, setClientPhone] = useState<string>(() => StorageService.getClientPhone() || '');

  useEffect(() => {
    loadReservations();

    // Listen to foreground notifications to auto refresh reservations
    const unsubscribe = onPushNotification((payload: PushNotificationPayload) => {
      if (payload.type && (payload.type.includes('reservation') || payload.type.includes('status'))) {
        loadReservations();
      }
    });

    // Custom local event from InquiryModal
    const handleLocalReservation = () => {
      loadReservations();
    };
    window.addEventListener('sakani_reservation_created', handleLocalReservation);

    return () => {
      unsubscribe();
      window.removeEventListener('sakani_reservation_created', handleLocalReservation);
    };
  }, []);

  // Auto scroll to highlighted item or scroll to top on mount
  useEffect(() => {
    if (highlightId && reservations.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`reservation-${highlightId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    } else if (!highlightId) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [highlightId, reservations]);

  const loadReservations = async () => {
    setLoading(true);
    const phone = StorageService.getClientPhone() || clientPhone;
    
    // 1. First get local stored reservations as immediate baseline
    const localReservations = StorageService.getClientReservations();
    const allProperties = StorageService.getProperties();

    let combinedList: CustomerReservationItem[] = localReservations.map((loc, idx) => {
      const prop = allProperties.find(p => String(p.id) === String(loc.property_id));
      const room = prop?.detailed_rooms?.find(r => String(r.id) === String(loc.room_id));
      return {
        id: `local-${loc.property_id}-${loc.room_id || 'main'}-${idx}`,
        property_id: loc.property_id,
        room_id: loc.room_id || null,
        is_room_reservation: Boolean(loc.room_id),
        client_phone: loc.phone || phone,
        status: 'pending',
        created_at: loc.created_at || new Date().toISOString(),
        property: prop ? {
          id: prop.id,
          ref_id: prop.ref_id,
          title: prop.title,
          price: prop.price,
          operation_type: prop.operation_type,
          location_name: prop.district_name,
          status: prop.status,
          image: prop.images?.[0],
        } : undefined,
        room: room ? {
          id: room.id,
          name: room.name,
          price: room.price,
          area: room.area,
          status: room.status,
          description: room.description,
          image: room.imageUrl,
        } : undefined,
      };
    });

    // 2. Fetch live data from backend
    try {
      const cleanDigits = phone ? phone.replace(/\D/g, '') : '';
      if (cleanDigits.length >= 7) {
        const res = await ApiService.getCustomerReservations(cleanDigits);
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          // Backend live data is authority
          combinedList = res.data;
        }
      }
    } catch (e) {
      console.warn('Backend reservation fetch error:', e);
    }

    setReservations(combinedList);
    setLoading(false);
  };

  const formatPrice = (price?: number) => {
    if (!price) return '0';
    return price.toLocaleString('ar-EG');
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'confirmed':
        return {
          label: 'تم قبول وتأكيد الحجز',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dotColor: 'bg-emerald-500',
          icon: CheckCircle2,
          stepIndex: 3,
        };
      case 'contacted':
      case 'in_progress':
        return {
          label: 'تم التواصل وجاري التنسيق',
          color: 'bg-blue-50 text-blue-800 border-blue-200',
          dotColor: 'bg-blue-500',
          icon: Phone,
          stepIndex: 2,
        };
      case 'rejected':
        return {
          label: 'تعذر قبول الطلب',
          color: 'bg-rose-50 text-rose-800 border-rose-200',
          dotColor: 'bg-rose-500',
          icon: XCircle,
          stepIndex: 3,
          isRejected: true,
        };
      case 'cancelled':
        return {
          label: 'تم إلغاء الحجز',
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          dotColor: 'bg-slate-400',
          icon: XCircle,
          stepIndex: 0,
        };
      case 'completed':
        return {
          label: 'تم إنهاء الحجز بنجاح',
          color: 'bg-purple-50 text-purple-800 border-purple-200',
          dotColor: 'bg-purple-500',
          icon: CheckCircle2,
          stepIndex: 3,
        };
      case 'pending':
      default:
        return {
          label: 'قيد المراجعة والتدقيق',
          color: 'bg-amber-50 text-amber-900 border-amber-200',
          dotColor: 'bg-amber-500',
          icon: Clock,
          stepIndex: 1,
        };
    }
  };

  const filteredReservations = reservations.filter((r) => {
    // Tab filter
    if (filterTab === 'pending' && r.status !== 'pending') return false;
    if (filterTab === 'contacted' && r.status !== 'contacted' && r.status !== 'in_progress') return false;
    if (filterTab === 'accepted' && r.status !== 'accepted' && r.status !== 'confirmed' && r.status !== 'completed') return false;
    if (filterTab === 'rejected' && r.status !== 'rejected' && r.status !== 'cancelled') return false;

    // Search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const propTitle = (r.property?.title || '').toLowerCase();
      const refId = (r.property?.ref_id || '').toLowerCase();
      const roomName = (r.room?.name || '').toLowerCase();
      const loc = (r.property?.location_name || '').toLowerCase();
      return propTitle.includes(term) || refId.includes(term) || roomName.includes(term) || loc.includes(term);
    }
    return true;
  });

  const handleWhatsAppInquiry = (r: CustomerReservationItem) => {
    const text = encodeURIComponent(
      `مرحباً إدارة سكني، أستفسر عن حالة طلب الحجز رقم (#${r.id}) للعقار (${r.property?.title || ''}) كود (${r.property?.ref_id || ''})${
        r.room?.name ? ` - الغرفة: ${r.room.name}` : ''
      }.`
    );
    window.open(`https://wa.me/201067725976?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 pt-4 sm:pt-8" dir="rtl">
      <SEOHead
        title="حجوزاتي ومتابعة الطلبات | سكني"
        description="متابعة حالة كافة طلبات المعاينة وحجوزات العقارات والغرف المسجلة برقمك لحظة بلحظة."
        robots="noindex, nofollow"
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Page Header */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#8D6A28]/10 text-[#8D6A28] flex items-center justify-center font-bold">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                حجوزاتي ومتابعة الطلبات
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium pt-1">
              متابعة حالة كافة طلبات المعاينة وحجوزات العقارات والغرف المسجلة برقمك لحظة بلحظة
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
            <button
              onClick={loadReservations}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>تحديث الحالة</span>
            </button>

            <button
              onClick={() => navigate('/properties')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>استعراض عقارات أخرى</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث باسم العقار، الغرفة، أو الكود..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#8D6A28] focus:bg-white transition"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar">
            {[
              { id: 'all', label: `الكل (${reservations.length})` },
              { id: 'pending', label: 'قيد المراجعة' },
              { id: 'contacted', label: 'تم التواصل' },
              { id: 'accepted', label: 'المقبولة' },
              { id: 'rejected', label: 'المرفوضة والملغاة' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterTab === tab.id
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reservations Cards List */}
        {loading ? (
          <div className="space-y-4">
            <ReservationCardSkeleton />
            <ReservationCardSkeleton />
            <ReservationCardSkeleton />
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs">
            <ModernStateFeedback
              type="empty"
              title={searchTerm || filterTab !== 'all' ? 'لا توجد حجوزات مطابقة للفلتر المحدد' : 'لا توجد طلبات حجز مسجلة حتى الآن'}
              description={searchTerm || filterTab !== 'all' ? 'جرب البحث بكود مختلف أو إعادة ضبط التبويب المحدد.' : 'استعرض مئات الشقق والغرف والفيلات المتاحة في دمياط الجديدة وقم بحجز موعد معاينة بكل سهولة.'}
              actionText={searchTerm || filterTab !== 'all' ? 'عرض كافة الحجوزات' : 'استعراض العقارات المتاحة'}
              onAction={() => {
                if (searchTerm || filterTab !== 'all') {
                  setSearchTerm('');
                  setFilterTab('all');
                } else {
                  navigate('/properties');
                }
              }}
              secondaryActionText={searchTerm || filterTab !== 'all' ? 'تصفح العقارات المتاحة' : 'الرئيسية'}
              onSecondaryAction={() => navigate('/properties')}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReservations.map((res) => {
              const statusInfo = getStatusInfo(res.status);
              const StatusIcon = statusInfo.icon;
              const isHighlighted = String(res.id) === String(highlightId);

              return (
                <div
                  key={res.id}
                  id={`reservation-${res.id}`}
                  className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden shadow-xs hover:shadow-md ${
                    isHighlighted
                      ? 'border-[#8D6A28] ring-4 ring-[#8D6A28]/20 bg-amber-50/10'
                      : 'border-slate-200/80'
                  }`}
                >
                  <div className="p-4 sm:p-6 space-y-4">
                    
                    {/* Header Row: Type Badge + Status + Date */}
                    <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        {res.is_room_reservation ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 text-xs font-black">
                            <DoorOpen className="w-3.5 h-3.5 text-purple-600" />
                            <span>حجز غرفة مستقلة</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-black">
                            <Building2 className="w-3.5 h-3.5 text-[#8D6A28]" />
                            <span>حجز عقار بالكامل</span>
                          </span>
                        )}

                        {res.property?.ref_id && (
                          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                            {res.property.ref_id}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-black ${statusInfo.color}`}>
                          <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor} animate-pulse`} />
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{statusInfo.label}</span>
                        </span>
                      </div>
                    </div>

                    {/* Content Row: Thumbnail + Property Info + Room Info */}
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {/* Property Image */}
                      <div className="w-full sm:w-36 h-36 sm:h-28 rounded-2xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 relative group">
                        <img
                          src={resolveImageUrl(
                            res.is_room_reservation && res.room?.image
                              ? res.room.image
                              : res.property?.image
                          )}
                          alt={res.property?.title || 'عقار'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
                        />
                        {res.is_room_reservation && (
                          <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs">
                            غرفة
                          </span>
                        )}
                      </div>

                      {/* Info Body */}
                      <div className="min-w-0 flex-1 space-y-2">
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-slate-900 hover:text-[#8D6A28] transition cursor-pointer"
                              onClick={() => navigate(`/properties/${res.property_id}`)}>
                            {res.property?.title || 'عقار سكني في دمياط الجديدة'}
                          </h3>

                          {res.property?.location_name && (
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-[#8D6A28]" />
                              <span>{res.property.location_name}</span>
                            </p>
                          )}
                        </div>

                        {/* If Room Reservation -> Highlight Room Details */}
                        {res.is_room_reservation && res.room && (
                          <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-2xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <DoorOpen className="w-4 h-4 text-purple-700" />
                              <div>
                                <span className="font-extrabold text-xs text-purple-950">{res.room.name}</span>
                                {res.room.description && (
                                  <p className="text-[11px] text-purple-700/80 line-clamp-1">{res.room.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-left shrink-0">
                              <span className="font-mono font-black text-xs text-purple-900">
                                {formatPrice(res.room.price)} ج.م / شهر
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Whole Property Price */}
                        {!res.is_room_reservation && res.property?.price && (
                          <div className="text-sm font-black text-[#8D6A28] font-mono">
                            {formatPrice(res.property.price)} ج.م
                            {res.property.operation_type === 'rent' && (
                              <span className="text-[11px] font-normal text-slate-500"> / شهر</span>
                            )}
                          </div>
                        )}

                        {/* Customer Message if any */}
                        {res.client_message && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                            <span className="font-bold text-slate-700">ملاحظاتك: </span>
                            {res.client_message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status Timeline Bar */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                        <span className={statusInfo.stepIndex >= 1 ? 'text-[#8D6A28]' : ''}>1. تم إرسال الطلب</span>
                        <span className={statusInfo.stepIndex >= 1 ? 'text-[#8D6A28]' : ''}>2. قيد المراجعة</span>
                        <span className={statusInfo.stepIndex >= 2 ? 'text-blue-700' : ''}>3. التواصل مع العميل</span>
                        <span className={
                          statusInfo.isRejected 
                            ? 'text-rose-700' 
                            : statusInfo.stepIndex >= 3 
                            ? 'text-emerald-700' 
                            : ''
                        }>
                          {statusInfo.isRejected ? 'تعذر الحجز' : '4. تأكيد الحجز'}
                        </span>
                      </div>

                      {/* Visual Track */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            statusInfo.isRejected 
                              ? 'bg-rose-500 w-full' 
                              : statusInfo.stepIndex === 3 
                              ? 'bg-emerald-500 w-full' 
                              : statusInfo.stepIndex === 2 
                              ? 'bg-blue-500 w-3/4' 
                              : 'bg-[#8D6A28] w-1/2'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 flex items-center justify-between gap-2 flex-wrap text-xs">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        تاريخ الطلب: {formatDate(res.created_at)}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleWhatsAppInquiry(res)}
                          className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>استفسار واتساب</span>
                        </button>

                        <button
                          onClick={() => navigate(`/properties/${res.property_id}`)}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>صفحة العقار</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
