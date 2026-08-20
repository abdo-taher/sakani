import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  CheckCircle2, 
  ShieldCheck, 
  Database, 
  Bell, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  MessageCircle, 
  Share2, 
  Clock, 
  Sparkles,
  Loader2,
  QrCode,
  Smartphone,
  MessageSquare,
  HelpCircle,
  Download,
  Check,
  Zap,
  Radio
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { SystemSettings } from '../../types';
import { QRCodeShareModal } from '../../components/QRCodeShareModal';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(() => StorageService.getSettings());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const local = StorageService.getSettings();
    setSettings(local);

    try {
      const serverSettings = await ApiService.getSettings();
      if (serverSettings && typeof serverSettings === 'object') {
        const merged = { ...local, ...serverSettings };
        setSettings(merged);
        StorageService.saveSettings(merged);
      }
    } catch (e) {
      console.warn('Settings load fallback to local:', e);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // 1. Save local
    StorageService.saveSettings(settings);

    // 2. Save backend
    try {
      await ApiService.saveSettings(settings);
    } catch (e) {
      console.warn('Backend settings save warning:', e);
    }

    setSaving(false);
    setSavedStatus('تم حفظ وتحديث إعدادات النظام بنجاح!');
    setTimeout(() => setSavedStatus(null), 3500);
  };

  const handleResetData = () => {
    if (window.confirm('تحذير: هل تريد حقاً إعادة ضبط البيانات المحلية إلى الحالة الافتراضية؟')) {
      StorageService.resetToDefaults();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-7 h-7 text-[#8D6A28]" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed">
              الإعدادات العامة للنظام والمنصة
            </h1>
          </div>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">
            تخصيص بيانات المنصة، توقيت استطلاع الرأي، تثبيت التطبيق، الإشعارات، ورمز الاستجابة السريع QR
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-amber-300" />
            <span>مشاركة الموقع ورمز QR</span>
          </button>

          {savedStatus && (
            <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black flex items-center gap-2 shadow-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>{savedStatus}</span>
            </div>
          )}
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Feedback & Visitor Survey Controls */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#8D6A28]" />
              <span>التحكم بنوافذ استطلاع الرأي والتقييمات (Feedback Controls)</span>
            </h3>
            <span className="text-[11px] font-bold text-[#8D6A28] bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              توقيت وظهور الاستطلاع
            </span>
          </div>

          <div className="space-y-4">
            {/* Toggle Master Feedback */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-900 block">تفعيل نوافذ استطلاع رأي وتقييمات العملاء</span>
                <span className="text-[11px] text-slate-500">إظهار استطلاعات الرأي وحملات جمع الآراء للزوار وفق التوقيت المحدد أدناه</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.feedback_enabled !== false}
                  onChange={(e) => setSettings({ ...settings, feedback_enabled: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8D6A28]" />
              </label>
            </div>

            {/* Delay Settings & Timing Mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#8D6A28]" />
                  <span>توقيت ظهور استطلاع الرأي بعد دخول الزائر (Delay Time) *</span>
                </label>
                <select
                  value={settings.feedback_delay_seconds !== undefined ? String(settings.feedback_delay_seconds) : '60'}
                  onChange={(e) => setSettings({ ...settings, feedback_delay_seconds: parseInt(e.target.value, 10) || 60 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
                >
                  <option value="2">فوري (2 ثانية — للاختبار والمعاينة الفورية)</option>
                  <option value="60">بعد دقيقة واحدة (1 دقيقة — 60 ثانية)</option>
                  <option value="180">بعد 3 دقائق (180 ثانية)</option>
                  <option value="300">بعد 5 دقائق (300 ثانية)</option>
                  <option value="600">بعد 10 دقائق (600 ثانية)</option>
                  <option value="900">بعد 15 دقيقة (900 ثانية)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  يحدد المدة الزمنية التي يقضيها الزائر في تصفح الموقع قبل ظهور نافذة الاستطلاع.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  <span>آلية وظروف الظهور (Trigger Frequency) *</span>
                </label>
                <select
                  value={settings.feedback_trigger_mode || 'first_visit'}
                  onChange={(e) => setSettings({ ...settings, feedback_trigger_mode: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
                >
                  <option value="first_visit">الزيارة الأولى فقط (First visit only — لعدم إزعاج العميل)</option>
                  <option value="every_visit">في كل زيارة وجلسة بعد انقضاء الوقت المحدد (Every visit)</option>
                  <option value="cooldown">بعد فترة انتظار (3 أيام بعد الإغلاق)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  الوضع الافتراضي والموصى به هو الزيارة الأولى لضمان تجربة تصفح مريحة.
                </p>
              </div>
            </div>

            {/* Egyptian Hospitality Welcome Survey Sub-settings */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🇪🇬</span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">نافذة الترحيب المصرية "عرفتنا منين يا باشا؟"</span>
                    <span className="text-[10px] text-slate-600">جمع قنوات الاكتساب (فيسبوك، انستجرام، ترشيح، بحث جوجل، يافطة...)</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.feedback_welcome_modal_enabled !== false}
                    onChange={(e) => setSettings({ ...settings, feedback_welcome_modal_enabled: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8D6A28]" />
                </label>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  توقيت ظهور نافذة الترحيب المصرية:
                </label>
                <select
                  value={settings.feedback_welcome_delay_seconds !== undefined ? String(settings.feedback_welcome_delay_seconds) : '60'}
                  onChange={(e) => setSettings({ ...settings, feedback_welcome_delay_seconds: parseInt(e.target.value, 10) || 60 })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="2">فوري (2 ثانية — ترحيب مباشر عند الدخول)</option>
                  <option value="60">بعد 1 دقيقة (60 ثانية)</option>
                  <option value="180">بعد 3 دقائق (180 ثانية)</option>
                  <option value="300">بعد 5 دقائق (300 ثانية)</option>
                  <option value="600">بعد 10 دقائق (600 ثانية)</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Section 2: App Install & Notification Hub Controls */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <span>التحكم بتثبيت التطبيق والإشعارات الفورية (App & Notifications)</span>
            </h3>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              PWA & Push Settings
            </span>
          </div>

          <div className="space-y-4">
            {/* Toggle 1: Home Page App Install Banner */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-900 block">عرض قسم "تثبيت التطبيق والإشعارات" في الصفحة الرئيسية</span>
                <span className="text-[11px] text-slate-500">إظهار قسم أنيق مع رمز QR ومؤشر الإشعارات التفاعلي في الهوم بيج</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.home_install_banner_enabled !== false}
                  onChange={(e) => setSettings({ ...settings, home_install_banner_enabled: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8D6A28]" />
              </label>
            </div>

            {/* Toggle 2: PWA Install Prompts */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-900 block">تفعيل خيارات وتثبيت تطبيق الويب (PWA Application)</span>
                <span className="text-[11px] text-slate-500">السماح للزوار بتثبيت منصة سكني كتطبيق على الجوال والشاشة الرئيسية</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.pwa_install_enabled !== false}
                  onChange={(e) => setSettings({ ...settings, pwa_install_enabled: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            {/* Toggle 3: Push Notification Requests */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-900 block">تفعيل نوافذ ومطالبات إذن الإشعارات الفورية (Push Notifications)</span>
                <span className="text-[11px] text-slate-500">طلب إذن إرسال تنبيهات العقارات الجديدة وتغييرات الأسعار إلى متصفح العميل</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.notification_prompt_enabled !== false}
                  onChange={(e) => setSettings({ ...settings, notification_prompt_enabled: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600" />
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: General Platform Info */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Globe className="w-5 h-5 text-[#8D6A28]" />
            <span>البيانات الأساسية للمنصة</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم الموقع والمنصة *</label>
              <input
                type="text"
                value={settings.site_name || ''}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">شعار / وصف المنصة الترويجي (Tagline)</label>
              <input
                type="text"
                value={settings.hero_tagline || ''}
                onChange={(e) => setSettings({ ...settings, hero_tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#8D6A28]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">عنوان مقر الشركة / المكتب</label>
              <input
                type="text"
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#8D6A28]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">أوقات وساعات العمل</label>
              <input
                type="text"
                value={settings.working_hours || ''}
                onChange={(e) => setSettings({ ...settings, working_hours: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#8D6A28]"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Direct Contact & WhatsApp */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Phone className="w-5 h-5 text-[#8D6A28]" />
            <span>قنوات الاتصال المباشر وواتساب</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم هاتف الاتصال المعتمد *</label>
              <input
                type="text"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
                dir="ltr"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم واتساب المباشر (مع كود الدولة) *</label>
              <input
                type="text"
                value={settings.whatsapp || ''}
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                placeholder="201067725976"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
                dir="ltr"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني الرسمي *</label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
                dir="ltr"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 5: Social Media Links */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Share2 className="w-5 h-5 text-[#8D6A28]" />
            <span>روابط منصات التواصل الاجتماعي</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رابط صفحة فيسبوك</label>
              <input
                type="url"
                value={settings.facebook_url || ''}
                onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
                placeholder="https://facebook.com/..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none focus:border-[#8D6A28]"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رابط حساب انستجرام</label>
              <input
                type="url"
                value={settings.instagram_url || ''}
                onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                placeholder="https://instagram.com/..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none focus:border-[#8D6A28]"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رابط حساب تيك توك</label>
              <input
                type="url"
                value={settings.tiktok_url || ''}
                onChange={(e) => setSettings({ ...settings, tiktok_url: e.target.value })}
                placeholder="https://tiktok.com/@..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none focus:border-[#8D6A28]"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Section 6: Announcement Bar & Commission Text */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-5 h-5 text-[#8D6A28]" />
            <span>شريط الإعلانات العلوي والعمولة</span>
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-900 block">تفعيل شريط الإعلانات الترويجي العلوي</span>
                <span className="text-[11px] text-slate-500">عرض شريط مميز أعلى الهيدر في كافة الصفحات العامة</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.announcement_enabled !== false}
                  onChange={(e) => setSettings({ ...settings, announcement_enabled: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8D6A28]" />
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نص شريط الإعلانات</label>
              <input
                type="text"
                value={settings.announcement_text || ''}
                onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
                placeholder="🔥 عروض مميزة متاحة الآن..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نسبة عمولة سكني المقدرة (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={settings.commission_percentage !== undefined ? settings.commission_percentage : 2.5}
                    onChange={(e) => {
                      const val = e.target.value;
                      const numRate = parseFloat(val) || 0;
                      setSettings(prev => {
                        const currentText = prev.commission_text || `عمولة الوساطة ${numRate}% تدفع عند إتمام التعاقد فقط، والمعاينة مجانية تماماً`;
                        const updatedText = /\d+(\.\d+)?%/.test(currentText)
                          ? currentText.replace(/\d+(\.\d+)?%/, `${numRate}%`)
                          : `${currentText} (${numRate}%)`;
                        return {
                          ...prev,
                          commission_percentage: val === '' ? ('' as any) : numRate,
                          commission_text: updatedText
                        };
                      });
                    }}
                    placeholder="2.5"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">تُستخدم تلقائياً في حساب العمولات المقدرة في لوحة التحكم وتفاصيل العقارات</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نص شروط وعمولة الوساطة المختصر</label>
                <input
                  type="text"
                  value={settings.commission_text || ''}
                  onChange={(e) => setSettings({ ...settings, commission_text: e.target.value })}
                  placeholder="عمولة 2.5% فقط تدفع عند إتمام التعاقد..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#8D6A28]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
          <button
            type="button"
            onClick={handleResetData}
            className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>إعادة ضبط البيانات الافتراضية (Reset Data)</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-7 py-3 rounded-xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-black shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'جاري الحفظ...' : 'حفظ الإعدادات بالكامل'}</span>
          </button>
        </div>

      </form>

      {/* QR Code Modal for Admin */}
      <QRCodeShareModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        initialMode="website"
      />

    </div>
  );
};
