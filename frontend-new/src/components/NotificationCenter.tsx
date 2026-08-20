import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../services/apiService';
import { StorageService } from '../services/storageService';
import { onPushNotification, requestNotificationPermission, PushNotificationPayload } from '../services/firebaseService';
import { isSoundEnabled, setSoundEnabled, playAdminNotificationSound, playCustomerNotificationSound } from '../utils/sound';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Volume2, 
  VolumeX, 
  CalendarCheck, 
  MessageSquare, 
  FileText, 
  Home, 
  Sparkles, 
  X, 
  Clock, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

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

interface NotificationCenterProps {
  role?: 'admin' | 'customer';
  customerPhone?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  role = 'admin',
  customerPhone,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [soundActive, setSoundActive] = useState(isSoundEnabled());
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const prevUnreadCountRef = useRef<number | null>(null);

  useEffect(() => {
    StorageService.ensureWelcomeNotification();
    loadNotifications();

    // Auto-register admin device token in background if permission is already granted and admin is authenticated
    if (role === 'admin' && StorageService.isAdminLoggedIn() && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      requestNotificationPermission('admin').catch(() => {});
    }

    // 1. Subscribe to live incoming push notifications
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

      if (role === 'customer') {
        StorageService.addCustomerNotification({
          id: newItem.id,
          type: newItem.type,
          title: newItem.title,
          message: newItem.message,
          link: newItem.link,
        });
      }

      setNotifications((prev) => [newItem, ...prev.filter(n => String(n.id) !== String(newItem.id))]);
      setUnreadCount((prev) => prev + 1);
    });

    // 2. Subscribe to local customer notifications updates
    const handleLocalNotifsUpdated = (e: Event) => {
      const customEv = e as CustomEvent;
      if (customEv.detail && Array.isArray(customEv.detail) && role === 'customer') {
        const list = customEv.detail;
        setNotifications(list);
        setUnreadCount(list.filter((n: any) => !n.is_read).length);
      }
    };

    window.addEventListener('sakani_customer_notifications_updated', handleLocalNotifsUpdated);

    // 3. Periodic real-time sync (every 15 seconds) & focus sync for Admin
    let intervalId: any = null;
    if (role === 'admin' && StorageService.isAdminLoggedIn()) {
      intervalId = setInterval(() => {
        loadNotifications(true);
      }, 15000);

      const handleWindowFocus = () => {
        loadNotifications(true);
      };
      window.addEventListener('focus', handleWindowFocus);

      return () => {
        unsubscribe();
        window.removeEventListener('sakani_customer_notifications_updated', handleLocalNotifsUpdated);
        window.removeEventListener('focus', handleWindowFocus);
        if (intervalId) clearInterval(intervalId);
      };
    }

    return () => {
      unsubscribe();
      window.removeEventListener('sakani_customer_notifications_updated', handleLocalNotifsUpdated);
      if (intervalId) clearInterval(intervalId);
    };
  }, [role, customerPhone]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadNotifications = async (isPeriodicSync = false) => {
    try {
      if (role === 'customer') {
        StorageService.ensureWelcomeNotification();
        const localList = StorageService.getCustomerNotifications();

        const rawPhone = customerPhone || StorageService.getClientPhone() || '';
        const cleanDigits = rawPhone.replace(/\D/g, '');

        if (cleanDigits.length >= 7) {
          try {
            const res = await ApiService.getCustomerNotifications(cleanDigits).catch(() => null);
            if (res && Array.isArray(res.data) && res.data.length > 0) {
              // Merge backend items and local items (like welcome greeting)
              const mergedMap = new Map<string, NotificationItem>();
              res.data.forEach((item: any) => {
                mergedMap.set(String(item.id), item);
              });
              localList.forEach((item: any) => {
                if (!mergedMap.has(String(item.id))) {
                  mergedMap.set(String(item.id), item);
                }
              });

              const mergedList = Array.from(mergedMap.values()).sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );

              setNotifications(mergedList);
              setUnreadCount(mergedList.filter((n) => !n.is_read).length);
              return;
            }
          } catch (err) {}
        }

        // Default to localList
        setNotifications(localList);
        setUnreadCount(localList.filter((n) => !n.is_read).length);
      } else if (role === 'admin') {
        if (StorageService.isAdminLoggedIn()) {
          const res = await ApiService.getNotifications().catch(() => null);
          if (res && Array.isArray(res.data)) {
            const currentUnread = res.unread_count ?? res.data.filter((n: any) => !n.is_read).length;
            
            // If new unread notifications arrived during periodic sync
            if (isPeriodicSync && prevUnreadCountRef.current !== null && currentUnread > prevUnreadCountRef.current) {
              playAdminNotificationSound();
              
              // Trigger browser desktop notification if permitted
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                const latest = res.data[0];
                if (latest) {
                  try {
                    new Notification(latest.title || 'إشعار جديد في لوحة التحكم', {
                      body: latest.message,
                      icon: '/favicon.svg',
                      tag: `admin-notif-${latest.id}`,
                    });
                  } catch (e) {}
                }
              }
            }

            prevUnreadCountRef.current = currentUnread;
            setNotifications(res.data);
            setUnreadCount(currentUnread);
          }
        } else {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    } catch (e) {
      // Offline fallback
    }
  };

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    if (next) {
      if (role === 'admin') playAdminNotificationSound();
      else playCustomerNotificationSound();
    }
  };

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    await requestNotificationPermission(role === 'customer' ? 'customer' : 'admin', customerPhone);
    setIsRequestingPermission(false);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
  };

  const handleMarkAsRead = async (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (role === 'customer') {
      StorageService.markCustomerNotificationAsRead(id);
    }

    try {
      await ApiService.markNotificationAsRead(id);
    } catch (e) {}

    setNotifications((prev) =>
      prev.map((n) => (String(n.id) === String(id) ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    if (role === 'customer') {
      StorageService.markAllCustomerNotificationsAsRead();
    }

    try {
      const rawPhone = customerPhone || StorageService.getClientPhone() || '';
      const cleanDigits = rawPhone.replace(/\D/g, '');
      await ApiService.markAllNotificationsAsRead(cleanDigits.length >= 7 ? cleanDigits : undefined);
    } catch (e) {}

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleDeleteNotification = async (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (role === 'customer') {
      StorageService.deleteCustomerNotification(id);
    }

    try {
      await ApiService.deleteNotification(id);
    } catch (e) {}

    setNotifications((prev) => prev.filter((n) => String(n.id) !== String(id)));
  };

  const handleItemClick = (notification: NotificationItem) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id, { stopPropagation: () => {} } as any);
    }
    setIsOpen(false);

    if (notification.link) {
      navigate(notification.link);
    }
  };

// Relative time formatter helper
const formatRelativeTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} د`;
    if (diffHours < 24) return `منذ ${diffHours} س`;
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

  const getNotificationBadge = (type: string) => {
    if (type.includes('welcome') || type === 'egyptian_welcome') {
      return {
        icon: <span className="text-sm leading-none">🇪🇬</span>,
        tag: 'ترحيب',
        tagBg: 'bg-amber-100 text-amber-800 border-amber-200',
        iconBg: 'bg-amber-50 text-amber-700'
      };
    }
    if (type.includes('reservation')) {
      return {
        icon: <CalendarCheck className="w-4 h-4 text-emerald-600" />,
        tag: 'طلب حجز',
        tagBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        iconBg: 'bg-emerald-50 text-emerald-700'
      };
    }
    if (type.includes('contact') || type.includes('message')) {
      return {
        icon: <MessageSquare className="w-4 h-4 text-blue-600" />,
        tag: 'رسالة',
        tagBg: 'bg-blue-100 text-blue-800 border-blue-200',
        iconBg: 'bg-blue-50 text-blue-700'
      };
    }
    if (type.includes('need')) {
      return {
        icon: <FileText className="w-4 h-4 text-purple-600" />,
        tag: 'طلب عقار',
        tagBg: 'bg-purple-100 text-purple-800 border-purple-200',
        iconBg: 'bg-purple-50 text-purple-700'
      };
    }
    return {
      icon: <Sparkles className="w-4 h-4 text-[#8D6A28]" />,
      tag: 'عرض جديد',
      tagBg: 'bg-amber-100 text-[#8D6A28] border-amber-200',
      iconBg: 'bg-amber-50 text-[#8D6A28]'
    };
  };

  const filteredNotifications = notifications.filter((n) =>
    activeTab === 'unread' ? !n.is_read : true
  );

  const isNotifUnapproved = permissionState !== 'granted';

  return (
    <div className="relative" ref={dropdownRef} dir="rtl">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl transition-all shadow-2xs flex items-center justify-center cursor-pointer ${
          isNotifUnapproved
            ? 'bg-amber-50/80 border border-amber-400/80 text-amber-900 ring-2 ring-amber-400/50 ring-offset-1 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:bg-amber-100/80'
            : 'bg-white border border-slate-200 hover:border-[#8D6A28] text-slate-700 hover:text-[#8D6A28] hover:bg-slate-50'
        }`}
        aria-label="مركز الإشعارات"
        title={isNotifUnapproved ? 'اضغط لتفعيل إشعارات الفرص والعروض المباشرة' : 'مركز الإشعارات — متصل 🟢'}
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-wiggle text-[#8D6A28]' : isNotifUnapproved ? 'text-amber-700' : ''}`} />
        
        {/* Pulsating Beacon Light Indicator */}
        {isNotifUnapproved ? (
          <span className="absolute -top-1 -left-1 flex h-3.5 w-3.5 pointer-events-none" title="تنبيه: اضغط لتفعيل الإشعارات">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-85" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 shadow-[0_0_8px_#F59E0B]" />
          </span>
        ) : (
          <span className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981] border-2 border-white pointer-events-none" title="الإشعارات مفعلة 🟢" />
        )}

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-rose-600 text-white font-mono font-black text-[10px] flex items-center justify-center border-2 border-white shadow-md animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Modern Luxury Notification Dropdown / Panel */}
      {isOpen && (
        <>
          {/* Mobile backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 sm:hidden animate-fade-in"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed left-3 right-3 top-18 sm:absolute sm:top-full sm:mt-3 sm:left-0 sm:right-auto sm:w-[410px] max-w-[calc(100vw-1.5rem)] bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] z-50 overflow-hidden animate-fade-in flex flex-col max-h-[85vh] sm:max-h-[540px]">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#8D6A28]/10 text-[#8D6A28] flex items-center justify-center font-bold shadow-2xs">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-slate-900 text-sm">مركز الإشعارات</h4>
                    {isNotifUnapproved ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-200">
                        بانتظار الموافقة 🟡
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>مفعل 🟢</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : 'لا توجد إشعارات جديدة'}
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-1.5">
                {/* Sound Toggle */}
                <button
                  onClick={handleToggleSound}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    soundActive 
                      ? 'bg-amber-50 border-amber-200 text-[#8D6A28]' 
                      : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}
                  title={soundActive ? 'كتم صوت التنبيهات' : 'تفعيل صوت التنبيهات'}
                >
                  {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {/* Mark All Read */}
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition cursor-pointer"
                    title="تحديد الكل كمقروء"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* High-Impact Interactive Approval Card if Unapproved */}
            {isNotifUnapproved && (
              <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-800 space-y-3 shrink-0">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-[#8D6A28] text-white flex items-center justify-center shrink-0 shadow-md">
                    <Bell className="w-5 h-5 animate-wiggle" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="font-extrabold text-xs sm:text-sm text-white">تفعيل التنبيهات المباشرة 🔔</h5>
                      <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold">فرص حصرية</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      وافق على إشعارات المتصفح لتصلك الشقق المخفضة وعروض الإيجار فور نزولها في دمياط الجديدة.
                    </p>
                  </div>
                </div>

                <div>
                  <button
                    onClick={handleRequestPermission}
                    disabled={isRequestingPermission}
                    className="w-full py-2.5 px-4 rounded-xl gold-gradient gold-gradient-hover text-white text-xs font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95"
                  >
                    {isRequestingPermission ? (
                      <span>جاري طلب الإذن...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>الموافقة وتفعيل الإشعارات الآن 🟢</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Tabs: الكل / غير المقروءة */}
            <div className="p-2 border-b border-slate-100 bg-slate-50/90 shrink-0">
              <div className="grid grid-cols-2 p-1 bg-slate-200/60 rounded-2xl text-xs font-bold gap-1">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`py-1.5 rounded-xl transition text-center cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  الكل ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveTab('unread')}
                  className={`py-1.5 rounded-xl transition text-center cursor-pointer ${
                    activeTab === 'unread'
                      ? 'bg-white text-[#8D6A28] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  غير المقروءة ({unreadCount})
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100/90 p-2 space-y-1.5">
              {filteredNotifications.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-3xl bg-amber-50 text-[#8D6A28] flex items-center justify-center mx-auto shadow-2xs">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-sm font-extrabold text-slate-800">لا توجد إشعارات حالياً</h5>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                      {activeTab === 'unread' 
                        ? 'رائع! لقد قرأت جميع الإشعارات الواردة.' 
                        : 'ستصلك كافة التحديثات والعروض فور ورودها.'}
                    </p>
                  </div>
                </div>
              ) : (
                filteredNotifications.map((n) => {
                  const badge = getNotificationBadge(n.type);
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleItemClick(n)}
                      className={`p-3.5 rounded-2xl transition-all cursor-pointer border ${
                        !n.is_read 
                          ? 'bg-amber-50/50 border-amber-200/80 shadow-2xs' 
                          : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-2xl ${badge.iconBg} flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`}>
                          {badge.icon}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${badge.tagBg}`}>
                                {badge.tag}
                              </span>
                              <h5 className="font-extrabold text-xs text-slate-900 truncate">
                                {n.title}
                              </h5>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0 font-medium">
                              {formatRelativeTime(n.created_at)}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                            {n.message}
                          </p>

                          <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{new Date(n.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>

                            <div className="flex items-center gap-2">
                              {!n.is_read && (
                                <button
                                  onClick={(e) => handleMarkAsRead(n.id, e)}
                                  className="text-[11px] text-[#8D6A28] hover:underline font-bold"
                                >
                                  تحديد كمقروء
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDeleteNotification(n.id, e)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition"
                                title="حذف الإشعار"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {!n.is_read && (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#8D6A28] shadow-[0_0_6px_#8D6A28] shrink-0 mt-1.5" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer View All Link */}
            {role === 'admin' ? (
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center shrink-0">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/admin/reservations');
                  }}
                  className="text-xs font-bold text-[#8D6A28] hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  <span>متابعة كافة طلبات الحجز والمعاينات</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 px-4 shrink-0 font-medium">
                <span>سكني • إشعارات مباشرة</span>
                <span className="text-[#8D6A28] font-bold">دمياط الجديدة</span>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
};
