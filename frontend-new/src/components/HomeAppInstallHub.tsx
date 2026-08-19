import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Bell, 
  Smartphone, 
  Sparkles, 
  Download, 
  CheckCircle2, 
  Share2, 
  QrCode, 
  PlusSquare, 
  Radio, 
  Flame, 
  Check, 
  ExternalLink,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import { requestNotificationPermission } from '../services/firebaseService';
import { SystemSettings } from '../types';
import { QRCodeShareModal } from './QRCodeShareModal';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface HomeAppInstallHubProps {
  settings?: SystemSettings;
}

export const HomeAppInstallHub: React.FC<HomeAppInstallHubProps> = ({ settings }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);
  const [appInstalled, setAppInstalled] = useState(false);
  const [isProcessingNotif, setIsProcessingNotif] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string>('');

  // Check if admin has disabled the home install banner
  const isBannerEnabled = settings?.home_install_banner_enabled !== false;
  const isPwaEnabled = settings?.pwa_install_enabled !== false;
  const isNotifEnabled = settings?.notification_prompt_enabled !== false;

  useEffect(() => {
    // 1. Detect environment
    const ua = navigator.userAgent || '';
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || window.innerWidth < 768;
    const iosCheck = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const standaloneCheck = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;

    setIsMobile(mobileCheck);
    setIsIOS(iosCheck);
    setIsStandalone(standaloneCheck);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      setNotifGranted(true);
    }

    // 2. Listen for install prompt
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

    // 3. Generate mini QR preview for desktop users
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sakani.site';
    QRCode.toDataURL(`${baseUrl}/#/properties?pwa_install=true&source=home_hub`, {
      width: 220,
      margin: 1,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    }).then((url) => {
      setQrPreviewUrl(url);
    }).catch(() => {});

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleEnablePushNotifications = async () => {
    setIsProcessingNotif(true);
    try {
      const res = await requestNotificationPermission('customer');
      if (res.granted) {
        setNotifGranted(true);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsProcessingNotif(false);
    }
  };

  const handleInstallApp = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) {
      setIsQrModalOpen(true);
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

  if (!isBannerEnabled) {
    return null;
  }

  return (
    <>
      <section className="relative overflow-hidden my-10 sm:my-14 rounded-3xl sm:rounded-[36px] bg-gradient-to-br from-[#0B1120] via-[#111C30] to-[#0A0F1D] border border-amber-500/20 shadow-2xl p-6 sm:p-10 text-white" dir="rtl">
        {/* Glowing Decorative Background Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#8D6A28]/25 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Right Column: Information & Actions */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Top Pill Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500/25 to-[#8D6A28]/35 text-[#F5DE9C] border border-amber-400/40 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                تطبيق سكني الذكي
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800/80 text-slate-300 border border-slate-700/80">
                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                تصفح فوري وسلس بدون نت بطيء
              </span>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
                ثبّت التطبيق وفعّل التنبيهات الفورية 🚀
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm md:text-base font-medium leading-relaxed max-w-2xl">
                احصل على إشعارات حصرية عند إضافة شقق جديدة، تخفيضات الأسعار، وعروض سكن الطالبات والشباب في دمياط الجديدة مباشرة على شاشتك.
              </p>
            </div>

            {/* Feature Cards Grid (Notifications & App Status) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              
              {/* Feature 1: Notification with Dynamic Light Badge */}
              {isNotifEnabled && (
                <div className="p-4 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-3 group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-[#E0C079] flex items-center justify-center shrink-0 border border-amber-400/30">
                      <Bell className="w-5 h-5" />
                    </div>

                    {/* DYNAMIC LIGHT BADGE (Pulsing Light Open/Close Effect) */}
                    {notifGranted ? (
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[11px] font-black shadow-[0_0_12px_rgba(52,211,153,0.35)]">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10B981]" />
                        </span>
                        <span>مفعل ومتصل 🟢</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[11px] font-black shadow-[0_0_12px_rgba(251,191,36,0.3)] animate-pulse">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 shadow-[0_0_10px_#F59E0B]" />
                        </span>
                        <span>إشارة التنبيه مفتوحة 💡</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-white group-hover:text-[#F5DE9C] transition-colors">
                      إشعارات الفرص والعروض الحصرية
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed">
                      تنبيهات فورية عند نزول شقة بالميزانية أو الحي المطلوب.
                    </p>
                  </div>

                  <div className="pt-1">
                    {notifGranted ? (
                      <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>أنت تتلقى أحدث العروض تلقائياً</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleEnablePushNotifications}
                        disabled={isProcessingNotif}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#8D6A28] to-[#A77D34] hover:brightness-110 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-[0.98]"
                      >
                        {isProcessingNotif ? (
                          <span>جاري التفعيل...</span>
                        ) : (
                          <>
                            <Bell className="w-3.5 h-3.5 text-amber-200" />
                            <span>تشغيل ضوء الإشعارات الآن</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Feature 2: Install Mobile App */}
              {isPwaEnabled && (
                <div className="p-4 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 hover:border-blue-500/40 transition-all flex flex-col justify-between gap-3 group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 border border-blue-400/30">
                      <Smartphone className="w-5 h-5" />
                    </div>

                    {appInstalled || isStandalone ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[11px] font-black">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>التطبيق مثبت</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40 text-[11px] font-black">
                        <span>جاهز للتثبيت 📲</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-white group-hover:text-blue-300 transition-colors">
                      تثبيت التطبيق على الشاشة الرئيسية
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed">
                      تصفح سريع بدون فتح المتصفح، يعمل بدون استهلاك للبيانات.
                    </p>
                  </div>

                  <div className="pt-1">
                    {appInstalled || isStandalone ? (
                      <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>منصة سكني مثبتة على جهازك</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleInstallApp}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-[0.98]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تثبيت التطبيق بنقرة واحدة</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer backdrop-blur-sm"
              >
                <QrCode className="w-4 h-4 text-amber-300" />
                <span>مشاركة المنصة ورمز QR</span>
              </button>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>بدون متجر — خفيف الحجم وآمن 100%</span>
              </div>
            </div>

          </div>

          {/* Left Column: Interactive QR Code Card */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center">
            <div 
              onClick={() => setIsQrModalOpen(true)}
              className="w-full max-w-[280px] p-5 rounded-3xl bg-white/[0.08] backdrop-blur-xl border border-white/20 text-center space-y-3 cursor-pointer hover:border-amber-400/50 hover:bg-white/[0.12] transition-all transform hover:-translate-y-1 shadow-2xl group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                <span className="flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>مسح سريع بالكاميرا</span>
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-white transition">انقر للتكبير</span>
              </div>

              {/* QR Image Frame */}
              <div className="p-3 bg-white rounded-2xl shadow-inner inline-block relative mx-auto">
                {qrPreviewUrl ? (
                  <img 
                    src={qrPreviewUrl} 
                    alt="Sakani QR Code" 
                    className="w-40 h-40 object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-40 h-40 bg-slate-100 flex items-center justify-center rounded-xl">
                    <QrCode className="w-10 h-10 text-slate-400 animate-pulse" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-8 rounded-lg bg-[#0F172A] border border-amber-400/80 shadow flex items-center justify-center text-xs">
                    🏡
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h5 className="text-xs font-black text-white">افتح على هاتفك فوراً</h5>
                <p className="text-[10px] text-slate-400">وجه كاميرا الهاتف نحو الرمز للمعاينة والتثبيت</p>
              </div>

              <div className="pt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 group-hover:underline">
                  <span>خيارات التنزيل والمشاركة</span>
                  <ChevronLeft className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* QR Code Sharing Full Modal */}
      <QRCodeShareModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        initialMode="install_app"
      />

      {/* iOS Safari Guided Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <span>تثبيت سكني على أجهزة iPhone</span>
              </h3>
              <button onClick={() => setShowIOSModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <ol className="space-y-2.5 text-xs text-slate-700 font-medium list-decimal list-inside">
              <li>افتح متصفح Safari واضغط على زر المشاركة (Share) في أسفل الشاشة.</li>
              <li>مرر للأسفل واختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.</li>
              <li>اضغط <strong>إضافة (Add)</strong> في أعلى الزاوية.</li>
            </ol>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs font-black cursor-pointer shadow-sm"
            >
              فهمت ذلك
            </button>
          </div>
        </div>
      )}
    </>
  );
};
