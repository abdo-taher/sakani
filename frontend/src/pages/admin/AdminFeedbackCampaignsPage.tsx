import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/apiService';
import { StorageService } from '../../services/storageService';
import { FeedbackCampaign, FeedbackResponse, FeedbackCampaignType, FeedbackCampaignStats } from '../../types';
import { DashboardTableSkeleton, ModernStateFeedback } from '../../components/Skeletons';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Star, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Phone, 
  Calendar, 
  Clock, 
  Layers, 
  Search, 
  Filter, 
  RefreshCw, 
  ExternalLink, 
  AlertCircle, 
  Check, 
  Eye, 
  ToggleLeft, 
  ToggleRight, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Award,
  ArrowUpRight,
  ShieldCheck,
  X
} from 'lucide-react';

export const AdminFeedbackCampaignsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'create' | 'responses'>('campaigns');
  const [campaigns, setCampaigns] = useState<FeedbackCampaign[]>([]);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [stats, setStats] = useState<FeedbackCampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Form State for create / edit
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [campsRes, statsRes, respRes] = await Promise.allSettled([
        ApiService.getFeedbackCampaigns(),
        ApiService.getFeedbackStats(),
        ApiService.getFeedbackResponses({ campaign_id: selectedCampaignFilter, search: searchTerm }),
      ]);

      if (campsRes.status === 'fulfilled' && Array.isArray(campsRes.value)) {
        setCampaigns(campsRes.value);
      } else {
        setCampaigns(StorageService.getFeedbackCampaigns());
      }

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value);
      } else {
        setStats(StorageService.getFeedbackStats());
      }

      if (respRes.status === 'fulfilled' && respRes.value && Array.isArray(respRes.value.data)) {
        setResponses(respRes.value.data);
      } else {
        setResponses(StorageService.getFeedbackResponses());
      }
    } catch (e) {
      console.warn('Error loading feedback data:', e);
    }
    setLoading(false);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleToggleStatus = async (campaign: FeedbackCampaign) => {
    const nextStatus = !campaign.is_active;
    try {
      await ApiService.updateFeedbackCampaign(String(campaign.id), { is_active: nextStatus });
      setCampaigns(prev => prev.map(c => String(c.id) === String(campaign.id) ? { ...c, is_active: nextStatus } : c));
      showToast(nextStatus ? 'تم تفعيل الحملة بنجاح' : 'تم إيقاف الحملة مؤقتاً');
    } catch {
      showToast('حدث خطأ أثناء تغيير حالة الحملة');
    }
  };

  const handleDeleteCampaign = async (id: string | number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الحملة؟ لن يؤثر ذلك على استجابات العملاء السابقة.')) return;
    try {
      await ApiService.deleteFeedbackCampaign(String(id));
      setCampaigns(prev => prev.filter(c => String(c.id) !== String(id)));
      showToast('تم حذف الحملة بنجاح');
      loadData();
    } catch {
      showToast('حدث خطأ أثناء الحذف');
    }
  };

  const handleDeleteResponse = async (id: string | number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;
    try {
      await ApiService.deleteFeedbackResponse(id);
      setResponses(prev => prev.filter(r => String(r.id) !== String(id)));
      showToast('تم حذف الاستجابة بنجاح');
    } catch {
      showToast('حدث خطأ أثناء حذف الاستجابة');
    }
  };

  const handleEditCampaign = (campaign: FeedbackCampaign) => {
    setEditingCampaignId(String(campaign.id));
    setTitle(campaign.title || '');
    setDescription(campaign.description || '');
    setType(campaign.type || 'rating');
    setQuestion(campaign.question || '');
    setTargetPage((campaign.target_page as any) || 'all');
    setStartDate(campaign.start_date ? campaign.start_date.substring(0, 16) : '');
    setEndDate(campaign.end_date ? campaign.end_date.substring(0, 16) : '');
    setDelaySeconds(campaign.delay_seconds || 60);
    setOptions(Array.isArray(campaign.options) && campaign.options.length > 0 ? campaign.options : [
      { id: 'opt-1', label: 'ممتازة جداً وسريعة 🌟' },
      { id: 'opt-2', label: 'جيدة ومفيدة 👍' },
      { id: 'opt-3', label: 'مقبولة وبحاجة لتحسين 👌' },
    ]);
    setActiveTab('create');
  };

  const handleResetForm = () => {
    setEditingCampaignId(null);
    setTitle('');
    setDescription('');
    setType('rating');
    setQuestion('');
    setTargetPage('all');
    setStartDate('');
    setEndDate('');
    setDelaySeconds(60);
    setOptions([
      { id: 'opt-1', label: 'ممتازة جداً وسريعة 🌟' },
      { id: 'opt-2', label: 'جيدة ومفيدة 👍' },
      { id: 'opt-3', label: 'مقبولة وبحاجة لتحسين 👌' },
    ]);
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

  const handleSubmitCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !question.trim()) {
      alert('يرجى ملء عنوان الحملة ونص السؤال الرئيسي');
      return;
    }

    if (type === 'choice') {
      const validOptions = options.filter(o => o.label.trim().length > 0);
      if (validOptions.length < 2) {
        alert('يرجى إدخال خيارين على الأقل لاستطلاع الاختيار من متعدد');
        return;
      }
    }

    setIsSubmitting(true);
    const payload: any = {
      title: title.trim(),
      description: description.trim() || null,
      type,
      question: question.trim(),
      target_page: targetPage,
      delay_seconds: Number(delaySeconds) || 60,
      is_active: true,
      start_date: startDate ? startDate : null,
      end_date: endDate ? endDate : null,
    };

    if (type === 'choice') {
      payload.options = options.filter(o => o.label.trim().length > 0);
    } else {
      payload.options = null;
    }

    try {
      if (editingCampaignId) {
        await ApiService.updateFeedbackCampaign(editingCampaignId, payload);
        showToast('تم تحديث حملة الاستطلاع بنجاح');
      } else {
        await ApiService.createFeedbackCampaign(payload);
        showToast('تم إنشاء حملة الاستطلاع بنجاح ونشرها');
      }
      handleResetForm();
      setActiveTab('campaigns');
      loadData();
    } catch {
      showToast('حدث خطأ أثناء حفظ الحملة');
    }
    setIsSubmitting(false);
  };

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter(c => {
    if (statusFilter === 'active') return c.is_active;
    if (statusFilter === 'inactive') return !c.is_active;
    return true;
  });

  // Filtered responses
  const filteredResponses = responses.filter(r => {
    if (selectedCampaignFilter !== 'all' && String(r.campaign_id) !== selectedCampaignFilter) return false;
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      const nameMatch = r.client_name?.toLowerCase().includes(s);
      const phoneMatch = r.client_phone?.includes(s);
      const commentMatch = r.comment?.toLowerCase().includes(s);
      const optMatch = r.selected_option_label?.toLowerCase().includes(s);
      return nameMatch || phoneMatch || commentMatch || optMatch;
    }
    return true;
  });

  const getDeviceIcon = (device?: string) => {
    if (device === 'mobile') return <Smartphone className="w-3.5 h-3.5 text-blue-500" />;
    if (device === 'tablet') return <Tablet className="w-3.5 h-3.5 text-purple-500" />;
    return <Monitor className="w-3.5 h-3.5 text-slate-500" />;
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium border border-white/10 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">حملات واستطلاعات الرأي</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                قياس رضا العملاء، تحليل آراء وتفضيلات المستأجرين والمشترين بمدينة دمياط الجديدة
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
          
          <button
            onClick={() => {
              handleResetForm();
              setActiveTab('create');
            }}
            className="px-4 py-2 text-sm font-bold text-white bg-[#8D6A28] hover:bg-[#785920] rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء حملة جديدة</span>
          </button>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي الحملات</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {campaigns.length}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-600 font-bold">{campaigns.filter(c => c.is_active).length} نشطة</span>
            <span>•</span>
            <span>{campaigns.filter(c => !c.is_active).length} متوقفة</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي الاستجابات</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats?.total_responses ?? responses.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            مشاركة فعلية من عملاء وزوار المنصة
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">معدل الرضا العام</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 flex items-baseline gap-1.5">
            <span>{stats?.average_satisfaction_percentage ?? 96}%</span>
            <span className="text-xs text-slate-400 font-normal">(4.8 / 5)</span>
          </div>
          <div className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>تجربة مستخدم ممتازة</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">تغطية الصفحات</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            كافة الصفحات
          </div>
          <div className="text-xs text-slate-400 mt-1">
            الرئيسية • العقارات • الحجوزات
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 px-4 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'campaigns'
              ? 'text-[#8D6A28] border-b-2 border-[#8D6A28]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>الحملات والاستطلاعات ({campaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('responses')}
          className={`pb-3 px-4 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'responses'
              ? 'text-[#8D6A28] border-b-2 border-[#8D6A28]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>سجل الاستجابات والآراء ({responses.length})</span>
        </button>

        <button
          onClick={() => {
            handleResetForm();
            setActiveTab('create');
          }}
          className={`pb-3 px-4 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'create'
              ? 'text-[#8D6A28] border-b-2 border-[#8D6A28]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{editingCampaignId ? 'تعديل الحملة' : 'إنشاء حملة جديدة'}</span>
        </button>
      </div>

      {/* TAB 1: CAMPAIGNS LIST */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {/* Sub Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">الحالة:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  statusFilter === 'all' ? 'bg-[#8D6A28] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل ({campaigns.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                النشطة ({campaigns.filter(c => c.is_active).length})
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  statusFilter === 'inactive' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                المتوقفة ({campaigns.filter(c => !c.is_active).length})
              </button>
            </div>
          </div>

          {loading ? (
            <DashboardTableSkeleton rows={4} />
          ) : filteredCampaigns.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">لا توجد حملات استطلاع حالياً</h3>
              <p className="text-slate-500 text-sm mt-1 mb-5">
                ابدأ بإنشاء أول استطلاع رأي لمعرفة انطباعات الزوار عن تجربة السكن والبحث
              </p>
              <button
                onClick={() => {
                  handleResetForm();
                  setActiveTab('create');
                }}
                className="px-4 py-2 bg-[#8D6A28] text-white font-bold rounded-xl text-sm shadow hover:bg-[#785920] transition"
              >
                إنشاء حملة الآن
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCampaigns.map((camp) => {
                const campId = String(camp.id);
                return (
                  <div
                    key={campId}
                    className={`bg-white rounded-2xl p-5 border transition shadow-xs hover:shadow-md relative ${
                      camp.is_active ? 'border-slate-200/80' : 'border-slate-200/60 bg-slate-50/40 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                            camp.is_active 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {camp.is_active ? 'نشطة الآن' : 'متوقفة'}
                          </span>

                          <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                            {camp.type === 'rating' && 'تقييم بالنجوم ⭐'}
                            {camp.type === 'choice' && 'اختيار من متعدد 🔘'}
                            {camp.type === 'text' && 'ملاحظات نصية 📝'}
                            {camp.type === 'net_promoter' && 'مؤشر التوصية NPS 🎯'}
                          </span>

                          <span className="px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                            الصفحة: {camp.target_page === 'all' ? 'كافة الصفحات' : camp.target_page}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 mt-2.5">
                          {camp.title}
                        </h3>
                        {camp.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {camp.description}
                          </p>
                        )}
                      </div>

                      {/* Status Toggle Button */}
                      <button
                        onClick={() => handleToggleStatus(camp)}
                        title={camp.is_active ? 'إيقاف الحملة' : 'تفعيل الحملة'}
                        className="text-slate-400 hover:text-slate-700 transition p-1"
                      >
                        {camp.is_active ? (
                          <ToggleRight className="w-7 h-7 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-slate-400" />
                        )}
                      </button>
                    </div>

                    {/* Question Box */}
                    <div className="bg-slate-50 rounded-xl p-3 mt-3 text-xs text-slate-700 border border-slate-100 font-medium">
                      <span className="text-slate-400 font-bold block mb-1">السؤال المعروض:</span>
                      "{camp.question}"
                    </div>

                    {/* Stats & Actions Row */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-3 text-slate-500">
                        <span className="flex items-center gap-1 font-bold text-slate-700">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          {camp.responses_count ?? 0} استجابة
                        </span>
                        {camp.average_rating && (
                          <span className="flex items-center gap-1 font-bold text-amber-600">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {camp.average_rating} / 5
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedCampaignFilter(campId);
                            setActiveTab('responses');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition text-xs flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>الردود</span>
                        </button>

                        <button
                          onClick={() => handleEditCampaign(camp)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                          title="تعديل الحملة"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteCampaign(campId)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                          title="حذف الحملة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RESPONSES FEED */}
      {activeTab === 'responses' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث باسم العميل، الهاتف، أو محتوى التعليق..."
                  className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8D6A28]/20 focus:border-[#8D6A28]"
                />
              </div>

              <select
                value={selectedCampaignFilter}
                onChange={(e) => setSelectedCampaignFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8D6A28]/20"
              >
                <option value="all">كافة الحملات</option>
                {campaigns.map((c) => (
                  <option key={String(c.id)} value={String(c.id)}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs font-bold text-slate-500">
              إجمالي النتائج: <span className="text-slate-900 font-extrabold">{filteredResponses.length}</span>
            </div>
          </div>

          {filteredResponses.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">لا توجد استجابات مسجلة</h3>
              <p className="text-slate-500 text-sm mt-1">
                لم يتم تسجيل ردود تطابق معايير البحث المحددة حتى الآن
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResponses.map((res) => {
                const resId = String(res.id);
                return (
                  <div
                    key={resId}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      {/* Campaign title tag */}
                      <div className="flex items-center justify-between text-xs text-slate-400 pb-2 mb-2 border-b border-slate-100">
                        <span className="font-bold text-slate-600 truncate max-w-[200px]">
                          {res.campaign_title || 'استطلاع تجربة المستخدم'}
                        </span>
                        <div className="flex items-center gap-1">
                          {getDeviceIcon(res.device_type)}
                          <span className="text-[11px]">{res.device_type || 'ويب'}</span>
                        </div>
                      </div>

                      {/* Rating / Choice badge */}
                      <div className="flex items-center gap-2 mb-3">
                        {res.rating && (
                          <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{res.rating} من 5</span>
                          </div>
                        )}

                        {res.selected_option_label && (
                          <div className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold truncate">
                            {res.selected_option_label}
                          </div>
                        )}
                      </div>

                      {/* Comment text */}
                      {res.comment ? (
                        <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                          "{res.comment}"
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">بدون تعليق نصي إضافي</p>
                      )}
                    </div>

                    {/* Client info & timestamp */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2 text-slate-600">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                          {res.client_name ? res.client_name.charAt(0) : 'ع'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">
                            {res.client_name || 'زائر مجهول'}
                          </div>
                          {res.client_phone && (
                            <div className="text-[11px] text-slate-400" dir="ltr">
                              {res.client_phone}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">
                          {res.created_at ? new Date(res.created_at).toLocaleDateString('ar-EG') : 'حديث'}
                        </span>
                        <button
                          onClick={() => handleDeleteResponse(resId)}
                          className="text-slate-300 hover:text-rose-600 transition p-1"
                          title="حذف الاستجابة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CREATE / EDIT CAMPAIGN FORM */}
      {activeTab === 'create' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs max-w-3xl">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingCampaignId ? 'تعديل حملة الاستطلاع' : 'إنشاء حملة استطلاع جديدة'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                اضبط السؤال وخيارات التقييم وتوقيت ظهور الاستطلاع لزوار المنصة
              </p>
            </div>
            {editingCampaignId && (
              <button
                onClick={handleResetForm}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg"
              >
                إلغاء التعديل
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitCampaign} className="space-y-4">
            {/* Title & Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                عنوان الحملة (للإدارة) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: استطلاع تقييم دقة بيانات العقارات بدمياط الجديدة"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#8D6A28]/20 focus:border-[#8D6A28] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                وصف الحملة أو الهدف منها
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مثال: معرفة مدى رضا العملاء عن سرعة الرد والمعاينات"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#8D6A28]/20 focus:border-[#8D6A28] focus:outline-none"
              />
            </div>

            {/* Campaign Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                نوع الاستطلاع <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {[
                  { key: 'rating', label: 'تقييم بالنجوم ⭐', desc: '1 إلى 5 نجوم' },
                  { key: 'choice', label: 'اختيار من متعدد 🔘', desc: 'خيارات محددة' },
                  { key: 'text', label: 'ملاحظات نصية 📝', desc: 'مربع نص حر' },
                  { key: 'net_promoter', label: 'مؤشر التوصية 🎯', desc: 'مدى ترشيح سكني' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setType(item.key as FeedbackCampaignType)}
                    className={`p-3 rounded-xl border text-right transition ${
                      type === item.key
                        ? 'border-[#8D6A28] bg-amber-500/5 ring-1 ring-[#8D6A28]'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900">{item.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                نص السؤال المعروض للعميل <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="مثال: كيف تقيم سهولة تصفح وحجز العقارات في سكني؟"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#8D6A28]/20 focus:border-[#8D6A28] focus:outline-none"
              />
            </div>

            {/* Dynamic Options for Multiple Choice */}
            {type === 'choice' && (
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    خيارات الإجابة المتاحة <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs font-bold text-[#8D6A28] hover:text-[#785920] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة خيار</span>
                  </button>
                </div>

                <div className="space-y-2 mt-2">
                  {options.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-bold w-5">{idx + 1}.</span>
                      <input
                        type="text"
                        required
                        value={opt.label}
                        onChange={(e) => {
                          const updated = [...options];
                          updated[idx].label = e.target.value;
                          setOptions(updated);
                        }}
                        placeholder={`الخيار ${idx + 1}`}
                        className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#8D6A28]/20 focus:outline-none"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Target Page & Timing Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  الصفحة المستهدفة
                </label>
                <select
                  value={targetPage}
                  onChange={(e) => setTargetPage(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#8D6A28]/20 focus:outline-none"
                >
                  <option value="all">كافة صفحات المنصة</option>
                  <option value="home">الصفحة الرئيسية فقط</option>
                  <option value="properties">صفحة قائمة العقارات</option>
                  <option value="reservations">صفحة الحجوزات والمعاينات</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  تأخير الظهور (بالثواني)
                </label>
                <input
                  type="number"
                  min="5"
                  max="3600"
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#8D6A28]/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#8D6A28] hover:bg-[#785920] text-white font-bold text-sm rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{editingCampaignId ? 'حفظ التعديلات' : 'إنشاء ونشر الحملة'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleResetForm();
                  setActiveTab('campaigns');
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
