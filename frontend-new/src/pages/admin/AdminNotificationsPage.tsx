import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/apiService';
import { onPushNotification, requestNotificationPermission, PushNotificationPayload } from '../../services/firebaseService';
import { isSoundEnabled, setSoundEnabled, playNotificationSound } from '../../utils/sound';
import { 
  Bell, 
  Search, 
  Filter, 
  CheckCheck, 
  Trash2, 
  CalendarCheck, 
  MessageSquare, 
  FileText, 
  Sparkles, 
  Clock, 
  ExternalLink,
  Volume2,
  VolumeX,
  ShieldCheck,
  CheckCircle2,
  Send,
  AlertCircle
} from 'lucide-react';
import { NotificationSkeleton, ModernStateFeedback } from '../../components/Skeletons';

interface NotificationItem {
  id: string | number;
  type: string;
  recipient_type?: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

export const AdminNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [soundActive, setSoundActive] = useState(isSoundEnabled());
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerTitle, setComposerTitle] = useState('');
  const [composerMessage, setComposerMessage] = useState('');
  const [composerLink, setComposerLink] = useState('');
  const [composerScope, setComposerScope] = useState<'active_users' | 'all_users' | 'specific_phone'>('active_users');
  const [composerPhone, setComposerPhone] = useState('');
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [composerSuccess, setComposerSuccess] = useState<string | null>(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [activeRecipientsInfo, setActiveRecipientsInfo] = useState<{
    active_devices_count: number;
    active_customers_count: number;
    total_active_recipients: number;
    criteria: string;
  } | null>(null);

  useEffect(() => {
    loadNotifications();
    loadActiveRecipientsCount();

    const unsubscribe = onPushNotification((payload: PushNotificationPayload) => {
      const newItem: NotificationItem = {
        id: payload.id || `notif-${Date.now()}`,
        type: payload.type,
        title: payload.title,
        message: payload.body,
        link: payload.route,
        is_read: false,
        created_at: payload.created_at || new Date().toISOString(),
        data: payload.data,
      };

      setNotifications((prev) => [newItem, ...prev]);
    });

    return () => unsubscribe();
  }, []);

  const loadActiveRecipientsCount = async () => {
    try {
      const res = await ApiService.getActiveRecipientsCount();
      if (res && res.success) {
        setActiveRecipientsInfo(res);
      }
    } catch (e) {}
  };

  const handleSendManualBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerTitle.trim() || !composerMessage.trim()) {
      setComposerError('يرجى كتابة عنوان ورسالة الإشعار');
      return;
    }
    if (composerScope === 'specific_phone' && !composerPhone.trim()) {
      setComposerError('يرجى إدخال رقم هاتف العميل المستهدف');
      return;
    }

    setComposerError(null);
    setComposerSuccess(null);
    setIsSendingNotification(true);

    try {
      const res = await ApiService.sendManualNotification({
        title: composerTitle.trim(),
        message: composerMessage.trim(),
        link: composerLink.trim() || '/',
        target_scope: composerScope,
        customer_phone: composerScope === 'specific_phone' ? composerPhone.trim() : undefined,
      });

      if (res && res.success) {
        setComposerSuccess(res.message || 'تم إرسال الإشعار بنجاح');
        setComposerTitle('');
        setComposerMessage('');
        setComposerLink('');
        setComposerPhone('');
        loadNotifications();
        loadActiveRecipientsCount();
        setTimeout(() => setComposerSuccess(null), 5000);
      } else {
        setComposerError(res?.message || 'حدث خطأ أثناء إرسال الإشعار');
      }
    } catch (err: any) {
      setComposerError(err?.message || 'تعذر إرسال الإشعار');
    } finally {
      setIsSendingNotification(false);
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getNotifications();
      if (res && res.data) {
        setNotifications(res.data);
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    if (next) {
      playNotificationSound(undefined, 'admin');
    }
  };

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    await requestNotificationPermission('admin');
    setIsRequestingPermission(false);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
  };

  const handleMarkAsRead = async (id: string | number) => {
    try {
      await ApiService.markNotificationAsRead(id);
    } catch (e) {}

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    try {
      await ApiService.markAllNotificationsAsRead();
    } catch (e) {}

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleDeleteNotification = async (id: string | number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الإشعار؟')) {
      try {
        await ApiService.deleteNotification(id);
      } catch (e) {}

      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const filtered = notifications.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === 'all'
        ? true
        : filterType === 'unread'
        ? !n.is_read
        : n.type.includes(filterType);

    return matchesSearch && matchesType;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getIcon = (type: string) => {
    if (type.includes('reservation')) {
      return <CalendarCheck className="w-5 h-5 text-[#8D6A28]" />;
    }
    if (type.includes('contact') || type.includes('message')) {
      return <MessageSquare className="w-5 h-5 text-blue-600" />;
    }
    if (type.includes('need')) {
      return <FileText className="w-5 h-5 text-purple-600" />;
    }
    return <Sparkles className="w-5 h-5 text-emerald-600" />;
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-7 h-7 text-[#8D6A28]" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed">
              سجل الإشعارات والتنبيهات
            </h1>
          </div>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">
            متابعة سجل الإشعارات الفورية الواردة من العملاء والتحكم في تفضيلات التنبيهات ({notifications.length} إشعار مسجل)
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition shadow-xs cursor-pointer ${
              soundActive 
                ? 'bg-amber-50 border-amber-200 text-[#8D6A28]' 
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
          >
            {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundActive ? 'صوت التنبيه مفعل' : 'صوت التنبيه مكتوم'}</span>
          </button>

          {/* Browser Push Permission Status / Button */}
          {permissionState !== 'granted' ? (
            <button
              onClick={handleRequestPermission}
              disabled={isRequestingPermission}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl gold-gradient gold-gradient-hover text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isRequestingPermission ? 'جاري التفعيل...' : 'تفعيل إشعارات المتصفح'}</span>
            </button>
          ) : (
            <span className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>إشعارات المتصفح مفعلة</span>
            </span>
          )}

          {/* Manual Notification Composer Toggle */}
          <button
            onClick={() => setIsComposerOpen(!isComposerOpen)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl gold-gradient gold-gradient-hover text-white text-xs font-black shadow-xs transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isComposerOpen ? 'إغلاق نافذة الإرسال' : 'إرسال إشعار يدوي للعملاء'}</span>
          </button>

          {/* Mark all as read */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-[#8D6A28]" />
              <span>تحديد الكل كمقروء ({unreadCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Manual Notification Composer Panel */}
      {isComposerOpen && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-5 sm:p-6 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#8D6A28]/10 text-[#8D6A28] flex items-center justify-center font-bold">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">إرسال إشعار يدوي فوري للعملاء (Push + In-App)</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  بث رسائل وتنبيهات فورية تظهر داخل الموقع وتصل عبر إشعارات المتصفح
                </p>
              </div>
            </div>

            {activeRecipientsInfo && (
              <span className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-[#8D6A28] text-xs font-black self-start sm:self-auto">
                {activeRecipientsInfo.total_active_recipients} مستخدم نشط مؤهل
              </span>
            )}
          </div>

          {composerSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{composerSuccess}</span>
            </div>
          )}

          {composerError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{composerError}</span>
            </div>
          )}

          <form onSubmit={handleSendManualBroadcast} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الإشعار *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: خصم خاص على شقق دمياط الجديدة / متاح وحدات جديدة"
                  value={composerTitle}
                  onChange={(e) => setComposerTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 focus:border-[#8D6A28] focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الفئة المستهدفة *</label>
                <select
                  value={composerScope}
                  onChange={(e: any) => setComposerScope(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 focus:border-[#8D6A28] outline-none cursor-pointer"
                >
                  <option value="active_users">المستخدمون النشطون (آخر 30 يوماً)</option>
                  <option value="all_users">كافة الأجهزة المسجلة</option>
                  <option value="specific_phone">رقم هاتف عميل محدد</option>
                </select>
              </div>
            </div>

            {composerScope === 'specific_phone' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم هاتف العميل *</label>
                <input
                  type="tel"
                  required
                  placeholder="010XXXXXXXX"
                  value={composerPhone}
                  onChange={(e) => setComposerPhone(e.target.value)}
                  className="w-full sm:w-80 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 focus:border-[#8D6A28] outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نص رسالة الإشعار *</label>
              <textarea
                required
                rows={2}
                placeholder="اكتب تفاصيل الإشعار هنا بوضوح..."
                value={composerMessage}
                onChange={(e) => setComposerMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 focus:border-[#8D6A28] outline-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">رابط الوجهة (اختياري)</label>
                <input
                  type="text"
                  placeholder="/properties أو /properties/12"
                  value={composerLink}
                  onChange={(e) => setComposerLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono text-slate-800 focus:border-[#8D6A28] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSendingNotification}
                className="w-full py-2.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSendingNotification ? 'جاري الإرسال...' : 'إرسال الإشعار الآن'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث في الإشعارات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#8D6A28] focus:bg-white transition"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar">
          {[
            { id: 'all', label: `الكل (${notifications.length})` },
            { id: 'unread', label: `غير المقروءة (${unreadCount})` },
            { id: 'reservation', label: 'الحجوزات' },
            { id: 'need', label: 'الطلبات الخاصة' },
            { id: 'contact', label: 'رسائل التواصل' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filterType === tab.id
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* Notifications History List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <div className="p-4 space-y-3">
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <ModernStateFeedback
              type="empty"
              title="لا توجد إشعارات مطابقة"
              description="لم يتم العثور على أية إشعارات في هذا التصنيف حالياً. ستظهر هنا الإشعارات الجديدة فور حدوثها."
              actionText={filterType !== 'all' || searchTerm ? 'عرض كافة الإشعارات' : undefined}
              onAction={filterType !== 'all' || searchTerm ? () => { setFilterType('all'); setSearchTerm(''); } : undefined}
            />
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.is_read) handleMarkAsRead(n.id);
                if (n.link) navigate(n.link);
              }}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 hover:bg-slate-50/80 transition cursor-pointer w-full min-w-0 ${
                !n.is_read ? 'bg-amber-50/40' : 'bg-white'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0 flex-1 w-full">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
                  {getIcon(n.type)}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-sm text-slate-900 break-words [overflow-wrap:anywhere]">
                      {n.title}
                    </h4>
                    {!n.is_read && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black shrink-0">
                        جديد
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl break-words [overflow-wrap:anywhere]">
                    {n.message}
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 font-mono flex-wrap">
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(n.created_at).toLocaleString('ar-EG')}</span>
                    </span>
                    {n.link && (
                      <span className="text-[#8D6A28] font-bold flex items-center gap-1 break-all">
                        <span>انتقال للسجل</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Row Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {!n.is_read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(n.id);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-[#8D6A28] hover:bg-white transition cursor-pointer"
                    title="تحديد كمقروء"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNotification(n.id);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="حذف الإشعار"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
