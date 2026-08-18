import React, { useState } from "react";
import {
  Sparkles,
  Phone,
  MessageCircle,
  Mail,
  RefreshCw,
  Clock,
  ShieldCheck,
  Zap,
  Search,
  Building2,
  Lock,
  CalendarCheck,
  CheckCircle2,
} from "lucide-react";
import { COFFEE, ADMIN_LOGIN_TOKEN } from "../constants/constants";

export default function EnhancingExperience({
  title = "نعمل حالياً على تطوير وتحسين تجربتكم لنقدم لكم الأفضل",
  message = "أهلاً بكم في منصة سكني! نقوم حالياً بإجراء تحديثات دورية وترقيات تقنية شاملة لتوفير تجربة استثنائية، أسرع وأسهل لتصفح، حجز، ومعاينة العقارات بمدينة دمياط الجديدة. سنعود للعمل بكامل طاقتنا قريباً جداً!",
  phone = "01067725976",
  whatsapp = "201067725976",
  email = "info@sakani.site",
  onRefresh,
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState(null);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setRefreshNotice(null);

    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshNotice("جاري فحص حالة النظام والتحديثات...");
      if (typeof onRefresh === "function") {
        onRefresh();
      } else {
        window.location.reload();
      }
    }, 900);
  };

  const whatsappMessage = encodeURIComponent(
    "مرحباً فريق سكني، أود الاستفسار بخصوص العقارات المتاحة بدمياط الجديدة أثناء فترة التحديث والتطوير."
  );

  const whatsappUrl = `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${whatsappMessage}`;

  return (
    <div
      className="min-h-screen relative flex flex-col justify-between overflow-x-hidden selection:bg-amber-100 selection:text-amber-900"
      style={{
        backgroundColor: "#FAF6F0",
        color: COFFEE.darkest,
      }}
    >
      {/* Background Decorative Ambient Circles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-30 blur-3xl"
          style={{ backgroundColor: "#E8D8C3" }}
        />
        <div
          className="absolute top-1/2 -left-48 w-[450px] h-[450px] rounded-full opacity-25 blur-3xl"
          style={{ backgroundColor: "#B08D57" }}
        />
        <div
          className="absolute -bottom-24 right-1/4 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: "#D4B996" }}
        />
      </div>

      {/* Header Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="flex items-center justify-between border-b border-amber-900/10 pb-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md shadow-amber-900/10 text-white font-bold text-xl"
              style={{
                background: `linear-gradient(135deg, ${COFFEE.dark}, ${COFFEE.mid})`,
              }}
            >
              <Building2 className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="font-black text-2xl tracking-tight"
                  style={{ color: COFFEE.darkest }}
                >
                  سكني
                </span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-md text-amber-900"
                  style={{ backgroundColor: "#EBDCC9" }}
                >
                  دمياط الجديدة
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                المنصة العقارية الأولى
              </p>
            </div>
          </div>

          {/* Live Status Badge */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-amber-200/80 shadow-xs backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
            </span>
            <span className="text-xs font-bold text-amber-900">
              أعمال تطوير وتحديث
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex-1 flex flex-col items-center justify-center text-center">
        {/* Animated Feature Icon Badge */}
        <div className="relative mb-6">
          <div
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center shadow-xl shadow-amber-900/10 border-2 border-amber-200/60 transition-transform duration-500 hover:scale-105"
            style={{
              background: `linear-gradient(145deg, #FFFFFF 0%, #F5EBE1 100%)`,
            }}
          >
            <Sparkles
              className="w-12 h-12 sm:w-14 sm:h-14 animate-pulse"
              style={{ color: COFFEE.gold }}
            />
          </div>
          <div
            className="absolute -bottom-2 -right-2 p-2 rounded-xl text-white shadow-md"
            style={{ backgroundColor: COFFEE.mid }}
          >
            <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: "12s" }} />
          </div>
        </div>

        {/* Highlight Pill */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold mb-4 shadow-xs"
          style={{
            backgroundColor: "#F0E4D4",
            color: COFFEE.dark,
          }}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>ترقية شاملة للمنصة • System Enhancement</span>
        </div>

        {/* Primary Title */}
        <h1
          className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight sm:leading-snug max-w-3xl mb-4"
          style={{ color: COFFEE.darkest }}
        >
          {title}
        </h1>

        {/* Subtitle / Explanation */}
        <p className="text-sm sm:text-base md:text-lg text-stone-600 font-normal leading-relaxed max-w-2xl mb-8">
          {message}
        </p>

        {/* Progress Tracker Card */}
        <div className="w-full max-w-2xl bg-white/90 border border-amber-900/10 rounded-2xl p-5 sm:p-6 shadow-sm backdrop-blur-md mb-8 text-right">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-bold text-stone-700 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              نسبة تقدم التحسينات والتجهيز
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-amber-800">
              88%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden p-0.5 border border-stone-200 mb-4">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: "88%",
                background: `linear-gradient(90deg, ${COFFEE.gold}, ${COFFEE.mid})`,
              }}
            />
          </div>

          {/* Roadmap Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50/70 border border-emerald-200/60 rounded-lg px-2.5 py-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>ترقية وتأمين الخوادم</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50/70 border border-emerald-200/60 rounded-lg px-2.5 py-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>تحسين سرعة التصفح</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-800 font-bold bg-amber-50/80 border border-amber-200/70 rounded-lg px-2.5 py-1.5 animate-pulse">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>اللمسات النهائية للإطلاق</span>
            </div>
          </div>
        </div>

        {/* What We Are Upgrading - Highlights Grid */}
        <div className="w-full max-w-3xl mb-10 text-right">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-500 mb-3 text-center">
            أبرز المزايا والتحسينات القادمة إليكم
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="bg-white/80 border border-amber-900/10 rounded-xl p-4 flex items-start gap-3 shadow-xs hover:border-amber-400 transition-colors">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700 shrink-0 mt-0.5">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-800 mb-1">
                  سرعة فائقة واستجابة فورية
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  تحسين مضاعف لسرعة تصفح العقارات وعرض الصور والفيديوهات بدون تأخير.
                </p>
              </div>
            </div>

            <div className="bg-white/80 border border-amber-900/10 rounded-xl p-4 flex items-start gap-3 shadow-xs hover:border-amber-400 transition-colors">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700 shrink-0 mt-0.5">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-800 mb-1">
                  بحث وفلاتر ذكية دقيقة
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  الوصول للعقار المناسب (بيع، إيجار، طلاب، تجاري) بضغطة زر واحدة.
                </p>
              </div>
            </div>

            <div className="bg-white/80 border border-amber-900/10 rounded-xl p-4 flex items-start gap-3 shadow-xs hover:border-amber-400 transition-colors">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700 shrink-0 mt-0.5">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-800 mb-1">
                  حجز مواعيد ومعاينات أسهل
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  تنسيق المعاينات الفورية وتأكيدها عبر الرسائل وواتساب بكل سلاسة.
                </p>
              </div>
            </div>

            <div className="bg-white/80 border border-amber-900/10 rounded-xl p-4 flex items-start gap-3 shadow-xs hover:border-amber-400 transition-colors">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-800 mb-1">
                  موثوقية وأمان تام
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  فحص قانوني دقيق لجميع الإعلانات لحماية المشتري والمستأجر.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Direct Contact Channels - Never Leave Users Stranded */}
        <div className="w-full max-w-2xl bg-gradient-to-br from-white to-amber-50/50 border-2 border-amber-200/80 rounded-2xl p-6 shadow-sm mb-6">
          <h3
            className="text-base sm:text-lg font-bold mb-1"
            style={{ color: COFFEE.dark }}
          >
            هل تبحث عن عقار عاجل أو تحتاج مساعدة فورية؟
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 mb-5">
            فريق مستشاري سكني متاح دائماً لخدمتك والرد على استفساراتك هاتفياً وعبر واتساب:
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* WhatsApp CTA */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              style={{ backgroundColor: "#25D366" }}
            >
              <MessageCircle className="w-4 h-4" />
              <span>تواصل عبر واتساب</span>
            </a>

            {/* Direct Phone Call */}
            <a
              href={`tel:${phone.replace(/[^0-9]/g, "")}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              style={{ backgroundColor: COFFEE.dark }}
            >
              <Phone className="w-4 h-4" />
              <span dir="ltr">{phone}</span>
            </a>

            {/* Email */}
            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <Mail className="w-4 h-4 text-stone-500" />
                <span>{email}</span>
              </a>
            )}
          </div>
        </div>

        {/* Refresh / Check Status Button */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white/80 border border-stone-300/80 text-stone-700 hover:bg-white hover:text-stone-900 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-700" : ""}`}
            />
            <span>{isRefreshing ? "جاري التحديث..." : "إعادة المحاولة وفحص حالة الموقع"}</span>
          </button>

          {refreshNotice && (
            <p className="text-xs text-amber-800 font-medium animate-fadeIn">
              {refreshNotice}
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 border-t border-amber-900/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 font-medium">
          <div>
            جميع الحقوق محفوظة © {new Date().getFullYear()} منصة سكني العقارية
          </div>

          {/* Admin Login Link */}
          <div>
            <a
              href={`/admin/${ADMIN_LOGIN_TOKEN}/login`}
              className="inline-flex items-center gap-1.5 text-stone-400 hover:text-amber-800 transition-colors p-1 rounded-md"
              title="دخول مسؤولي النظام"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>دخول الإدارة</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
