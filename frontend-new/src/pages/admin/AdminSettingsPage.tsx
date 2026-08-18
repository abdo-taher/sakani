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
  Loader2
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { SystemSettings } from '../../types';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(() => StorageService.getSettings());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);

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
            تخصيص بيانات المنصة، أرقام التواصل والواتساب، الروابط الاجتماعية، وساعات العمل
          </p>
        </div>

        {savedStatus && (
          <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black flex items-center gap-2 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{savedStatus}</span>
          </div>
        )}
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: General Platform Info */}
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

        {/* Section 2: Direct Contact & WhatsApp */}
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

        {/* Section 3: Social Media Links */}
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

        {/* Section 4: Announcement Bar & Commission Text */}
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
                    onChange={(e) => setSettings({ ...settings, commission_percentage: parseFloat(e.target.value) || 0 })}
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

    </div>
  );
};
