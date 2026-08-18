import React, { useState, useEffect } from "react";
import { User, Lock, Sparkles, ExternalLink, ShieldAlert, CheckCircle2 } from "lucide-react";
import { COFFEE } from "../../constants/constants";
import Swal from "sweetalert2";
import {
  updateAdminCredentials,
  getSettings,
  updateSettings,
} from "../../services/settingsService";

function AdminSettings() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Maintenance & Enhancement Screen Settings
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceTitle, setMaintenanceTitle] = useState(
    "نعمل حالياً على تطوير وتحسين تجربتكم لنقدم لكم الأفضل"
  );
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    "أهلاً بكم في منصة سكني! نقوم حالياً بإجراء تحديثات دورية وترقيات تقنية شاملة لتوفير تجربة استثنائية، أسرع وأسهل لتصفح، حجز، ومعاينة العقارات بمدينة دمياط الجديدة. سنعود للعمل بكامل طاقتنا قريباً جداً!"
  );
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoadingSettings(true);
        // Load from localStorage or API
        const localMode = localStorage.getItem("sakani_maintenance_mode");
        if (localMode !== null) {
          setMaintenanceMode(localMode === "true");
        }

        const data = await getSettings();
        if (data) {
          if (data.maintenance_mode !== undefined) {
            const isEnabled =
              data.maintenance_mode === true ||
              data.maintenance_mode === "true" ||
              data.maintenance_mode === "1" ||
              data.maintenance_mode === 1;
            setMaintenanceMode(isEnabled);
            localStorage.setItem("sakani_maintenance_mode", isEnabled ? "true" : "false");
          }
          if (data.maintenance_title) {
            setMaintenanceTitle(data.maintenance_title);
          }
          if (data.maintenance_message) {
            setMaintenanceMessage(data.maintenance_message);
          }
        }
      } catch (err) {
        console.warn("Error fetching settings:", err);
      } finally {
        setLoadingSettings(false);
      }
    })();
  }, []);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "كلمتا المرور غير متطابقتين.",
      });
      return;
    }

    try {
      await updateAdminCredentials({
        username: name,
        password,
        password_confirmation: confirmPassword,
      });

      Swal.fire({
        icon: "success",
        title: "تم الحفظ",
        text: "تم تحديث اسم المستخدم وكلمة المرور بنجاح.",
        confirmButtonColor: COFFEE.gold,
      });

      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "حدث خطأ",
        text: error.response?.data?.message || "تعذر تحديث البيانات.",
      });
    }
  };

  const handleSaveMaintenanceSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);

    try {
      // Save locally for instant effect
      localStorage.setItem("sakani_maintenance_mode", maintenanceMode ? "true" : "false");

      // Save to backend database
      await updateSettings({
        maintenance_mode: maintenanceMode,
        maintenance_title: maintenanceTitle,
        maintenance_message: maintenanceMessage,
      });

      Swal.fire({
        icon: "success",
        title: "تم حفظ إعدادات شاشة التحسينات",
        text: maintenanceMode
          ? "تم تفعيل شاشة التحسينات المؤقتة للزوار بنجاح (الأدمن فقط يمكنه تصفح لوحة التحكم)."
          : "تم إلغاء شاشة التحسينات والموقع يعمل الآن بشكل طبيعي لجميع الزوار.",
        confirmButtonColor: COFFEE.gold,
      });
    } catch (error) {
      console.error(error);
      // Even if backend call fails, local storage works
      Swal.fire({
        icon: "success",
        title: "تم الحفظ محلياً",
        text: "تم تطبيق الحالة على المتصفح الحالي بنجاح.",
        confirmButtonColor: COFFEE.gold,
      });
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Maintenance & Enhancement Temporary Screen Control */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-4 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: COFFEE.gold }}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: COFFEE.darkest }}>
                  شاشة التحسينات والصيانة المؤقتة
                </h2>
                <p className="text-xs text-stone-500">
                  عرض صفحة مخصصة للزوار تفيد بأن المنصة تخضع لأعمال تطوير وتحسين
                </p>
              </div>
            </div>
          </div>

          {/* Quick Preview Button */}
          <a
            href="/maintenance"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
            <span>معاينة الشاشة الحالية</span>
          </a>
        </div>

        <form onSubmit={handleSaveMaintenanceSettings} className="space-y-6">
          {/* Status Toggle Card */}
          <div
            className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              maintenanceMode
                ? "bg-amber-50/70 border-amber-300"
                : "bg-stone-50 border-stone-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl text-white mt-0.5 ${
                  maintenanceMode ? "bg-amber-600" : "bg-stone-400"
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  حالة وضع التحسينات (Maintenance Mode)
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  {maintenanceMode
                    ? "مفعّل حالياً: يرى الزوار شاشة التحسينات بدلاً من صفحات الموقع العامة (لوحة الأدمن تظل متاحة لك)."
                    : "معطّل: الموقع يعمل بشكل طبيعي ومتاح لجميع الزوار."}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[4px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-600"></div>
              <span className="mr-3 text-xs font-bold text-stone-700">
                {maintenanceMode ? "مفعّل" : "معطّل"}
              </span>
            </label>
          </div>

          {/* Title Field */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              عنوان الشاشة الرئيسي (Headline)
            </label>
            <input
              type="text"
              value={maintenanceTitle}
              onChange={(e) => setMaintenanceTitle(e.target.value)}
              placeholder="نعمل حالياً على تطوير وتحسين تجربتكم لنقدم لكم الأفضل"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              رسالة الشاشة التوضيحية (Message)
            </label>
            <textarea
              rows={3}
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              placeholder="رسالة موجهة للزوار توضح أسباب وأهداف أعمال التطوير والتحديث..."
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSettings || loadingSettings}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50 cursor-pointer"
              style={{
                backgroundColor: COFFEE.dark,
              }}
            >
              {savingSettings ? "جاري الحفظ..." : "حفظ إعدادات شاشة التحسينات"}
            </button>
          </div>
        </form>
      </div>

      {/* Admin Credentials Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-4 md:p-8 mb-8">
        <h2 className="text-xl font-bold mb-6" style={{ color: COFFEE.dark }}>
          بيانات حساب الأدمن
        </h2>

        <form onSubmit={handleCredentialsSubmit} className="space-y-6">
          <div>
            <label className="flex items-center gap-2 mb-2 font-semibold text-xs text-stone-700">
              <User size={16} />
              اسم الأدمن
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسم الأدمن"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-200"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 mb-2 font-semibold text-xs text-stone-700">
                <Lock size={16} />
                كلمة المرور الجديدة
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-200"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2 font-semibold text-xs text-stone-700">
                <Lock size={16} />
                تأكيد كلمة المرور
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-200"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-sm"
              style={{
                backgroundColor: COFFEE.gold,
                color: COFFEE.dark,
              }}
            >
              حفظ بيانات الأدمن
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminSettings;