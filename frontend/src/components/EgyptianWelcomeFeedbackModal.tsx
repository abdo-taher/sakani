import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  Heart, 
  MessageSquare, 
  Send, 
  Building2, 
  Phone, 
  Share2, 
  Compass, 
  Coffee, 
  Bell, 
  Smartphone, 
  Check, 
  ChevronLeft,
  Search,
  Users,
  GraduationCap,
  MapPin,
  ExternalLink,
  PlusSquare,
  ThumbsUp
} from 'lucide-react';
import { ApiService } from '../services/apiService';
import { StorageService, safeDispatchEvent } from '../services/storageService';
import { requestNotificationPermission } from '../services/firebaseService';
import { usePWAInstall } from '../utils/pwaInstall';
const STORAGE_KEY = 'sakani_egyptian_welcome_feedback_v1';
const WELCOME_NOTIF_KEY = 'sakani_welcome_notif_sent_v1';

const REFERRAL_OPTIONS = [
  { id: 'facebook', label: 'فيسبوك (Facebook)', sub: 'إعلانات وبوستات الفيس', icon: '📱', color: 'hover:border-blue-500 hover:bg-blue-50/50' },
  { id: 'instagram', label: 'انستجرام (Instagram)', sub: 'ريلز وبوستات انستا', icon: '📸', color: 'hover:border-pink-500 hover:bg-pink-50/50' },
  { id: 'tiktok', label: 'تيك توك (TikTok)', sub: 'فيديوهات وجولات تيك توك', icon: '🎵', color: 'hover:border-slate-800 hover:bg-slate-50' },
  { id: 'friend_recommendation', label: 'ترشيح من صاحب أو قريب', sub: 'حد من المعارف نصحني بيكم', icon: '👥', color: 'hover:border-amber-500 hover:bg-amber-50/50' },
  { id: 'google_search', label: 'بحث جوجل (Google)', sub: 'كتبت شقق في دمياط الجديدة', icon: '🔍', color: 'hover:border-emerald-500 hover:bg-emerald-50/50' },
  { id: 'horus_damietta_university', label: 'جامعة حورس / جامعة دمياط', sub: 'سكن طلاب وطالبات بالجامعة', icon: '🎓', color: 'hover:border-indigo-500 hover:bg-indigo-50/50' },
  { id: 'whatsapp_telegram_groups', label: 'جروبات واتساب أو تليجرام', sub: 'جروبات عقارات وسكن', icon: '💬', color: 'hover:border-emerald-600 hover:bg-emerald-50/50' },
  { id: 'billboards_damietta', label: 'يافطة أو إعلان في دمياط الجديدة', sub: 'شفته في شوارع المدينة', icon: '🏙️', color: 'hover:border-amber-600 hover:bg-amber-50/50' },
  { id: 'broker_office', label: 'وسيط أو مكتب عقاري', sub: 'مكتب تسويق عقاري', icon: '🏢', color: 'hover:border-purple-500 hover:bg-purple-50/50' },
  { id: 'other', label: 'مصدر آخر (Other)', sub: 'طريقة تانية خالص', icon: '💡', color: 'hover:border-slate-500 hover:bg-slate-50' },
];

export const EgyptianWelcomeFeedbackModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [customNote, setCustomNote] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeStep, setActiveStep] = useState<'welcome_survey' | 'pwa_perks' | 'thank_you'>('welcome_survey');

  // PWA & Notification Integration
  const { isInstalled: appInstalled, installApp } = usePWAInstall();
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);

  useEffect(() => {
    // 0. Check admin settings
    const settings = StorageService.getSettings();
    const isFeedbackEnabled = settings?.feedback_enabled !== false;
    const isWelcomeModalEnabled = settings?.feedback_welcome_modal_enabled !== false;

    if (!isFeedbackEnabled || !isWelcomeModalEnabled) {
      return;
    }

    // Do not show on admin routes or if admin is logged in
    if (typeof window !== 'undefined') {
      const isHashAdmin = window.location.hash.startsWith('#/admin');
      const isPathAdmin = window.location.pathname.startsWith('/admin');
      if (isHashAdmin || isPathAdmin || StorageService.isAdminLoggedIn()) {
        return;
      }
    }

    // 1. Detect Device & PWA Environment
    const ua = navigator.userAgent || '';
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || window.innerWidth < 768;
    const iosCheck = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const standaloneCheck = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;

    setIsMobile(mobileCheck);
    setIsIOS(iosCheck);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      setNotifGranted(true);
    }

    // 2. Check frequency & trigger mode
    const triggerMode = settings?.feedback_trigger_mode || 'first_visit';
    const savedStatus = localStorage.getItem(STORAGE_KEY);
    const sessionSeen = sessionStorage.getItem(STORAGE_KEY + '_session');

    if (triggerMode === 'first_visit') {
      if (savedStatus === 'completed' || savedStatus === 'dismissed_forever') {
        return;
      }
    } else if (triggerMode === 'every_visit') {
      if (sessionSeen) {
        return;
      }
    } else if (triggerMode === 'cooldown') {
      if (savedStatus === 'completed' || savedStatus === 'dismissed_forever') {
        return;
      }
      if (savedStatus) {
        const parsed = parseInt(savedStatus, 10);
        if (!isNaN(parsed) && Date.now() - parsed < 3 * 24 * 60 * 60 * 1000) {
          return;
        }
      }
    }

    // 3. Reveal Egyptian Hospitality Welcome Modal after admin-configured delay
    const delaySeconds = settings?.feedback_welcome_delay_seconds ?? settings?.feedback_delay_seconds ?? 60;
    const delayMs = Math.max(1500, delaySeconds * 1000);

    const timer = setTimeout(() => {
      if (StorageService.isAdminLoggedIn()) return;
      if (window.location.hash.startsWith('#/admin') || window.location.pathname.startsWith('/admin')) return;
      
      setIsOpen(true);
      sessionStorage.setItem(STORAGE_KEY + '_session', 'true');
      sendEgyptianGreetingNotification();
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Send an authentic Egyptian Greeting in-app notification once per new visitor
  const sendEgyptianGreetingNotification = () => {
    try {
      StorageService.ensureWelcomeNotification();

      const notifAlreadySent = localStorage.getItem(WELCOME_NOTIF_KEY);
      if (notifAlreadySent) return;

      localStorage.setItem(WELCOME_NOTIF_KEY, 'true');

      // Dispatch custom event to notification center and toasts
      if (typeof window !== 'undefined') {
        const welcomePayload = {
          id: `welcome-eg-${Date.now()}`,
          type: 'egyptian_welcome',
          title: 'منور منصة سكنك يا باشا! 🇪🇬🏡',
          body: 'يا هلا بيك في بيتك ومطرحك! تصفح شقق وفيلات وسكن طالبات وشباب دمياط الجديدة بكل سهولة وبدون عمولات خفية.',
          route: '/properties',
          created_at: new Date().toISOString(),
        };

        safeDispatchEvent('sakani_push_notification', welcomePayload);
      }
    } catch (e) {}
  };

  const handleDismiss = (forever = false) => {
    setIsOpen(false);
    if (forever) {
      localStorage.setItem(STORAGE_KEY, 'dismissed_forever');
    } else {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }
  };

  const handleSubmitFeedback = async (sourceIdToSubmit?: string) => {
    const sourceKey = sourceIdToSubmit || selectedSource;
    if (!sourceKey) return;

    setIsSubmitting(true);
    const matchedOption = REFERRAL_OPTIONS.find((opt) => opt.id === sourceKey);
    const sourceLabel = matchedOption ? matchedOption.label : sourceKey;

    try {
      // 1. Post to live backend endpoint
      await ApiService.submitReferralFeedback({
        source_key: sourceKey,
        source_label: sourceLabel,
        custom_note: customNote.trim() || undefined,
        phone: phone.trim() || undefined,
        device_type: isMobile ? 'mobile' : 'desktop',
      }).catch(() => null);

      // 2. Also save to local storage service for immediate offline caching
      StorageService.saveReferralFeedback({
        source_key: sourceKey,
        source_label: sourceLabel,
        custom_note: customNote.trim() || undefined,
        phone: phone.trim() || undefined,
        device_type: isMobile ? 'mobile' : 'desktop',
      });

      // Save phone if provided
      if (phone.trim()) {
        StorageService.setClientPhone(phone.trim());
      }

      localStorage.setItem(STORAGE_KEY, 'completed');
      setIsSubmitted(true);
      setActiveStep('thank_you');

      // Auto close after 3.2 seconds
      setTimeout(() => {
        setIsOpen(false);
      }, 3200);
    } catch (e) {
      // Fallback mark completed
      localStorage.setItem(STORAGE_KEY, 'completed');
      setIsSubmitted(true);
      setActiveStep('thank_you');
      setTimeout(() => {
        setIsOpen(false);
      }, 2500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnablePush = async () => {
    try {
      const res = await requestNotificationPermission('customer', phone || undefined);
      if (res.granted) {
        setNotifGranted(true);
      }
    } catch (e) {}
  };

  const handleInstallPWA = async () => {
    await installApp();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 transition-opacity duration-150" dir="rtl">
      {/* Click outside backdrop to dismiss */}
      <div className="fixed inset-0" onClick={() => handleDismiss(false)} />

      {/* Egyptian Themed Card Box */}
      <div 
        className="relative z-10 w-full sm:max-w-xl bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl border border-amber-900/10 overflow-hidden flex flex-col max-h-[92vh] modal-animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Ribbon: Authentic Egyptian Warmth */}
        <div className="relative bg-gradient-to-r from-slate-950 via-[#1a2333] to-slate-950 px-6 py-6 text-white overflow-hidden shrink-0 border-b border-amber-500/20">
          {/* Subtle gold accent lighting */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#8D6A28]/30 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-amber-500/20 rounded-full blur-xl pointer-events-none -ml-10 -mb-10" />

          {/* Close button */}
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDismiss(false);
            }}
            aria-label="إغلاق"
            className="absolute top-4 left-4 z-50 p-2.5 text-slate-300 hover:text-white rounded-full bg-white/10 hover:bg-white/25 transition-all backdrop-blur-md cursor-pointer active:scale-90 shadow-md"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Egyptian Hospitality Header Title */}
          <div className="relative flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#A77D34] to-[#715420] p-0.5 shadow-lg shadow-amber-950/50 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0F172A] rounded-[14px] flex items-center justify-center text-xl">
                🇪🇬
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#8D6A28]/35 text-[#F5DE9C] border border-[#8D6A28]/50">
                  <Sparkles className="w-3 h-3 text-[#F5DE9C]" />
                  يا هلا باللي نورنا! 
                </span>
                <span className="text-[11px] font-bold text-slate-300">
                  بيتك ومطرحك في دمياط الجديدة
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
                منور منصة سكنك العقارية ✨
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed mt-1">
                خطوة عزيزة يا باشا.. هنا هتلاقي شقق، فيلات، شاليهات، وسكن طالبات وشباب بأسهل وأسرع طريقة وبدون لف ودوران!
              </p>
            </div>
          </div>
        </div>

        {/* Content Body: Step by Step Flow */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* STEP 1: WELCOME & REFERRAL FEEDBACK SURVEY */}
          {activeStep === 'welcome_survey' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Egyptian Hospitality Value Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#8D6A28] flex items-center justify-center shrink-0">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">استشارتك علينا</h4>
                    <p className="text-[10px] text-slate-500 font-medium">معاينات مباشرة ومتابعة</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">عقارات موثقة</h4>
                    <p className="text-[10px] text-slate-500 font-medium">صور وفيديوهات حقيقية</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/60 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">بدون عمولات خفية</h4>
                    <p className="text-[10px] text-slate-500 font-medium">وضوح وأمانة كاملة</p>
                  </div>
                </div>
              </div>

              {/* Survey Question Section */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-[#8D6A28]/15 text-[#8D6A28] flex items-center justify-center font-bold">
                      🤝
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        حابين نعرف.. عرفت سكنك منين يا غالي؟
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        اختر المصدر بنقرة واحدة للمساعدة في تطوير خدماتنا لك
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#8D6A28] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    سؤال سريع
                  </span>
                </div>

                {/* Referral Source Grid of Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                  {REFERRAL_OPTIONS.map((opt) => {
                    const isSelected = selectedSource === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedSource(opt.id);
                          if (opt.id !== 'other') {
                            // Instant submit on click for super fast 1-tap UX
                            handleSubmitFeedback(opt.id);
                          }
                        }}
                        className={`p-3 rounded-2xl border text-right transition-all flex items-start gap-2.5 cursor-pointer relative group ${
                          isSelected
                            ? 'bg-[#8D6A28]/10 border-[#8D6A28] shadow-sm'
                            : `bg-slate-50/80 border-slate-200/80 ${opt.color}`
                        }`}
                      >
                        <span className="text-lg shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                          {opt.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-black text-slate-900 block truncate leading-tight">
                            {opt.label}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5">
                            {opt.sub}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[#8D6A28] text-white flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* If "other" selected, show quick text input */}
                {selectedSource === 'other' && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 animate-fadeIn">
                    <label className="block text-xs font-bold text-slate-700">
                      اكتبلنا عرفتنا إزاي يا باشا:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="مثال: من خلال جروب الجامعة، يافطة بالشارع، صديق..."
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-[#8D6A28]"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSubmitFeedback('other')}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-xl gold-gradient gold-gradient-hover text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>إرسال</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: THANK YOU & CELEBRATION */}
          {activeStep === 'thank_you' && (
            <div className="text-center py-6 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner text-2xl animate-bounce">
                🎉
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">
                  تسلم يا باشا ونورتنا وشرفتنا! ❤️
                </h3>
                <p className="text-xs text-slate-600 font-medium max-w-sm mx-auto leading-relaxed">
                  تم تسجيل إجابتك بنجاح. نتمنى لك تجربة تصفح ممتعة وتلاقي العقار المناسب ليك في دمياط الجديدة!
                </p>
              </div>

              {/* Perks / Fast Actions */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-xs text-slate-800 text-right space-y-2.5 max-w-md mx-auto">
                <div className="font-black text-[#8D6A28] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>خطوتك الجاية في منصة سكني:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                  <a
                    href="#/properties"
                    onClick={() => setIsOpen(false)}
                    className="p-2.5 rounded-xl bg-white border border-amber-200 hover:border-[#8D6A28] transition flex items-center justify-center gap-1 text-slate-900"
                  >
                    <Search className="w-3.5 h-3.5 text-[#8D6A28]" />
                    <span>تصفح العقارات</span>
                  </a>
                  <a
                    href="https://wa.me/201018318899?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D9%86%D9%88%D8%B1%D8%AA%20%D9%85%D9%86%D8%B5%D8%A9%20%D8%B3%D9%83%D9%86%D9%8A%20%D9%88%D8%AD%D8%A7%D8%A8%D8%A8%20%D8%A3%D8%B3%D8%AA%D9%81%D8%B3%D8%B1%20%D8%B9%D9%86%20%D8%B9%D9%82%D8%A7%D8%B1"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>واتساب الاستشارات</span>
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        {activeStep === 'welcome_survey' && (
          <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleDismiss(false)}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
            >
              تخطي الآن
            </button>

            {selectedSource ? (
              <button
                type="button"
                onClick={() => handleSubmitFeedback()}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>جاري التسجيل...</span>
                ) : (
                  <>
                    <span>تأكيد الإجابة</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            ) : (
              <div className="text-[11px] text-slate-400 font-medium">
                اضغط على أي خيار وسيتم تسجيله فوراً ✨
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
