import React, { useState, useEffect } from 'react';
import { InquiryReservation } from '../../types';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { DashboardTableSkeleton, ModernStateFeedback } from '../../components/Skeletons';
import { 
  CalendarCheck, 
  Search, 
  Filter, 
  MessageCircle, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Phone,
  Building,
  UserCheck,
  RotateCcw
} from 'lucide-react';

export const AdminReservationsPage: React.FC = () => {
  const [inquiries, setInquiries] = useState<InquiryReservation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Immediate local render
    setInquiries(StorageService.getInquiries());

    // Fetch from backend API
    try {
      const res = await ApiService.getReservations();
      if (Array.isArray(res) && res.length > 0) {
        const mapped: InquiryReservation[] = res.map((r: any) => ({
          id: String(r.id),
          property_id: String(r.property_id),
          property_ref: r.property?.ref_id || `SK-${r.property_id}`,
          property_title: r.property?.title || 'عقار سكني',
          room_id: r.room_id ? String(r.room_id) : undefined,
          room_name: r.room?.name,
          client_name: r.name,
          client_phone: r.phone,
          message: r.message || '',
          status: (r.status === 'completed' || r.status === 'confirmed' || r.status === 'accepted') 
            ? 'completed' 
            : (r.status === 'cancelled' || r.status === 'rejected') 
            ? 'cancelled' 
            : (r.status === 'contacted' || r.status === 'in_progress') 
            ? 'in_progress' 
            : 'new',
          created_at: r.created_at || new Date().toISOString(),
        }));
        setInquiries(mapped);
      }
    } catch (e) {
      // Offline fallback
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: InquiryReservation['status']) => {
    // 1. Update in local storage (also handles auto-reversion of property status to 'available' if cancelled)
    StorageService.updateInquiryStatus(id, newStatus);

    // 2. Also try API if numeric ID
    const numId = parseInt(id.replace(/\D/g, ''), 10);
    if (numId) {
      try {
        await ApiService.updateReservationStatus(numId, newStatus);
      } catch {}
    }

    loadData();
  };

  const handleDeleteInquiry = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف طلب الحجز هذا؟ سيتم تحرير حالة العقار تلقائياً في حال عدم وجود طلبات أخرى.')) {
      StorageService.deleteInquiry(id);
      
      const numId = parseInt(id.replace(/\D/g, ''), 10);
      if (numId) {
        try {
          await ApiService.deleteReservation(numId);
        } catch {}
      }
      loadData();
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const matchesSearch =
      inq.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.client_phone.includes(searchTerm) ||
      inq.property_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.property_ref.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || inq.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const newCount = inquiries.filter((i) => i.status === 'new').length;
  const inProgressCount = inquiries.filter((i) => i.status === 'in_progress').length;
  const completedCount = inquiries.filter((i) => i.status === 'completed').length;
  const cancelledCount = inquiries.filter((i) => i.status === 'cancelled').length;

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-rose-600" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed">
              طلبات الحجز والمعاينات
            </h1>
          </div>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">
            متابعة طلبات الحجز الفورية، التواصل مع العملاء، وتحديث حالات المعاينة ({inquiries.length} طلب إجمالي)
          </p>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            {newCount} جديد
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
            {inProgressCount} قيد المتابعة
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            {completedCount} مكتمل
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم العميل، رقم الهاتف، اسم العقار، أو كود العقار..."
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#8D6A28] outline-none transition"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#8D6A28]"
          >
            <option value="all">كافة الحالات ({inquiries.length})</option>
            <option value="new">طلبات جديدة ({newCount})</option>
            <option value="in_progress">قيد المتابعة ({inProgressCount})</option>
            <option value="completed">تمت المعاينة بنجاح ({completedCount})</option>
            <option value="cancelled">ملغي / مرفوض ({cancelledCount})</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>نتائج الفلترة: <strong className="text-slate-900">{filteredInquiries.length}</strong> طلب</span>
          {(searchTerm || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
              className="text-[#8D6A28] font-bold hover:underline cursor-pointer"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Inquiries Content: Desktop Table & Mobile Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
              <tr>
                <th className="p-4">اسم العميل</th>
                <th className="p-4">رقم الهاتف</th>
                <th className="p-4">العقار المطلوب</th>
                <th className="p-4">رسالة العميل</th>
                <th className="p-4">تاريخ الطلب</th>
                <th className="p-4">حالة الحجز</th>
                <th className="p-4 text-center">تحديث الحالة</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredInquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4">
                    <span className="font-extrabold text-sm text-slate-900 block">{inq.client_name}</span>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-700 text-sm" dir="ltr">
                    {inq.client_phone}
                  </td>
                  <td className="p-4">
                    <div>
                      <span className="font-extrabold text-slate-800 block truncate max-w-xs">{inq.property_title}</span>
                      <span className="text-[11px] font-mono font-bold text-[#8D6A28]">كود: {inq.property_ref}</span>
                      {inq.room_name && (
                        <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded mr-1">
                          غرفة: {inq.room_name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap inline-flex items-center justify-center shrink-0 ${
                      inq.status === 'new'
                        ? 'bg-rose-100 text-rose-800'
                        : inq.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-800'
                        : inq.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {inq.status === 'new' ? 'طلب جديد' : inq.status === 'in_progress' ? 'قيد المتابعة' : inq.status === 'completed' ? 'تمت المعاينة' : 'ملغي / مرفوض'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 max-w-xs truncate text-[11px]">
                    {inq.message || '—'}
                  </td>
                  <td className="p-4 font-mono text-slate-500 text-[11px]" dir="ltr">
                    {new Date(inq.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4 text-center">
                    <select
                      value={inq.status}
                      onChange={(e) => handleUpdateStatus(inq.id, e.target.value as InquiryReservation['status'])}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#8D6A28]"
                    >
                      <option value="new">جديد</option>
                      <option value="in_progress">قيد المتابعة</option>
                      <option value="completed">تم بنجاح</option>
                      <option value="cancelled">إلغاء الطلب (تحرير العقار)</option>
                    </select>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <a
                        href={`https://wa.me/${inq.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `مرحباً ${inq.client_name}، بخصوص طلبك على عقار "${inq.property_title}" كود (${inq.property_ref})${
                            inq.room_name ? ` (غرفة: ${inq.room_name})` : ''
                          }`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                        title="محادثة واتساب"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteInquiry(inq.id)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                        title="حذف الطلب"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredInquiries.map((inq) => (
            <div key={inq.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{inq.client_name}</h3>
                  <a href={`tel:${inq.client_phone}`} className="font-mono text-xs text-blue-600 font-bold block mt-0.5" dir="ltr">
                    {inq.client_phone}
                  </a>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black whitespace-nowrap inline-flex items-center justify-center shrink-0 ${
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
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-xs">
                <div className="font-bold text-slate-800 line-clamp-1">{inq.property_title}</div>
                <div className="text-[11px] text-slate-500 font-mono">كود العقار: {inq.property_ref}</div>
                {inq.room_name && (
                  <span className="inline-block text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-md border border-purple-200">
                    غرفة: {inq.room_name}
                  </span>
                )}
                {inq.message && (
                  <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 mt-1">
                    "{inq.message}"
                  </p>
                )}
              </div>

              <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                <select
                  value={inq.status}
                  onChange={(e) => handleUpdateStatus(inq.id, e.target.value as InquiryReservation['status'])}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="new">جديد</option>
                  <option value="in_progress">قيد المتابعة</option>
                  <option value="completed">تم بنجاح</option>
                  <option value="cancelled">إلغاء الطلب</option>
                </select>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/${inq.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      inq.room_name
                        ? `السلام عليكم أ/ ${inq.client_name}، نتواصل معك من منصة سكني بخصوص طلب معاينة غرفة (${inq.room_name}) بالعقار كود (${inq.property_ref})`
                        : `السلام عليكم أ/ ${inq.client_name}، نتواصل معك من منصة سكني بخصوص طلب معاينة العقار كود (${inq.property_ref})`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 px-2.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>واتساب</span>
                  </a>
                  <button
                    onClick={() => handleDeleteInquiry(inq.id)}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredInquiries.length === 0 && (
          <div className="p-4">
            <ModernStateFeedback
              type="empty"
              title="لا توجد طلبات حجز أو معاينة مطابقة"
              description="سيتم إدراج أي طلبات حجز ومعاينة جديدة يرسلها العملاء من الموقع مباشرة في هذا الجدول."
              actionText={(searchTerm || filterStatus !== 'all') ? "إعادة ضبط الفلاتر" : undefined}
              onAction={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
            />
          </div>
        )}

      </div>

    </div>
  );
};
