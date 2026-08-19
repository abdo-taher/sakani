import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Trash2, 
  CheckCircle2, 
  Star, 
  Sparkles, 
  MessageSquare, 
  HelpCircle, 
  ToggleLeft, 
  ToggleRight, 
  TrendingUp, 
  Users, 
  Phone, 
  Calendar, 
  Eye, 
  ListChecks, 
  Check, 
  AlertCircle,
  BarChart3,
  Layers,
  Send
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { ApiService } from '../services/apiService';
import { FeedbackCampaign, FeedbackResponse, FeedbackCampaignType, FeedbackCampaignStats } from '../types';

interface AdminFeedbackCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminFeedbackCampaignModal: React.FC<AdminFeedbackCampaignModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'create' | 'responses'>('campaigns');
  const [campaigns, setCampaigns] = useState<FeedbackCampaign[]>([]);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [stats, setStats] = useState<FeedbackCampaignStats | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Form State for creating new campaign
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<FeedbackCampaignType>('rating');
  const [question, setQuestion] = useState('');
  const [targetPage, setTargetPage] = useState<'all' | 'home' | 'properties' | 'reservations'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [delaySeconds, setDelaySeconds] = useState<number>(60);
  const [options, setOptions] = useState<Array<{ id: string; label: string }>>([
    { id: 'opt-1', label: 'ممتازة جداً وسريعة 🌟' },
    { id: 'opt-2', label: 'جيدة ومفيدة 👍' },
    { id: 'opt-3', label: 'مقبولة وبحاجة لتحسين 👌' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = () => {
    const s = StorageService.getFeedbackStats();
    setStats(s);
    setCampaigns(s.campaigns);
    setResponses(StorageService.getFeedbackResponses());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    StorageService.toggleFeedbackCampaignStatus(id, !currentStatus);
    loadData();
    showToast('تم تحديث حالة الحملة بنجاح');
  };

  const handleDeleteCampaign = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الحملة؟')) {
      StorageService.deleteFeedbackCampaign(id);
      loadData();
      showToast('تم حذف الحملة بنجاح');
    }
  };

  const handleAddOption = () => {
    setOptions([...options, { id: `opt-${Date.now()}`, label: '' }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      alert('يجب أن تحتوي الحملة على خيارين على الأقل');
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, val: string) => {
    const next = [...options];
    next[index].label = val;
    setOptions(next);
  };

  const showToast = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !question.trim()) {
      alert('يرجى كتابة عنوان الحملة والسؤال الرئيسي');
      return;
    }

    if (type === 'choice') {
      const validOpts = options.filter(o => o.label.trim().length > 0);
      if (validOpts.length < 2) {
        alert('يرجى كتابة خيارين على الأقل للاستطلاع متعدد الخيارات');
        return;
      }
    }

    setIsSubmitting(true);

    const newCampaignData: Omit<FeedbackCampaign, 'id' | 'created_at'> = {
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      question: question.trim(),
      target_page: targetPage,
      start_date: startDate.trim() || null,
      end_date: endDate.trim() || null,
      delay_seconds: delaySeconds || 60,
      is_active: true,
      options: type === 'choice' ? options.filter(o => o.label.trim().length > 0) : undefined,
    };

    try {
      await ApiService.createFeedbackCampaign(newCampaignData);
    } catch {
      StorageService.saveFeedbackCampaign(newCampaignData);
    }

    setIsSubmitting(false);
    showToast('تم إطلاق وجدولة حملة الاستطلاع بنجاح!');

    // Reset Form
    setTitle('');
    setDescription('');
    setQuestion('');
    setType('rating');
    setStartDate('');
    setEndDate('');
    setDelaySeconds(60);
    setOptions([
      { id: 'opt-1', label: 'ممتازة جداً وسريعة 🌟' },
      { id: 'opt-2', label: 'جيدة ومفيدة 👍' },
      { id: 'opt-3', label: 'مقبولة وبحاجة لتحسين 👌' },
    ]);
    setActiveTab('campaigns');
    loadData();
  };

  if (!isOpen) return null;

  const filteredResponses = responses.filter(r => {
    const matchCamp = selectedCampaignId === 'all' || String(r.campaign_id) === String(selectedCampaignId);
    const s = typeof searchFilter === 'string' ? searchFilter.trim().toLowerCase() : '';
    const matchSearch = !s || 
      (typeof r.client_name === 'string' && r.client_name.toLowerCase().includes(s)) ||
      (typeof r.client_phone === 'string' && r.client_phone.includes(s)) ||
      (typeof r.comment === 'string' && r.comment.toLowerCase().includes(s)) ||
      (typeof r.selected_option_label === 'string' && r.selected_option_label.toLowerCase().includes(s));
    return matchCamp && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#8D6A28] p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-[#D6A94E] flex items-center justify-center border border-amber-400/30 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black">إدارة استطلاعات وحملات تقييم العملاء</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                  Feedback Campaigns
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                إنشاء حملات استطلاع رأي تظهر للعملاء مرة واحدة فقط وجمع إحصائيات الرضا
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats Summary Strip */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:p-4 bg-slate-50 border-b border-slate-200 text-xs">
            <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-[11px] block">إجمالي الحملات</span>
                <span className="text-base font-black text-slate-900">{stats.total_campaigns}</span>
              </div>
              <Layers className="w-5 h-5 text-[#8D6A28]" />
            </div>

            <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-[11px] block">الحملات النشطة</span>
                <span className="text-base font-black text-emerald-600">{stats.active_campaigns}</span>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-[11px] block">إجمالي الاستجابات</span>
                <span className="text-base font-black text-blue-600">{stats.total_responses}</span>
              </div>
              <Users className="w-5 h-5 text-blue-600" />
            </div>

            <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-[11px] block">معدل رضا العملاء</span>
                <span className="text-base font-black text-[#8D6A28]">{stats.average_satisfaction_percentage}%</span>
              </div>
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-3 bg-white border-b border-slate-200">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'campaigns'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>الحملات الحالية ({campaigns.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-[#8D6A28] text-white shadow-xs'
                : 'text-[#8D6A28] hover:bg-amber-50'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>+ إنشاء استطلاع جديد</span>
          </button>

          <button
            onClick={() => setActiveTab('responses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'responses'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>استجابات العملاء ({responses.length})</span>
          </button>
        </div>

        {/* Success Toast */}
        {actionSuccess && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* TAB 1: ALL CAMPAIGNS */}
          {activeTab === 'campaigns' && (
            <div className="space-y-3">
              {campaigns.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-3">
                  <Layers className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="text-sm font-bold">لا توجد حملات استطلاع حالياً</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 rounded-xl bg-[#8D6A28] text-white text-xs font-bold"
                  >
                    إنشاء أول حملة استطلاع
                  </button>
                </div>
              ) : (
                campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-amber-300/80 bg-white transition space-y-3 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                            {camp.title}
                          </h4>
                          {(() => {
                            const now = new Date();
                            const isScheduledFuture = camp.start_date && new Date(camp.start_date) > now;
                            const isExpired = camp.end_date && new Date(camp.end_date) < now;

                            if (!camp.is_active) {
                              return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">⚪ متوقف مؤقتاً</span>;
                            }
                            if (isExpired) {
                              return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">🔴 منتهية الصلاحية</span>;
                            }
                            if (isScheduledFuture) {
                              return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">⏳ مجدولة للمستقبل</span>;
                            }
                            return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">🟢 نشطة الآن للعملاء</span>;
                          })()}
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-[#8D6A28] text-[10px] font-bold">
                            {camp.type === 'rating' ? '⭐ تقييم نجوم' : camp.type === 'choice' ? '🔘 اختيار متعدد' : '📝 نص حر'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-bold">
                            ⏱️ ظهور بعد: {camp.delay_seconds ? (camp.delay_seconds >= 60 ? `${camp.delay_seconds / 60} دقيقة` : `${camp.delay_seconds} ثانية`) : 'دقيقة'}
                          </span>
                        </div>
                        {camp.description && (
                          <p className="text-xs text-slate-500">{camp.description}</p>
                        )}
                        <p className="text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100 mt-1">
                          ❓ السؤال: {camp.question}
                        </p>
                        {(camp.start_date || camp.end_date) && (
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono bg-slate-50/70 p-1.5 px-2.5 rounded-lg border border-slate-100">
                            {camp.start_date && <span>📅 البدء: {new Date(camp.start_date).toLocaleString('ar-EG')}</span>}
                            {camp.end_date && <span>🏁 الانتهاء: {new Date(camp.end_date).toLocaleString('ar-EG')}</span>}
                          </div>
                        )}
                      </div>

                      {/* Stats & Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(camp.id, camp.is_active)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            camp.is_active
                              ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                              : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                          }`}
                        >
                          {camp.is_active ? 'إيقاف مؤقت' : 'تفعيل'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCampaign(camp.id)}
                          className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition cursor-pointer"
                          title="حذف الحملة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-700">
                          📊 الاستجابات: <span className="text-[#8D6A28]">{camp.responses_count || 0}</span>
                        </span>
                        {camp.average_rating && (
                          <span className="flex items-center gap-1 text-amber-600 font-bold">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{camp.average_rating} / 5</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono" dir="ltr">
                        تاريخ الإنشاء: {new Date(camp.created_at).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: CREATE NEW CAMPAIGN */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateCampaign} className="space-y-4 max-w-2xl mx-auto">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                <span className="font-bold block flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#8D6A28]" />
                  <span>آلية استطلاع الرأي للعملاء:</span>
                </span>
                <p className="text-slate-600 leading-relaxed">
                  يظهر الاستطلاع تلقائياً للزائر أو العميل في الموقع **لمرة واحدة فقط**، وبعد إجابته أو إغلاقه لن يتم إزعاجه مرة أخرى بنفس الحملة.
                </p>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">عنوان الحملة / الاستطلاع *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: استطلاع تقييم سرعة المعاينات والحجز بدون سماسرة"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-[#8D6A28] focus:ring-2 focus:ring-[#8D6A28]/20 outline-hidden"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">وصف توضيحي للعميل (اختياري)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="مثال: رأيك يهمنا لتطوير وتسهيل سكن الطالبات والشباب في دمياط الجديدة"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-[#8D6A28] focus:ring-2 focus:ring-[#8D6A28]/20 outline-hidden"
                />
              </div>

              {/* Question */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">السؤال الرئيسي الذي سيجيب عليه العميل *</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="مثال: ما مدى رضاك عن دقة صور وفيديوهات العقارات المعروضة؟"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-[#8D6A28] focus:ring-2 focus:ring-[#8D6A28]/20 outline-hidden"
                  required
                />
              </div>

              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('rating')}
                  className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                    type === 'rating'
                      ? 'border-[#8D6A28] bg-amber-50/80 text-[#8D6A28] ring-2 ring-[#8D6A28]/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500 mb-1" />
                  <span className="text-xs font-bold block">تقييم بالنجوم (1 - 5 ⭐)</span>
                  <span className="text-[10px] text-slate-500">الأفضل لقياس الرضا العام والسرعة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('choice')}
                  className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                    type === 'choice'
                      ? 'border-[#8D6A28] bg-amber-50/80 text-[#8D6A28] ring-2 ring-[#8D6A28]/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <ListChecks className="w-5 h-5 text-blue-500 mb-1" />
                  <span className="text-xs font-bold block">خيارات متعددة (Multiple Choice)</span>
                  <span className="text-[10px] text-slate-500">لاختيار السبب أو القناة أو الميزة المفضلة</span>
                </button>
              </div>

              {/* Multiple Choice Options Builder */}
              {type === 'choice' && (
                <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 block">خيارات الإجابة:</label>
                  {options.map((opt, idx) => (
                    <div key={opt.id || idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.label}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`خيار ${idx + 1}`}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-rose-100 hover:text-rose-600 text-slate-600 flex items-center justify-center transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs font-bold text-[#8D6A28] hover:underline flex items-center gap-1 mt-2 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ إضافة خيار آخر</span>
                  </button>
                </div>
              )}

              {/* Timing, Schedule & Target Page Settings */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#8D6A28]" />
                  <span>جدولة وتوقيت ظهور الاستطلاع (خاص بهذه الحملة):</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Trigger Delay */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">تأخير الظهور بعد الدخول:</label>
                    <select
                      value={delaySeconds}
                      onChange={(e) => setDelaySeconds(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                    >
                      <option value={10}>بعد 10 ثوانٍ (فوري)</option>
                      <option value={30}>بعد 30 ثانية</option>
                      <option value={60}>بعد دقيقة واحدة (موصى به)</option>
                      <option value={180}>بعد 3 دقائق</option>
                      <option value={300}>بعد 5 دقائق</option>
                      <option value={600}>بعد 10 دقائق</option>
                    </select>
                  </div>

                  {/* Start Date */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">تاريخ بدء الظهور (اختياري):</label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white"
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">تاريخ انتهاء الظهور (اختياري):</label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white"
                    />
                  </div>
                </div>

                {/* Target Page */}
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-bold text-slate-700">الصفحة المستهدفة للظهور:</label>
                  <select
                    value={targetPage}
                    onChange={(e) => setTargetPage(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                  >
                    <option value="all">كافة صفحات المنصة (عام)</option>
                    <option value="home">الصفحة الرئيسية فقط</option>
                    <option value="properties">صفحة تصفح وقائمة العقارات</option>
                    <option value="reservations">صفحة طلبات الحجز والمعاينات</option>
                  </select>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#8D6A28] hover:bg-[#73541D] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'جاري الإطلاق...' : 'إطلاق وجدولة الحملة الآن للعملاء'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: RESPONSES LOG */}
          {activeTab === 'responses' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700">تصفية حسب الحملة:</label>
                  <select
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                  >
                    <option value="all">كافة الحملات ({responses.length})</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="بحث في الاسم أو التعليق..."
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white w-48"
                />
              </div>

              {filteredResponses.length === 0 ? (
                <p className="text-center py-12 text-slate-400 text-xs font-bold">
                  لا توجد استجابات مطابقة للبحث أو التصفية
                </p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white overflow-hidden">
                  {filteredResponses.map((r) => (
                    <div key={r.id} className="p-4 hover:bg-slate-50/70 transition space-y-1.5 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900">
                            {r.client_name || 'عميل / زائر المنصة'}
                          </span>
                          {r.client_phone && (
                            <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {r.client_phone}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            ({r.campaign_title || 'استطلاع'})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {r.rating !== undefined && (
                            <span className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/80">
                              <Star className="w-3 h-3 fill-current" />
                              <span>{r.rating} / 5</span>
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                            {new Date(r.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {r.selected_option_label && (
                        <p className="text-slate-800 font-semibold">
                          🔹 الإجابة: <span className="text-[#8D6A28]">{r.selected_option_label}</span>
                        </p>
                      )}

                      {r.comment && (
                        <p className="text-slate-600 bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/60 leading-relaxed">
                          💬 "{r.comment}"
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-1">
                        <span>الجهاز: {r.device_type === 'mobile' ? '📱 هاتف' : '💻 كمبيوتر'}</span>
                        {r.page_url && <span>الصفحة: {r.page_url}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
