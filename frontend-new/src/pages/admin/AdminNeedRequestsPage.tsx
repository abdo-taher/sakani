import React, { useState, useEffect } from 'react';
import { NeedRequest, NeedPropertyRequest } from '../../types';
import { StorageService } from '../../services/storageService';
import { 
  HelpCircle, 
  Search, 
  MessageCircle, 
  Trash2, 
  MapPin, 
  DollarSign, 
  Building,
  Clock,
  CheckCircle2,
  Phone
} from 'lucide-react';

import { ApiService } from '../../services/apiService';
import { DashboardTableSkeleton, ModernStateFeedback } from '../../components/Skeletons';

export const AdminNeedRequestsPage: React.FC = () => {
  const [needRequests, setNeedRequests] = useState<NeedPropertyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // Immediate local render
    setNeedRequests(StorageService.getNeedRequests());

    // Fetch from backend API
    try {
      const res = await ApiService.getNeedRequests();
      if (Array.isArray(res) && res.length > 0) {
        const mapped: NeedRequest[] = res.map((r: any) => ({
          id: String(r.id),
          client_name: r.name || r.client_name,
          client_phone: r.phone || r.client_phone,
          listing_type: r.listing_type || 'buy',
          property_type: r.property_type || 'apartment',
          location: r.location || r.preferred_district || 'دمياط الجديدة',
          budget: Number(r.budget) || Number(r.max_price) || 0,
          rooms: Number(r.rooms) || Number(r.bedrooms) || 2,
          area: Number(r.area) || undefined,
          notes: r.notes || '',
          status: r.status || 'pending',
          created_at: r.created_at || new Date().toISOString(),
        }));
        setNeedRequests(mapped);
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: NeedPropertyRequest['status']) => {
    StorageService.updateNeedRequestStatus(id, newStatus);
    const numId = parseInt(id.replace(/\D/g, ''), 10);
    if (numId) {
      try {
        await ApiService.updateNeedRequest(numId, { status: newStatus });
      } catch (e) {}
    }
    loadData();
  };

  const handleDeleteRequest = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      StorageService.deleteNeedRequest(id);
      const numId = parseInt(id.replace(/\D/g, ''), 10);
      if (numId) {
        try {
          await ApiService.deleteNeedRequest(numId);
        } catch (e) {}
      }
      loadData();
    }
  };

  const filtered = needRequests.filter((req) => {
    const matchesSearch =
      req.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.client_phone.includes(searchTerm) ||
      (req.preferred_district && req.preferred_district.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (req.notes && req.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = needRequests.filter((r) => r.status === 'pending').length;
  const inProgressCount = needRequests.filter((r) => r.status === 'in_progress').length;
  const matchedCount = needRequests.filter((r) => r.status === 'matched').length;

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-7 h-7 text-indigo-600" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed">
              طلبات العملاء الخاصة
            </h1>
          </div>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">
            متابعة طلبات البحث عن عقارات بمواصفات وميزانيات محددة واردة من العملاء ({needRequests.length} طلب إجمالي)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
            {pendingCount} قيد الانتظار
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
            {inProgressCount} جاري البحث
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            {matchedCount} تم التوفيق
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
              placeholder="ابحث باسم العميل، رقم الهاتف، الحي المطلوب، أو المواصفات..."
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#8D6A28] outline-none transition"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#8D6A28]"
          >
            <option value="all">كافة الحالات ({needRequests.length})</option>
            <option value="pending">قيد الانتظار ({pendingCount})</option>
            <option value="in_progress">جاري البحث ({inProgressCount})</option>
            <option value="matched">تم التوفيق ({matchedCount})</option>
            <option value="closed">مغلق</option>
          </select>
        </div>
      </div>

      {/* Requests List Grid */}
      {loading ? (
        <DashboardTableSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs">
          <ModernStateFeedback
            type="empty"
            title="لا توجد طلبات بحث مطابقة"
            description={searchTerm || filterStatus !== 'all' ? 'جرب البحث باسم أو رقم آخر أو تعديل الفلتر.' : 'طلبات البحث الخاصة الواردة من استمارة "اطلب عقارك" ستظهر هنا فور إرسالها.'}
            actionText={searchTerm || filterStatus !== 'all' ? 'إعادة ضبط الفلاتر' : undefined}
            onAction={searchTerm || filterStatus !== 'all' ? () => { setSearchTerm(''); setFilterStatus('all'); } : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((req) => (
            <div key={req.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">{req.client_name}</h3>
                  <a href={`tel:${req.client_phone}`} className="text-xs text-blue-600 font-mono font-bold block mt-0.5" dir="ltr">
                    {req.client_phone}
                  </a>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap inline-flex items-center justify-center shrink-0 ${
                  req.status === 'pending'
                    ? 'bg-rose-100 text-rose-800'
                    : req.status === 'in_progress'
                    ? 'bg-amber-100 text-amber-800'
                    : req.status === 'matched'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {req.status === 'pending' ? 'انتظار' : req.status === 'in_progress' ? 'جاري البحث' : req.status === 'matched' ? 'تم التوفيق' : 'مغلق'}
                </span>
              </div>

              {/* Request Specs */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-700 flex-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-500">نوع العقار:</span>
                  <span className="text-slate-900">{req.property_type || 'غير محدد'} ({req.operation_type === 'rent' ? 'إيجار' : 'شراء'})</span>
                </div>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-500">الحي / المنطقة:</span>
                  <span className="text-slate-900">{req.preferred_district || 'أي منطقة'}</span>
                </div>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-500">الميزانية:</span>
                  <span className="text-[#8D6A28] font-mono">
                    {req.budget_max ? `حتى ${req.budget_max.toLocaleString()} ج.م` : 'غير محدد'}
                  </span>
                </div>
                {req.notes && (
                  <div className="pt-1.5 border-t border-slate-200/60 text-[11px] text-slate-600">
                    <span className="font-bold text-slate-800 block mb-0.5">ملاحظات:</span>
                    <p className="line-clamp-2">{req.notes}</p>
                  </div>
                )}
              </div>

              {/* Actions & Status update */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <select
                  value={req.status}
                  onChange={(e) => handleUpdateStatus(req.id, e.target.value as NeedPropertyRequest['status'])}
                  className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="pending">قيد الانتظار</option>
                  <option value="in_progress">جاري البحث</option>
                  <option value="matched">تم التوفيق</option>
                  <option value="closed">إغلاق الطلب</option>
                </select>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/${req.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`السلام عليكم أ/ ${req.client_name}، نتواصل معك من منصة سكني بخصوص طلبك الخاص للبحث عن (${req.property_type || 'عقار'}) في دمياط الجديدة.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>واتساب</span>
                  </a>
                  <button
                    onClick={() => handleDeleteRequest(req.id)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
