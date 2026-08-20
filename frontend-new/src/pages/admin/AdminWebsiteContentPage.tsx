import React, { useState, useEffect } from 'react';
import { SystemSettings } from '../../types';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { FALLBACK_PROPERTY_IMAGE } from '../../utils/media';
import { 
  Globe, 
  Video, 
  Layout, 
  Phone, 
  Share2, 
  Layers, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  Play, 
  Volume2, 
  VolumeX,
  BellRing,
  ExternalLink,
  ShieldCheck,
  Award,
  Users
} from 'lucide-react';

type CmsTab = 'hero' | 'sections' | 'contact' | 'social' | 'footer' | 'general';

export const AdminWebsiteContentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CmsTab>('hero');
  const [settings, setSettings] = useState<SystemSettings>(() => StorageService.getSettings());
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const local = StorageService.getSettings();
    setSettings(local);

    try {
      const serverSettings = await ApiService.getSettings();
      if (serverSettings && typeof serverSettings === 'object') {
        const merged = { ...local, ...serverSettings };
        setSettings(merged);
        StorageService.saveSettings(merged);
      }
    } catch {}
  };

  const handleSaveTab = async (tabName: string) => {
    setSaveStatus('جاري الحفظ...');

    // 1. Save to local storage for instant reactivity
    StorageService.saveSettings(settings);

    // 2. Save to backend API
    try {
      await ApiService.saveSettings(settings);
    } catch (e) {
      console.warn('Backend settings save error:', e);
    }

    setSaveStatus(`تم حفظ ${tabName} بنجاح!`);
    setTimeout(() => {
      setSaveStatus(null);
    }, 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-7 h-7 text-[#8D6A28]" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed">
              إدارة محتوى الموقع (Website CMS)
            </h1>
          </div>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">
            التحكم الكامل بفيديو الهيرو، نصوص الصفحات، بيانات التواصل، الروابط، وإعدادات العرض
          </p>
        </div>

        {saveStatus && (
          <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black flex items-center gap-2 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveStatus}</span>
          </div>
        )}
      </div>

      {/* Internal CMS Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
        {[
          { id: 'hero' as CmsTab, label: 'الواجهة الرئيسية (Hero Video)', icon: Video },
          { id: 'sections' as CmsTab, label: 'أقسام الصفحة الرئيسية', icon: Layout },
          { id: 'contact' as CmsTab, label: 'بيانات التواصل', icon: Phone },
          { id: 'social' as CmsTab, label: 'وسائل التواصل الاجتماعي', icon: Share2 },
          { id: 'footer' as CmsTab, label: 'الفوتر وحقوق النشر', icon: Layers },
          { id: 'general' as CmsTab, label: 'إعدادات الموقع والشريط الإعلاني', icon: BellRing },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#8D6A28] text-white shadow-xs'
                  : 'text-slate-600 bg-white hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* ---------------- TAB 1: HERO SECTION & VIDEO ---------------------------- */}
      {/* ========================================================================= */}
      {activeTab === 'hero' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 animate-fade-in">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">إعدادات الواجهة الرئيسية وفيديو الخلفية (Hero Section)</h3>
            <p className="text-xs text-slate-500">تحكم بالعنوان الرئيسي، الشعار، رابط الفيديو الخلفي، والصورة الاحتياطية</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الشعار الترويجي الصغير (Tagline Badge)</label>
                <input
                  type="text"
                  value={settings.hero_tagline || ''}
                  onChange={(e) => setSettings({ ...settings, hero_tagline: e.target.value })}
                  placeholder="مثال: منصة العقارات الأولى في دمياط الجديدة"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-[#8D6A28]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">العنوان الرئيسي للهيرو (Hero Title)</label>
                <input
                  type="text"
                  value={settings.hero_title || ''}
                  onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                  placeholder="مثال: بيتك المثالي في دمياط الجديدة بلمسة واحدة"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الوصف الفرعي (Hero Subtitle)</label>
                <textarea
                  rows={2}
                  value={settings.hero_subtitle || ''}
                  onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                  placeholder="مثال: تصفح أحدث الشقق، الفيلات، المحلات، والأراضي بأفضل الأسعار الموثقة..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-[#8D6A28]"
                />
              </div>

              {/* Video URL & Toggle */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#8D6A28]" />
                    <span className="text-xs font-extrabold text-slate-900">فيديو الخلفية التفاعلي</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.hero_use_video ?? true}
                      onChange={(e) => setSettings({ ...settings, hero_use_video: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8D6A28]" />
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    رابط فيديو الهيرو المباشر (Direct Video MP4 URL)
                  </label>
                  <input
                    type="url"
                    value={settings.hero_video_url || ''}
                    onChange={(e) => setSettings({ ...settings, hero_video_url: e.target.value })}
                    placeholder="https://sakani.site/hero.mp4?v=3"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:border-[#8D6A28]"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    يمكن استبدال الرابط بأي ملف MP4 مباشر أو تركه بالقيمة الافتراضية.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">صورة الغلاف البديلة (Poster Image Fallback)</label>
                <input
                  type="url"
                  value={settings.hero_bg_image || ''}
                  onChange={(e) => setSettings({ ...settings, hero_bg_image: e.target.value })}
                  placeholder="/hero-poster.jpg"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:border-[#8D6A28]"
                />
              </div>
            </div>

            {/* Live Video Preview Box */}
            <div className="space-y-3">
              <span className="text-xs font-extrabold text-slate-900 block">معاينة حية لفيديو الهيرو:</span>
              
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#0F172A] border border-slate-300 shadow-md">
                {settings.hero_use_video && settings.hero_video_url ? (
                  <video
                    key={settings.hero_video_url}
                    src={settings.hero_video_url}
                    autoPlay
                    loop
                    muted={isVideoMuted}
                    playsInline
                    poster={settings.hero_bg_image}
                    className="w-full h-full object-cover opacity-60"
                  />
                ) : (
                  <div 
                    className="w-full h-full bg-cover bg-center opacity-50"
                    style={{ backgroundImage: `url(${settings.hero_bg_image || FALLBACK_PROPERTY_IMAGE})` }}
                  />
                )}

                {/* Video Overlay Preview */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                  <div className="text-[10px] font-bold text-[#D6A94E] mb-1">
                    {settings.hero_tagline || 'شعار الموقع'}
                  </div>
                  <h4 className="font-extrabold text-sm sm:text-base leading-snug line-clamp-1">
                    {settings.hero_title || 'العنوان الرئيسي للواجهة'}
                  </h4>
                  <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                    {settings.hero_subtitle || 'الوصف الفرعي هنا...'}
                  </p>
                </div>

                {/* Mute toggle for preview */}
                {settings.hero_use_video && settings.hero_video_url && (
                  <button
                    type="button"
                    onClick={() => setIsVideoMuted(!isVideoMuted)}
                    className="absolute top-3 left-3 p-2 rounded-xl bg-black/60 text-white text-xs flex items-center gap-1 cursor-pointer hover:bg-black/80 transition"
                  >
                    {isVideoMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#D6A94E]" />}
                    <span>{isVideoMuted ? 'صامت' : 'صوت'}</span>
                  </button>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>يتم تطبيق التعديلات فوراً على الصفحة الرئيسية للموقع العام بمجرد الضغط على زر الحفظ.</span>
              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => handleSaveTab('إعدادات الواجهة الرئيسية')}
              className="px-6 py-3 rounded-2xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-extrabold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ إعدادات الواجهة الرئيسية</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ---------------- TAB 2: HOME SECTIONS & WHY US --------------------------- */}
      {/* ========================================================================= */}
      {activeTab === 'sections' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 animate-fade-in">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">أقسام الصفحة الرئيسية ومميزات سكني</h3>
            <p className="text-xs text-slate-500">تعديل عناوين الأقسام ونقاط "لماذا تختار منصة سكني؟"</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">عنوان قسم العقارات المميزة</label>
              <input
                type="text"
                value={settings.featured_section_title || 'عقارات مميزة في دمياط الجديدة'}
                onChange={(e) => setSettings({ ...settings, featured_section_title: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">عنوان قسم أحدث العقارات</label>
              <input
                type="text"
                value={settings.latest_section_title || 'أحدث الإضافات المتاحة'}
                onChange={(e) => setSettings({ ...settings, latest_section_title: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
              />
            </div>
          </div>

          {/* Why Us Items Editor */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-sm font-black text-slate-900">عناصر قسم "لماذا تختار سكني؟" (3 ميزات رئيسية):</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(settings.why_us_items || []).map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#8D6A28] text-white text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => {
                        const updated = [...(settings.why_us_items || [])];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        setSettings({ ...settings, why_us_items: updated });
                      }}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={item.description}
                    onChange={(e) => {
                      const updated = [...(settings.why_us_items || [])];
                      updated[idx] = { ...updated[idx], description: e.target.value };
                      setSettings({ ...settings, why_us_items: updated });
                    }}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => handleSaveTab('أقسام الصفحة الرئيسية')}
              className="px-6 py-3 rounded-2xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-extrabold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ إعدادات أقسام الهوم</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ---------------- TAB 3: CONTACT INFORMATION ----------------------------- */}
      {/* ========================================================================= */}
      {activeTab === 'contact' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 animate-fade-in">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">بيانات التواصل وأرقام الهواتف الرسمية</h3>
            <p className="text-xs text-slate-500">تظهر هذه البيانات في الهيدر، الفوتر، وصفحة اتصل بنا، وأزرار الواتساب</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف الأساسي (Phone)</label>
              <input
                type="text"
                value={settings.company_phone || '01067725976'}
                onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف الثانوي (اختياري)</label>
              <input
                type="text"
                value={settings.company_phone_secondary || '01011112222'}
                onChange={(e) => setSettings({ ...settings, company_phone_secondary: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الواتساب المعتمد (WhatsApp)</label>
              <input
                type="text"
                value={settings.company_whatsapp || '201067725976'}
                onChange={(e) => setSettings({ ...settings, company_whatsapp: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني الرسمي (Email)</label>
              <input
                type="email"
                value={settings.company_email || 'info@sakani.site'}
                onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none"
                dir="ltr"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">عنوان المقر في دمياط الجديدة</label>
              <input
                type="text"
                value={settings.company_address || 'دمياط الجديدة - بجوار الكنيسة والخدمات المركزية'}
                onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => handleSaveTab('بيانات التواصل')}
              className="px-6 py-3 rounded-2xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-extrabold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ بيانات التواصل</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ---------------- TAB 4: SOCIAL MEDIA LINKS ------------------------------ */}
      {/* ========================================================================= */}
      {activeTab === 'social' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 animate-fade-in">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">روابط صفحات التواصل الاجتماعي</h3>
            <p className="text-xs text-slate-500">تظهر هذه الروابط في فوتر الموقع وصفحة التواصل</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">صفحة فيسبوك (Facebook)</label>
              <input
                type="url"
                value={settings.facebook_url || ''}
                onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
                placeholder="https://facebook.com/sakani.damietta"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">حساب انستغرام (Instagram)</label>
              <input
                type="url"
                value={settings.instagram_url || ''}
                onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                placeholder="https://instagram.com/sakani.damietta"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">منصة تويتر / إكس (Twitter / X)</label>
              <input
                type="url"
                value={settings.twitter_url || ''}
                onChange={(e) => setSettings({ ...settings, twitter_url: e.target.value })}
                placeholder="https://twitter.com/sakani_damietta"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">حساب تيك توك (TikTok)</label>
              <input
                type="url"
                value={settings.tiktok_url || ''}
                onChange={(e) => setSettings({ ...settings, tiktok_url: e.target.value })}
                placeholder="https://tiktok.com/@sakani"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none"
                dir="ltr"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => handleSaveTab('روابط السوشيال ميديا')}
              className="px-6 py-3 rounded-2xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-extrabold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ روابط السوشيال ميديا</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ---------------- TAB 5: FOOTER & COPYRIGHTS ----------------------------- */}
      {/* ========================================================================= */}
      {activeTab === 'footer' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 animate-fade-in">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">إعدادات الفوتر وحقوق النشر</h3>
            <p className="text-xs text-slate-500">النصوص والبيانات التعريفية المعروضة أسفل كافة صفحات الموقع</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الوصف التعريفي بالفوتر (Footer About Text)</label>
              <textarea
                rows={3}
                value={settings.footer_description || 'سكني هي المنصة العقارية الأولى الرائدة في دمياط الجديدة، نقدم حلولاً عقارية موثوقة للشراء والإيجار والاستثمار بأعلى معايير الشفافية.'}
                onChange={(e) => setSettings({ ...settings, footer_description: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نص حقوق النشر (Copyright Notice)</label>
              <input
                type="text"
                value={settings.footer_copyright || 'جميع الحقوق محفوظة © منصة سكني العقارية'}
                onChange={(e) => setSettings({ ...settings, footer_copyright: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => handleSaveTab('إعدادات الفوتر')}
              className="px-6 py-3 rounded-2xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-extrabold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ إعدادات الفوتر</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ---------------- TAB 6: GENERAL & ANNOUNCEMENT BAR ---------------------- */}
      {/* ========================================================================= */}
      {activeTab === 'general' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 animate-fade-in">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">إعدادات الموقع والشريط الإعلاني العلوي</h3>
            <p className="text-xs text-slate-500">التحكم في شريط الإعلانات أعلى الموقع واسم المنصة</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم الموقع والمنصة (Site Name)</label>
              <input
                type="text"
                value={settings.site_name || 'سكني — المنصة العقارية الأولى في دمياط الجديدة'}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
              />
            </div>

            {/* Announcement Banner */}
            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-[#8D6A28]" />
                  <span className="text-xs font-extrabold text-slate-900">الشريط الإعلاني أعلى الموقع (Announcement Bar)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.announcement_enabled ?? false}
                    onChange={(e) => setSettings({ ...settings, announcement_enabled: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8D6A28]" />
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">نص الإعلان أو التنبيه</label>
                <input
                  type="text"
                  value={settings.announcement_text || ''}
                  onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
                  placeholder="مثال: خصومات حصرية 5% على شقق الحي المتميز للحجز خلال هذا الأسبوع!"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => handleSaveTab('إعدادات الموقع')}
              className="px-6 py-3 rounded-2xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-extrabold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ إعدادات الموقع</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
