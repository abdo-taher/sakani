import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/apiService';
import { StorageService } from '../../services/storageService';
import { LocationMapPicker } from '../../components/LocationMapPicker';
import { AdminModal } from '../../components/AdminModal';
import { FALLBACK_PROPERTY_IMAGE } from '../../utils/media';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Phone, 
  User, 
  MapPin, 
  Eye, 
  Edit3, 
  RefreshCw, 
  Search, 
  Sparkles, 
  DollarSign, 
  Maximize2, 
  ShieldCheck, 
  Loader2
} from 'lucide-react';
import { DashboardTableSkeleton, ModernStateFeedback } from '../../components/Skeletons';

export const AdminPropertySubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [counts, setCounts] = useState<{ pending: number; approved: number; rejected: number; all: number }>({
    pending: 0,
    approved: 0,
    rejected: 0,
    all: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('pending_review');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Submission for Review / Edit Modal
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Edit Fields State
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCoords, setEditCoords] = useState<{ lat: number; lng: number }>({ lat: 31.4357, lng: 31.6708 });
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, [filterStatus]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getPropertySubmissions(filterStatus);
      if (res && Array.isArray(res)) {
        setSubmissions(res);
      } else if (res && res.data && Array.isArray(res.data)) {
        setSubmissions(res.data);
        if (res.counts) setCounts(res.counts);
      } else {
        const localProps = StorageService.getProperties().filter(p => 
          filterStatus === 'all' 
            ? Boolean(p.submitter_phone || p.status === 'pending_review' || p.status === 'rejected')
            : (filterStatus === 'pending_review' ? p.status === 'pending_review' : p.status === filterStatus)
        );
        setSubmissions(localProps);
      }
    } catch (e) {
      const localProps = StorageService.getProperties().filter(p => 
        filterStatus === 'all' 
          ? Boolean(p.submitter_phone || p.status === 'pending_review' || p.status === 'rejected')
          : (filterStatus === 'pending_review' ? p.status === 'pending_review' : p.status === filterStatus)
      );
      setSubmissions(localProps);
    }
    setLoading(false);
  };

  const handleOpenReview = (sub: any) => {
    setSelectedSubmission(sub);
    setEditTitle(sub.title || '');
    setEditPrice(String(sub.price || ''));
    setEditArea(String(sub.area || ''));
    setEditDescription(sub.description || '');
    setEditCoords({
      lat: Number(sub.latitude) || 31.4357,
      lng: Number(sub.longitude) || 31.6708,
    });
    setAdminNotes(sub.admin_notes || '');
    setRejectionReason(sub.rejection_reason || '');
    setIsEditMode(false);
    setIsReviewModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    setIsProcessing(true);

    const updateData = {
      title: editTitle.trim() || selectedSubmission.title,
      price: Number(editPrice) || selectedSubmission.price,
      area: Number(editArea) || selectedSubmission.area,
      description: editDescription.trim() || selectedSubmission.description,
      latitude: editCoords.lat,
      longitude: editCoords.lng,
      admin_notes: adminNotes.trim() || undefined,
    };

    try {
      await ApiService.approvePropertySubmission(selectedSubmission.id, updateData);
    } catch (e) {
      console.warn('API approve error, saving to local cache:', e);
    }

    StorageService.updatePropertyStatus(selectedSubmission.id, 'available');

    setIsProcessing(false);
    setIsReviewModalOpen(false);
    loadSubmissions();
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;
    setIsProcessing(true);

    const reason = rejectionReason.trim() || 'العقار لا يطابق شروط وسياسات النشر على سكني';

    try {
      await ApiService.rejectPropertySubmission(selectedSubmission.id, {
        rejection_reason: reason,
        admin_notes: adminNotes.trim() || undefined,
      });
    } catch (e) {
      console.warn('API reject error, saving to local cache:', e);
    }

    StorageService.updatePropertyStatus(selectedSubmission.id, 'rejected');

    setIsProcessing(false);
    setIsReviewModalOpen(false);
    loadSubmissions();
  };

  const filteredSubmissions = submissions.filter(s => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const title = (s.title || '').toLowerCase();
      const name = (s.submitter_name || s.owner_name || '').toLowerCase();
      const phone = (s.submitter_phone || s.owner_phone || '').toLowerCase();
      return title.includes(term) || name.includes(term) || phone.includes(term);
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#8D6A28] flex items-center justify-center font-black">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              مراجعة وتدقيق العقارات المضافة من العملاء
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            مراجعة العقارات المرفوعة من الزوار قبل اعتمادها ونشرها للجمهور
          </p>
        </div>

        <button
          onClick={loadSubmissions}
          disabled={loading}
          className="self-start sm:self-center flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث الطلبات</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالعنوان، الاسم، أو الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-[#8D6A28]"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'pending_review', label: 'بانتظار المراجعة', count: counts.pending },
            { id: 'approved', label: 'تم اعتمادها ونشرها', count: counts.approved },
            { id: 'rejected', label: 'المرفوضة', count: counts.rejected },
            { id: 'all', label: 'الكل', count: counts.all },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                filterStatus === tab.id
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                  filterStatus === tab.id ? 'bg-[#8D6A28] text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <DashboardTableSkeleton rows={6} />
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs">
          <ModernStateFeedback
            type="empty"
            title="لا توجد طلبات إضافة عقارات في هذه الحالة"
            description={searchTerm ? 'جرب البحث بعنوان أو هاتف آخر.' : 'كافة العقارات المضافة من قبل العملاء تمت مراجعتها وتحديث حالتها بنجاح.'}
            actionText={searchTerm ? 'إعادة ضبط البحث' : undefined}
            onAction={searchTerm ? () => setSearchTerm('') : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubmissions.map((sub) => {
            const isPending = sub.submission_status === 'pending_review' || sub.status === 'pending_review';
            const isApproved = sub.submission_status === 'approved' || (sub.status === 'available' && !sub.rejection_reason);
            const isRejected = sub.submission_status === 'rejected' || sub.status === 'rejected';

            const images = sub.images || sub.images_gallery || [];
            const primaryImg = typeof images[0] === 'string' ? images[0] : (images[0]?.image_path || images[0]?.url || FALLBACK_PROPERTY_IMAGE);

            return (
              <div 
                key={sub.id} 
                className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col justify-between group"
              >
                {/* Image Banner & Status Badge */}
                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                  <img 
                    src={primaryImg} 
                    alt={sub.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute('src', FALLBACK_PROPERTY_IMAGE);
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    {isPending && (
                      <span className="px-3 py-1 rounded-xl bg-amber-500 text-white text-xs font-black shadow flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        بانتظار المراجعة
                      </span>
                    )}
                    {isApproved && (
                      <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-xs font-black shadow flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        معتمد ومنشور
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-black shadow flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        مرفوض
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white text-xs z-10 flex items-center justify-between font-bold">
                    <span className="font-mono">{Number(sub.price).toLocaleString('ar-EG')} ج.م</span>
                    <span>{sub.area} م²</span>
                  </div>
                </div>

                {/* Submitter & Property Details */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-black text-slate-900 text-base line-clamp-1">
                      {sub.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {sub.description || 'لا يوجد وصف تفصيلي'}
                    </p>

                    {/* Submitter Info Card */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-700 font-semibold">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[#8D6A28]" />
                        <span>صاحب العقار: <strong>{sub.submitter_name || sub.owner_name || 'غير محدد'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-mono text-emerald-800">{sub.submitter_phone || sub.owner_phone || '-'}</span>
                      </div>
                    </div>

                    {isRejected && sub.rejection_reason && (
                      <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                        <strong>سبب الرفض:</strong> {sub.rejection_reason}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenReview(sub)}
                      className="w-full py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#8D6A28] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{isPending ? 'مراجعة واعتماد العقار' : 'عرض التفاصيل الكاملة'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------- REVIEW & APPROVE VIEWPORT-CENTERED MODAL ---------------- */}
      <AdminModal
        isOpen={isReviewModalOpen && selectedSubmission !== null}
        onClose={() => setIsReviewModalOpen(false)}
        title="مراجعة وتدقيق بيانات العقار المضاف"
        subtitle={`صاحب العقار: ${selectedSubmission?.submitter_name || selectedSubmission?.owner_name || 'غير محدد'}`}
        icon={<ShieldCheck className="w-5 h-5 text-[#8D6A28]" />}
        maxWidth="2xl"
      >
        {selectedSubmission && (
          <div className="space-y-4">
            {/* Toggle Edit Mode */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black text-slate-700">
                {isEditMode ? 'وضع التعديل المباشر مفعل' : 'عرض بيانات الطلب'}
              </span>
              <button
                type="button"
                onClick={() => setIsEditMode(!isEditMode)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#8D6A28]" />
                <span>{isEditMode ? 'إلغاء التعديل' : 'تعديل البيانات قبل الاعتماد'}</span>
              </button>
            </div>

            {/* Editable / Review Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الإعلان</label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 outline-none focus:border-[#8D6A28]"
                  />
                ) : (
                  <p className="p-3 rounded-xl bg-slate-50 text-xs font-bold text-slate-800">{selectedSubmission.title}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعر (ج.م)</label>
                  {isEditMode ? (
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 outline-none focus:border-[#8D6A28] font-mono"
                    />
                  ) : (
                    <p className="p-3 rounded-xl bg-slate-50 text-xs font-bold text-slate-800 font-mono">
                      {Number(selectedSubmission.price).toLocaleString('ar-EG')} ج.م
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المساحة (م²)</label>
                  {isEditMode ? (
                    <input
                      type="number"
                      value={editArea}
                      onChange={(e) => setEditArea(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 outline-none focus:border-[#8D6A28] font-mono"
                    />
                  ) : (
                    <p className="p-3 rounded-xl bg-slate-50 text-xs font-bold text-slate-800 font-mono">
                      {selectedSubmission.area} م²
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف العقار</label>
                {isEditMode ? (
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 outline-none focus:border-[#8D6A28]"
                  />
                ) : (
                  <p className="p-3 rounded-xl bg-slate-50 text-xs text-slate-700 leading-relaxed">
                    {selectedSubmission.description || 'لا يوجد وصف مضاف'}
                  </p>
                )}
              </div>

              {/* Submitter Contact Card */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1 text-xs text-amber-950 font-bold">
                <div>الاسم: {selectedSubmission.submitter_name || selectedSubmission.owner_name}</div>
                <div>الهاتف: {selectedSubmission.submitter_phone || selectedSubmission.owner_phone}</div>
                {selectedSubmission.submitter_notes && <div>ملاحظات المعلن: {selectedSubmission.submitter_notes}</div>}
              </div>

              {/* Rejection Reason Input */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700">سبب الرفض (يصل لصاحب العقار في حالة عدم الموافقة)</label>
                <input
                  type="text"
                  placeholder="مثال: يرجى إرفاق صور أوضح للعقار أو مراجعة السعر..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 outline-none focus:border-rose-400"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleReject}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>رفض العقار</span>
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={isProcessing}
                className="px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isProcessing ? 'جاري النشر...' : 'اعتماد ونشر العقار على المنصة'}</span>
              </button>
            </div>
          </div>
        )}
      </AdminModal>

    </div>
  );
};
