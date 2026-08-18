import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Smartphone, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Download, 
  Share2, 
  PlusSquare,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import { requestNotificationPermission } from '../services/firebaseService';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const STORAGE_KEY = 'sakani_first_visit_prompt_status_v1';

export const FirstVisitPromptModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);
  const [appInstalled, setAppInstalled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Detect environment
    const ua = navigator.userAgent || '';
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || window.innerWidth < 768;
    const iosCheck = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const standaloneCheck = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;

    setIsMobile(mobileCheck);
    setIsIOS(iosCheck);
    setIsStandalone(standaloneCheck);

    // If notifications are already granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      setNotifGranted(true);
    }

    // 2. Check if already dismissed or completed
    const savedStatus = localStorage.getItem(STORAGE_KEY);
    const egGreetingStatus = localStorage.getItem('sakani_egyptian_greeting_v1');
    if (!egGreetingStatus || egGreetingStatus !== 'completed') {
      // Allow EgyptianWelcomeFeedbackModal to handle the first visit experience
      return;
    }
    if (savedStatus === 'completed' || savedStatus === 'dismissed_forever') {
      return;
    }

    // Cooldown check (if dismissed recently, wait 4 days)
    if (savedStatus) {
      const parsed = parseInt(savedStatus, 10);
      if (!isNaN(parsed) && Date.now() - parsed < 4 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // 3. Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setAppInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // 4. Reveal prompt gracefully after 2.2 seconds
    const timer = setTimeout(() => {
      // If already standalone (installed app) and notifications granted, no need to show
      if (standaloneCheck && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        return;
      }
      setIsOpen(true);
    }, 2200);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDismiss = (forever = false) => {
    setIsOpen(false);
    if (forever) {
      localStorage.setItem(STORAGE_KEY, 'dismissed_forever');
    } else {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }
  };

  const handleEnableNotifications = async () => {
    setIsProcessing(true);
    try {
      const res = await requestNotificationPermission('customer');
      if (res.granted) {
        setNotifGranted(true);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInstallApp = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback
      alert('لتثبيت التطبيق، اضغط على خيارات المتصفح (⋮) ثم اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setAppInstalled(true);
        setDeferredPrompt(null);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleCompleteAll = async () => {
    setIsProcessing(true);
    try {
      // 1. Request notification
      if (!notifGranted && 'Notification' in window) {
        await requestNotificationPermission('customer');
        setNotifGranted(true);
      }

      // 2. Trigger install prompt if available
      if (deferredPrompt) {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setAppInstalled(true);
        }
      } else if (isIOS && !isStandalone) {
        setShowIOSInstructions(true);
        setIsProcessing(false);
        return;
      }

      localStorage.setItem(STORAGE_KEY, 'completed');
      setTimeout(() => {
        setIsOpen(false);
      }, 800);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md transition-all duration-300 animate-fadeIn">
      {/* Click outside backdrop to dismiss */}
      <div className="fixed inset-0" onClick={() => handleDismiss(false)} />

      {/* Modal / Bottom Sheet Box */}
      <div 
        className="relative z-10 w-full sm:max-w-lg bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-slideUp sm:animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon / Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-[#1e293b] to-slate-900 px-6 py-6 text-white overflow-hidden">
          {/* Subtle gold accent lighting */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#8D6A28]/25 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/15 rounded-full blur-xl pointer-events-none -ml-10 -mb-10" />

          {/* Close button */}
          <button 
            onClick={() => handleDismiss(false)}
            aria-label="إغلاق"
            className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#A77D34] to-[#715420] p-0.5 shadow-lg shadow-amber-950/40 flex items-center justify-center">
              <div className="w-full h-full bg-[#0F172A] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#E0C079]" />
              </div>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#8D6A28]/30 text-[#F5DE9C] border border-[#8D6A28]/40 mb-0.5">
                <Sparkles className="w-3 h-3 text-[#F5DE9C]" />
                مرحباً بك في منصة سكني
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                تجربة عقارية أسرع وأسهل
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed mt-2">
            احصل على أفضل تجربة تصفح لعقارات دمياط الجديدة مع التنبيهات الفورية بالعروض وتثبيت التطبيق على جهازك.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Feature 1: Push Notifications */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-amber-50/40 hover:border-amber-200/50">
            <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-[#8D6A28] flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-900">إشعارات الفرص الحصرية</h4>
                {notifGranted ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> مفعل
                  </span>
                ) : (
                  <button
                    onClick={handleEnableNotifications}
                    disabled={isProcessing}
                    className="text-xs font-bold text-[#8D6A28] hover:text-[#715420] bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors"
                  >
                    تفعيل الآن
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                كن أول من يعلم عند نزول وحدات مطابقة لمواصفاتك، وتغييرات الأسعار، وعروض الحجز المباشر.
              </p>
            </div>
          </div>

          {/* Feature 2: Install as Mobile App */}
          {(isMobile || deferredPrompt) && (
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-amber-50/40 hover:border-amber-200/50">
              <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">تثبيت التطبيق على الجوال</h4>
                  {appInstalled || isStandalone ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> مثبت
                    </span>
                  ) : (
                    <button
                      onClick={handleInstallApp}
                      className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors inline-flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> تثبيت
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  أضف سكني لشاشتك الرئيسية لتصفح فوري وسلس بدون كتابة الرابط مع استهلاك أقل للإنترنت.
                </p>
              </div>
            </div>
          )}

          {/* iOS Safari Instructions Accordion */}
          {showIOSInstructions && isIOS && (
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/70 text-slate-800 text-xs space-y-2 animate-fadeIn">
              <p className="font-bold text-[#8D6A28] flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                طريقة التثبيت على أجهزة iPhone / iPad:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-700 pr-1">
                <li className="flex items-center gap-2">
                  <span>1. اضغط على زر المشاركة</span>
                  <Share2 className="w-4 h-4 text-blue-600 inline" />
                  <span>في شريط متصفح سفاري السفلي.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>2. مرر للأسفل واختر</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    <PlusSquare className="w-3.5 h-3.5 text-slate-700" /> إضافة إلى الشاشة الرئيسية (Add to Home Screen)
                  </span>
                </li>
                <li>3. اضغط <strong>إضافة (Add)</strong> في الزاوية العلوية.</li>
              </ol>
            </div>
          )}

          {/* Value Guarantee badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/70 text-slate-500 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0" />
            <span>نحترم خصوصيتك بالكامل. يمكنك تعطيل الإشعارات أو إدارتها بأي وقت من المتصفح.</span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 pt-2 bg-white border-t border-slate-100 space-y-2.5">
          <button
            onClick={handleCompleteAll}
            disabled={isProcessing}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#8D6A28] via-[#A77D34] to-[#715420] text-white font-bold text-sm shadow-lg shadow-amber-900/20 hover:shadow-xl hover:shadow-amber-900/30 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <span>جاري المعالجة...</span>
            ) : (
              <>
                <span>تفعيل وتثبيت الكل بنقرة واحدة</span>
                <ChevronLeft className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            onClick={() => handleDismiss(false)}
            className="w-full py-2.5 px-4 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            تذكيري لاحقاً
          </button>
        </div>
      </div>
    </div>
  );
};
