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

    // Auto-register admin device token in background if permission is already granted
    if (role === 'admin' && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
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
    if (role === 'admin') {
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

  const getNotificationIcon = (type: string) => {
    if (type.includes('welcome') || type === 'egyptian_welcome') {
      return <span className="text-base leading-none">🇪🇬</span>;
    }
    if (type.includes('reservation')) {
      return <CalendarCheck className="w-4 h-4 text-[#8D6A28]" />;
    }
    if (type.includes('contact') || type.includes('message')) {
      return <MessageSquare className="w-4 h-4 text-blue-600" />;
    }
    if (type.includes('need')) {
      return <FileText className="w-4 h-4 text-purple-600" />;
    }
    return <Sparkles className="w-4 h-4 text-emerald-600" />;
  };

  const filteredNotifications = notifications.filter((n) =>
    activeTab === 'unread' ? !n.is_read : true
  );

  const isNotifUnapproved = permissionState !== 'granted';

  return (
    <div className="relative flex items-center gap-1.5" ref={dropdownRef} dir="rtl">
      {/* Optional Highlight Badge on Desktop when unapproved */}
      {isNotifUnapproved && (
        <button
          onClick={() => setIsOpen(true)}
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-400/25 to-amber-500/15 border border-amber-400/50 text-[#8D6A28] text-[11px] font-black animate-pulse shadow-2xs hover:brightness-105 transition cursor-pointer"
          title="انقر لتفعيل الإشعارات وتلقي أحدث العروض فوراً"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 shadow-[0_0_8px_#F59E0B]" />
          </span>
          <span>فعّل التنبيهات 🔔</span>
        </button>
      )}

      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-2xl bg-white border transition shadow-xs flex items-center justify-center cursor-pointer ${
          isNotifUnapproved
            ? 'border-amber-400 text-amber-900 ring-2 ring-amber-400/60 ring-offset-1 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
            : 'border-slate-200 hover:border-[#8D6A28] text-slate-700 hover:text-[#8D6A28]'
        }`}
        aria-label="مركز الإشعارات"
        title={isNotifUnapproved ? 'يرجى تفعيل الإشعارات (اضغط هنا للموافقة)' : 'مركز الإشعارات — مفعل ومتصل 🟢'}
      >
        <Bell className={`w-4 h-4 sm:w-5 sm:h-5 ${unreadCount > 0 ? 'animate-wiggle text-[#8D6A28]' : isNotifUnapproved ? 'text-amber-700' : ''}`} />
        
        {/* Pulsating Beacon Light Indicator for Unapproved or Granted Status */}
        {isNotifUnapproved ? (
          <span className="absolute -top-1 -left-1 flex h-3 w-3 pointer-events-none" title="تنبيه: اضغط لتفعيل الإشعارات">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-85" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 shadow-[0_0_8px_#F59E0B]" />
          </span>
        ) : (
          <span className="absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981] border border-white pointer-events-none" title="الإشعارات مفعلة 🟢" />
        )}

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-rose-600 text-white font-mono font-black text-[10px] flex items-center justify-center border-2 border-white shadow-md animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown / Panel */}
      {isOpen && (
        <>
          {/* Mobile backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-xs z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed left-3 right-3 top-20 sm:absolute sm:top-full sm:mt-3 sm:left-0 sm:right-auto sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-3xl border border-slate-200/90 shadow-2xl z-50 overflow-hidden animate-fade-in flex flex-col max-h-[82vh] sm:max-h-[520px]">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#8D6A28]/10 text-[#8D6A28] flex items-center justify-center font-bold shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-slate-900 text-sm">الإشعارات</h4>
                    {isNotifUnapproved ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        بانتظار التفعيل 🟡
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>مفعل 🟢</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : 'لا توجد إشعارات جديدة'}
                  </p>
                </div>
              </div>

            <div className="flex items-center gap-1.5">
              {/* Sound Toggle */}
              <button
                onClick={handleToggleSound}
                className={`p-1.5 rounded-lg border transition ${
                  soundActive 
                    ? 'bg-amber-50 border-amber-200 text-[#8D6A28]' 
                    : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}
                title={soundActive ? 'كتم صوت الإشعارات' : 'تفعيل صوت الإشعارات'}
              >
                {soundActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Mark All Read */}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition"
                  title="تحديد الكل كمقروء"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* High-Impact Permission Prompt Banner if unapproved */}
          {isNotifUnapproved && (
            <div className="p-3.5 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 border-b border-amber-300/50 flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-bounce">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-black text-slate-900 leading-tight">يرجى تفعيل التنبيهات الفورية 🔔</h5>
                  <p className="text-[10px] text-slate-600 truncate mt-0.5">لتصلك العروض وتخفيضات الأسعار فوراً</p>
                </div>
              </div>
              <button
                onClick={handleRequestPermission}
                disabled={isRequestingPermission}
                className="px-3.5 py-1.5 rounded-xl gold-gradient gold-gradient-hover text-white text-[11px] font-black shadow-sm transition shrink-0 cursor-pointer hover:scale-105 active:scale-95"
              >
                {isRequestingPermission ? 'جاري...' : 'موافقة وتفعيل 🟢'}
              </button>
            </div>
          )}

          {/* Tabs: الكل / غير المقروءة */}
          <div className="flex border-b border-slate-100 bg-slate-50 text-xs font-bold">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 text-center transition ${
                activeTab === 'all'
                  ? 'border-b-2 border-[#8D6A28] text-[#8D6A28] bg-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              الكل ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`flex-1 py-2 text-center transition ${
                activeTab === 'unread'
                  ? 'border-b-2 border-[#8D6A28] text-[#8D6A28] bg-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              غير المقروءة ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-600">لا توجد إشعارات حالياً</p>
                <p className="text-[10px] text-slate-400">ستظهر هنا أحدث التحديثات والطلبات الواردة فور حدوثها</p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition cursor-pointer relative ${
                    !n.is_read ? 'bg-amber-50/40' : 'bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h5 className="font-extrabold text-xs text-slate-900 truncate break-words">
                        {n.title}
                      </h5>
                      <span className="text-[9px] font-mono text-slate-400 shrink-0">
                        {new Date(n.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug line-clamp-2 break-words [overflow-wrap:anywhere]">
                      {n.message}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[9px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{new Date(n.created_at).toLocaleDateString('ar-EG')}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        {!n.is_read && (
                          <button
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            className="text-[10px] text-[#8D6A28] hover:underline font-bold"
                          >
                            تحديد كمقروء
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteNotification(n.id, e)}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
                          title="حذف"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-[#8D6A28] shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer View All Link */}
          {role === 'admin' && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/admin/reservations');
                }}
                className="text-xs font-bold text-[#8D6A28] hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <span>متابعة كافة طلبات الحجز والمعاينات</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

        </div>
        </>
      )}
    </div>
  );
};
