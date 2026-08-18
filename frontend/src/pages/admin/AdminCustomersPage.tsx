import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ApiService } from '../../services/apiService';
import { StorageService } from '../../services/storageService';
import { Property } from '../../types';
import { DashboardTableSkeleton, ModernStateFeedback } from '../../components/Skeletons';
import { FALLBACK_PROPERTY_IMAGE } from '../../utils/media';
import { 
  Users, 
  Search, 
  Filter, 
  Sparkles, 
  Phone, 
  User, 
  CalendarCheck, 
  HelpCircle, 
  Building2, 
  MessageSquare, 
  Send, 
  CheckSquare, 
  Square, 
  ChevronLeft, 
  X, 
  Clock, 
  CheckCircle2, 
  RefreshCw,
  ExternalLink,
  DollarSign,
  MapPin,
  Flame,
  Award,
  Layers,
  ArrowRight
} from 'lucide-react';

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('engagement'); // engagement, recent, reservations, requests

  // Selection State for Bulk Recommendation
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);

  // Customer Detail Drawer State
  const [activeCustomerPhone, setActiveCustomerPhone] = useState<string | null>(null);
  const [customerTimeline, setCustomerTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Property Recommendation Modal State
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<(string | number)[]>([]);
  const [recommendCustomMsg, setRecommendCustomMsg] = useState('');
  const [isSendingRecommendations, setIsSendingRecommendations] = useState(false);
  const [recommendSuccessMsg, setRecommendSuccessMsg] = useState('');

  // Need Request Matcher Modal State
  const [matchingNeedRequest, setMatchingNeedRequest] = useState<any | null>(null);
  const [matchingProperties, setMatchingProperties] = useState<Property[]>([]);

  useEffect(() => {
    loadCustomers();
    loadProperties();
  }, [sortBy]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getCustomers({ search: searchTerm, sort: sortBy });
      if (res && Array.isArray(res)) {
        setCustomers(res);
      }
    } catch (e) {
      console.warn('Customer directory fetch error:', e);
    }
    setLoading(false);
  };

  const loadProperties = () => {
    const props = StorageService.getProperties().filter(p => p.status === 'available');
    setAvailableProperties(props);
  };

  const handleOpenCustomerDetails = async (phone: string) => {
    setActiveCustomerPhone(phone);
    setLoadingTimeline(true);
    try {
      const res = await ApiService.getCustomerDetails(phone);
      if (res && res.timeline) {
        setCustomerTimeline(res.timeline);
      } else {
        setCustomerTimeline([]);
      }
    } catch (e) {
      setCustomerTimeline([]);
    }
    setLoadingTimeline(false);
  };

  const handleToggleSelectPhone = (phone: string) => {
    setSelectedPhones(prev => 
      prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredPhones = filteredCustomers.map(c => c.phone);
    setSelectedPhones(allFilteredPhones);
  };

  const handleClearSelection = () => {
    setSelectedPhones([]);
  };

  const handleOpenRecommendModal = () => {
    if (selectedPhones.length === 0) {
      alert('يرجى اختيار عميل واحد على الأقل من القائمة');
      return;
    }
    setSelectedPropertyIds([]);
    setRecommendCustomMsg('');
    setRecommendSuccessMsg('');
    setIsRecommendModalOpen(true);
  };

  const handleToggleSelectProperty = (id: string | number) => {
    setSelectedPropertyIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleSendRecommendations = async () => {
    if (selectedPhones.length === 0 || selectedPropertyIds.length === 0) {
      alert('يرجى اختيار العقارات المراد ترشيحها');
      return;
    }

    setIsSendingRecommendations(true);
    try {
      const res = await ApiService.recommendPropertiesToCustomers({
        phones: selectedPhones,
        property_ids: selectedPropertyIds,
        custom_message: recommendCustomMsg.trim() || undefined,
      });

      if (res && res.success) {
        setRecommendSuccessMsg(res.message);
        setTimeout(() => {
          setIsRecommendModalOpen(false);
          setRecommendSuccessMsg('');
          setSelectedPhones([]);
        }, 2000);
      }
    } catch (e) {
      alert('حدث خطأ أثناء إرسال الترشيحات');
    }
    setIsSendingRecommendations(false);
  };

  const filteredCustomers = customers.filter(c => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        c.phone.includes(term) ||
        (c.primary_name || '').toLowerCase().includes(term) ||
        (c.email || '').toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Calculate Quick Stats
  const totalContacts = customers.length;
  const vipContacts = customers.filter(c => c.tier === 'gold').length;
  const activeContacts = customers.filter(c => c.tier === 'blue').length;
  const totalReservations = customers.reduce((acc, c) => acc + (c.reservations_count || 0), 0);

  return (
    <div className="p-4 sm:p-8 space-y-6" dir="rtl">
      
      {/* Top Header & Stats */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#8D6A28] flex items-center justify-center font-black">
                <Users className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                دليل العملاء واستخبارات جهات الاتصال
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              تجميع وتوحيد أرقام الهواتف من الحجوزات وطلبات العقار والرسائل مع حساب درجات التفاعل وترشيح العقارات
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenRecommendModal}
              disabled={selectedPhones.length === 0}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                selectedPhones.length > 0
                  ? 'gold-gradient gold-gradient-hover text-white'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>إرسال ترشيحات ({selectedPhones.length})</span>
            </button>

            <button
              onClick={loadCustomers}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Intelligence Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-bold text-slate-500">إجمالي جهات الاتصال</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{totalContacts}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80">
            <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#8D6A28]" />
              <span>عملاء VIP / الأكثر تفاعلاً</span>
            </div>
            <div className="text-xl font-black text-[#8D6A28] font-mono mt-0.5">{vipContacts}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80">
            <div className="text-[11px] font-bold text-blue-900">عملاء نشطين</div>
            <div className="text-xl font-black text-blue-700 font-mono mt-0.5">{activeContacts}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
            <div className="text-[11px] font-bold text-emerald-900">إجمالي طلبات الحجز</div>
            <div className="text-xl font-black text-emerald-700 font-mono mt-0.5">{totalReservations}</div>
          </div>
        </div>
      </div>

      {/* Filter and Selection Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالرقم أو الاسم أو البريد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-[#8D6A28]"
          />
        </div>

        {/* Sort & Select Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end flex-wrap">
          {/* Multi-Select Helpers */}
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <button
              onClick={handleSelectAllFiltered}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              تحديد الكل ({filteredCustomers.length})
            </button>
            {selectedPhones.length > 0 && (
              <button
                onClick={handleClearSelection}
                className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                إلغاء التحديد
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <span>ترتيب حسب:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold outline-none cursor-pointer"
            >
              <option value="engagement">درجة التفاعل (Interaction Score)</option>
              <option value="recent">النشاط الأحدث</option>
              <option value="reservations">الأكثر حجزاً</option>
              <option value="requests">الأكثر طلباً للعقارات</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Directory: Mobile Cards + Desktop Table */}
      {loading ? (
        <DashboardTableSkeleton rows={7} />
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
          <ModernStateFeedback
            type="empty"
            title="لا توجد جهات اتصال مطابقة للبحث"
            description="جرب البحث برقم هاتف آخر أو اسم مختلف، أو قم بإلغاء تصنيف الفئة لتوسيع نطاق البحث."
            actionText="إعادة ضبط البحث"
            onAction={() => {
              setSearchTerm('');
              setTierFilter('all');
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* ========================================================================= */}
          {/* 1. Mobile & Tablet Card View (< lg screens) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 lg:hidden">
            {filteredCustomers.map((c) => {
              const isSelected = selectedPhones.includes(c.phone);
              const isVip = c.tier === 'gold';
              const isActive = c.tier === 'blue';

              return (
                <div
                  key={c.phone}
                  className={`bg-white rounded-3xl border p-4 sm:p-5 shadow-xs space-y-3.5 transition-all ${
                    isSelected ? 'border-[#8D6A28] bg-amber-50/20 ring-1 ring-[#8D6A28]/30' : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  {/* Top: Checkbox, Name, VIP, Score */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectPhone(c.phone)}
                        className="w-4 h-4 rounded accent-[#8D6A28] cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-black text-slate-900 text-sm truncate">{c.primary_name}</h4>
                          {isVip && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-[#8D6A28] text-[10px] font-black shrink-0">
                              VIP
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-xs text-slate-500 mt-0.5 truncate" dir="ltr">
                          {c.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs shadow-2xs ${
                        isVip ? 'bg-amber-100 text-[#8D6A28]' : isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {c.score}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 hidden sm:inline">{c.tier_label}</span>
                    </div>
                  </div>

                  {/* Stats Grid: Reservations, Requests, Submissions */}
                  <div className="grid grid-cols-3 gap-2 py-2 px-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">الحجوزات</span>
                      {c.reservations_count > 0 ? (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold whitespace-nowrap">
                          {c.reservations_count} حجز
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-300">—</span>
                      )}
                    </div>

                    <div className="border-x border-slate-200/70">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">الطلبات</span>
                      {c.need_requests_count > 0 ? (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold whitespace-nowrap">
                          {c.need_requests_count} طلب
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-300">—</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">العقارات</span>
                      {c.property_submissions_count > 0 ? (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold whitespace-nowrap">
                          {c.property_submissions_count} عقار
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-300">—</span>
                      )}
                    </div>
                  </div>

                  {/* Footer: Last interaction + Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                    <span className="text-[11px] text-slate-400 font-medium">
                      آخر تفاعل: {c.last_interaction ? new Date(c.last_interaction).toLocaleDateString('ar-EG', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : '—'}
                    </span>

                    <div className="flex items-center gap-1.5 mr-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenCustomerDetails(c.phone)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                      >
                        <Clock className="w-3 h-3 text-[#D6A94E]" />
                        <span>سجل النشاط</span>
                      </button>

                      <a
                        href={`https://wa.me/20${c.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition flex items-center justify-center shadow-2xs"
                        title="محادثة واتساب"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* 2. Desktop Table View (>= lg screens) */}
          {/* ========================================================================= */}
          <div className="hidden lg:block bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs whitespace-nowrap">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-black">
                  <tr>
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedPhones.length === filteredCustomers.length && filteredCustomers.length > 0}
                        onChange={(e) => e.target.checked ? handleSelectAllFiltered() : handleClearSelection()}
                        className="rounded accent-[#8D6A28]"
                      />
                    </th>
                    <th className="p-4">العميل / جهة الاتصال</th>
                    <th className="p-4">درجة التفاعل (Score)</th>
                    <th className="p-4">الحجوزات</th>
                    <th className="p-4">طلبات العقارات</th>
                    <th className="p-4">العقارات المضافة</th>
                    <th className="p-4">آخر تفاعل</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredCustomers.map((c) => {
                    const isSelected = selectedPhones.includes(c.phone);
                    const isVip = c.tier === 'gold';
                    const isActive = c.tier === 'blue';

                    return (
                      <tr key={c.phone} className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-amber-50/30' : ''}`}>
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectPhone(c.phone)}
                            className="rounded accent-[#8D6A28] cursor-pointer"
                          />
                        </td>

                        <td className="p-4 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-sm">{c.primary_name}</span>
                            {isVip && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-[#8D6A28] text-[10px] font-black">VIP</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                            <span dir="ltr">{c.phone}</span>
                            {c.email && <span>• {c.email}</span>}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                              isVip ? 'bg-amber-100 text-[#8D6A28]' : isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {c.score}
                            </div>
                            <span className="text-[11px] text-slate-500">{c.tier_label}</span>
                          </div>
                        </td>

                        <td className="p-4 font-mono font-bold text-slate-800">
                          {c.reservations_count > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                              {c.reservations_count} حجز
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="p-4 font-mono font-bold text-slate-800">
                          {c.need_requests_count > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap">
                              {c.need_requests_count} طلب
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="p-4 font-mono font-bold text-slate-800">
                          {c.property_submissions_count > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 whitespace-nowrap">
                              {c.property_submissions_count} عقار
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="p-4 text-slate-500 text-[11px]">
                          {c.last_interaction ? new Date(c.last_interaction).toLocaleDateString('ar-EG', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : '-'}
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenCustomerDetails(c.phone)}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                            >
                              <Clock className="w-3 h-3 text-[#D6A94E]" />
                              <span>سجل النشاط</span>
                            </button>

                            <a
                              href={`https://wa.me/20${c.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                              title="محادثة واتساب"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ---------------- CUSTOMER TIMELINE DRAWER ---------------- */}
      {activeCustomerPhone && createPortal(
        <div className="fixed inset-0 z-[99999] overflow-hidden bg-black/60 backdrop-blur-xs flex justify-start" dir="rtl">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-fade-in">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-[#0F172A] text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-base">سجل تفاعلات العميل (Timeline)</h3>
                <p className="text-xs text-slate-400 font-mono" dir="ltr">{activeCustomerPhone}</p>
              </div>
              <button
                onClick={() => setActiveCustomerPhone(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Timeline Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingTimeline ? (
                <div className="py-16 text-center space-y-2">
                  <div className="w-8 h-8 border-2 border-[#8D6A28] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-bold">جاري تحميل السجل الزمني...</p>
                </div>
              ) : customerTimeline.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  لا توجد تفاعلات مسجلة لهذا الرقم
                </div>
              ) : (
                <div className="relative border-r-2 border-slate-200 pr-4 space-y-6 mr-2">
                  {customerTimeline.map((item, idx) => (
                    <div key={idx} className="relative group">
                      {/* Timeline Dot */}
                      <div className="absolute -right-[23px] top-1 w-3.5 h-3.5 rounded-full bg-[#8D6A28] border-2 border-white shadow-xs" />

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-xs text-slate-900">{item.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.date ? new Date(item.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                        )}

                        {item.status && (
                          <div className="pt-1">
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 text-[10px] font-bold">
                              الحالة: {item.status}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ---------------- PROPERTY RECOMMENDATIONS MODAL ---------------- */}
      {isRecommendModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/70 backdrop-blur-xs flex justify-center items-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-fade-in">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-[#0F172A] text-white flex items-center justify-between sticky top-0 z-10">
              <div>
                <h3 className="font-extrabold text-base">إرسال ترشيح عقارات إلى العملاء المحددين</h3>
                <p className="text-xs text-[#D6A94E]">المستلمون: {selectedPhones.length} عميل محدد</p>
              </div>

              <button
                onClick={() => setIsRecommendModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              
              {recommendSuccessMsg ? (
                <div className="p-6 rounded-2xl bg-emerald-50 text-emerald-800 text-center font-black space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <p>{recommendSuccessMsg}</p>
                </div>
              ) : (
                <>
                  {/* Custom Message input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">رسالة مخصصة مع الترشيح (اختياري)</label>
                    <input
                      type="text"
                      placeholder="مثال: بناءً على طلبك الأخير، وجدنا لك هذه الخيارات الممتازة..."
                      value={recommendCustomMsg}
                      onChange={(e) => setRecommendCustomMsg(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 outline-none"
                    />
                  </div>

                  {/* Properties Selection Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">
                        اختر العقارات المراد ترشيحها ({selectedPropertyIds.length} مختار)
                      </label>
                      <span className="text-[11px] text-slate-400">يمكنك اختيار أكثر من عقار</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1 border border-slate-200 rounded-2xl">
                      {availableProperties.map((p) => {
                        const isSelected = selectedPropertyIds.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleToggleSelectProperty(p.id)}
                            className={`p-3 rounded-xl border transition cursor-pointer flex items-center gap-3 ${
                              isSelected
                                ? 'bg-[#8D6A28]/10 border-[#8D6A28]'
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded accent-[#8D6A28]"
                            />
                            <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                              <img 
                                src={p.images?.[0] || FALLBACK_PROPERTY_IMAGE} 
                                alt={p.title} 
                                className="w-full h-full object-cover" 
                                onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-xs text-slate-900 truncate">{p.title}</div>
                              <div className="text-[11px] text-[#8D6A28] font-bold font-mono">
                                {Number(p.price).toLocaleString('ar-EG')} ج.م
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Action */}
                  <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsRecommendModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                      إلغاء
                    </button>

                    <button
                      type="button"
                      onClick={handleSendRecommendations}
                      disabled={isSendingRecommendations || selectedPropertyIds.length === 0}
                      className="px-6 py-2.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSendingRecommendations ? 'جاري الإرسال...' : 'إرسال الترشيحات الآن'}</span>
                    </button>
                  </div>
                </>
              )}

            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
