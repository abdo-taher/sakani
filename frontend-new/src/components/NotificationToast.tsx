import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onPushNotification, PushNotificationPayload } from '../services/firebaseService';
import { 
  Bell, 
  CalendarCheck, 
  MessageSquare, 
  FileText, 
  Sparkles, 
  X, 
  ArrowLeft 
} from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const navigate = useNavigate();
  const [activeToast, setActiveToast] = useState<PushNotificationPayload | null>(null);

  useEffect(() => {
    const unsubscribe = onPushNotification((payload) => {
      setActiveToast(payload);

      // Auto dismiss after 7 seconds
      const timer = setTimeout(() => {
        setActiveToast((current) => (current?.id === payload.id ? null : current));
      }, 7000);

      return () => clearTimeout(timer);
    });

    return () => unsubscribe();
  }, []);

  if (!activeToast) return null;

  const handleAction = () => {
    const route = activeToast.route || (activeToast.type.includes('admin') ? '/admin/reservations' : '/');
    setActiveToast(null);
    navigate(route);
  };

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
    <div 
      className="fixed top-5 left-5 z-50 max-w-sm w-full animate-slide-in-top pointer-events-auto"
      dir="rtl"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-200/90 flex items-start gap-3 relative overflow-hidden group">
        
        {/* Glow accent bar */}
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-[#8D6A28] via-amber-500 to-[#8D6A28]" />

        {/* Icon box */}
        <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
          {getIcon(activeToast.type)}
        </div>

        {/* Text and Actions */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-extrabold text-sm text-slate-900 truncate">
              {activeToast.title}
            </h4>
            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-snug line-clamp-2">
            {activeToast.body}
          </p>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleAction}
              className="px-3 py-1.5 rounded-xl bg-[#0F172A] hover:bg-[#8D6A28] text-white text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <span>عرض الطلب</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveToast(null)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
