import React, { useRef, useState } from "react";
import usePageTitle from "../hooks/usePageTitle";

import {
  Building2,
  Users,
  MapPin,
  Award,
  Tag,
  ShoppingBag,
  KeyRound,
  HelpCircle,
} from "lucide-react";

import Reveal from "../components/Reveal";
import CountUp from "../components/CountUp";
import TopViewedNotice from "../components/TopViewedNotice";
import BestPropertiesSection from "../components/BestPropertiesSection";

import { COFFEE } from "../constants/constants";
import { useNavigate } from "react-router-dom";

/* -------------------------------------------------------------------- */
/*  صفحة: الرئيسية                                                       */
/* -------------------------------------------------------------------- */
function Home({ properties = [], favorites, onToggleFav, onOpen }) {
  usePageTitle("سكني — شريكك العقاري في دمياط الجديدة");
  const heroRef = useRef(null);
  const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const onHeroMove = (e) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setHeroTilt({ x: px * 16, y: py * 12 });
  };

  const services = [
    {
      icon: HelpCircle,
      title: "محتاج اي؟",
      text: "أخبرنا بالعقار الذي تبحث عنه وسنساعدك في الوصول إليه.",
      detail:
        "اضغط هنا لتقديم طلبك، وسيتمكن الأدمن من مراجعته والتواصل معك لإيجاد العقار المناسب.",
      key: "need",
    },
    {
      icon: KeyRound,
      title: "إيجار",
      text: "شقق مفروشة وغير مفروشة للإيجار في أفضل المناطق.",
      detail:
        "اضغط هنا لمشاهدة جميع العقارات المتاحة داخل هذا القسم، وسيتم عرض البيانات التي يضيفها الأدمن مباشرة من قاعدة البيانات.",
      key: "rent",
    },
    {
      icon: ShoppingBag,
      title: "شراء",
      text: "ابحث عن العقار المناسب لك بأفضل الأسعار.",
      detail:
        "اضغط هنا لمشاهدة جميع العقارات المتاحة داخل هذا القسم، وسيتم عرض البيانات التي يضيفها الأدمن مباشرة من قاعدة البيانات.",
      key: "buy",
    },
  ];

  return (
    <div>
      <TopViewedNotice />

      {/* ------------------------------ Hero + Stats ------------------------------ */}
      <div
        ref={heroRef}
        onMouseMove={onHeroMove}
        onMouseLeave={() => setHeroTilt({ x: 0, y: 0 })}
        className="relative w-full min-h-[55vh] sm:min-h-[65vh] flex flex-col overflow-hidden"
      >
        <video
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out"
          style={{ transform: `scale(1.08) translate(${heroTilt.x * 0.6}px, ${heroTilt.y * 0.6}px)`, backgroundColor: "#2B1B12" }}
          src="/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={(e) => { e.target.style.display = "none"; }}
        />
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(43,27,18,0.3) 0%, rgba(43,27,18,0.5) 100%)` }} />
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full blur-3xl opacity-30 animate-blob pointer-events-none" style={{ backgroundColor: COFFEE.gold }} />
        <div className="absolute bottom-0 -left-16 w-72 h-72 rounded-full blur-3xl opacity-20 animate-blob-2 pointer-events-none" style={{ backgroundColor: COFFEE.cream }} />

        {/* Hero Content */}
        <div
          className="relative flex-1 flex flex-col items-center justify-center text-center px-4 transition-transform duration-200 ease-out pb-20"
          style={{ transform: `translate(${heroTilt.x * 0.3}px, ${heroTilt.y * 0.3}px)` }}
          dir="rtl"
        >
          <span className="animate-heroFade text-[11px] sm:text-xs tracking-[0.3em] font-bold mb-2" style={{ color: COFFEE.gold }}>سكني</span>
          <h1 className="animate-heroFade-1 text-2xl sm:text-4xl font-extrabold mb-3 max-w-3xl leading-tight" style={{ color: COFFEE.creamSoft }}>
            بيتك القادم يبدأ من هنا
          </h1>
          <div className="animate-heroFade-2 mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-dashed" style={{ borderColor: COFFEE.gold, backgroundColor: "rgba(176,141,87,0.50)" }}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-extrabold" style={{ color: COFFEE.gold }}>عمولة 35% فقط</span>
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full text-white bg-red-500">جديد</span>
          </div>
          <p className="animate-heroFade-2 text-xs sm:text-base max-w-xl mb-5 leading-relaxed" style={{ color: COFFEE.cream }}>
            نقدم لك أفضل فرص البيع والشراء والإيجار في دمياط ودمياط الجديدة، بثقة وخبرة تمتد لسنوات.
          </p>
          <div className="animate-heroFade-3 flex flex-wrap gap-2.5 justify-center mb-6">
            <button onClick={() => navigate("/rent")} className="btn-shimmer px-5 py-2.5 rounded-full font-bold text-sm hover:scale-105 hover:shadow-xl transition-transform duration-300" style={{ backgroundColor: COFFEE.gold, color: COFFEE.darkest }}>تصفح شقق الإيجار</button>
            <button onClick={() => navigate("/need")} className="btn-shimmer px-5 py-2.5 rounded-full font-bold text-sm border-2 hover:scale-105 hover:bg-white/10 transition-all duration-300" style={{ borderColor: COFFEE.cream, color: COFFEE.cream }}>محتاج مساعدة؟</button>
          </div>
        </div>

        {/* Stats at the bottom of the hero, full width */}
          <div className="w-full max-w-12xl mx-auto rounded-3xl border border-white/10 p-6 sm:p-10 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.45)" }}>
            <div className="grid grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
              {[
                { icon: Building2, value: 3, suffix: "+", label: "عقار تم بيعه", color: "#10B981" },
                { icon: Users, value: 3, suffix: "+", label: "عميل سعيد", color: "#3B82F6" },
                { icon: MapPin, value: 1, suffix: "", label: "مدينة نخدمها", color: "#F59E0B" },
                { icon: Award, value: 1, suffix: "+", label: "سنوات خبرة", color: "#EF4444" },
                { icon: Tag, value: 5, suffix: "+", label: "عرض متاح", color: "#8B5CF6" },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <Reveal key={i} delay={i * 120} className={`flex flex-col items-center text-center ${i >= 3 ? "hidden sm:flex" : ""}`}>
                    <div className="relative group">
                      <div
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-3 sm:mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 shadow-lg border border-white/10"
                        style={{
                          background: `linear-gradient(135deg, ${stat.color}30, ${stat.color}50)`,
                        }}
                      >
                        <Icon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: stat.color }} />
                      </div>

                     
                    </div>

                    <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-1 sm:mb-2 drop-shadow-2xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                      <CountUp value={stat.value} />{stat.suffix}
                    </p>

                    <p className="text-xs sm:text-sm font-semibold text-white/95 leading-relaxed px-2 drop-shadow-lg" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                      {stat.label}
                    </p>

                    <div className="w-8 h-0.5 rounded-full mt-2 opacity-60" style={{ backgroundColor: stat.color }} />
                  </Reveal>
                );
              })}
              </div>
            </div>
          </div>

      {/* --------------------------- خدماتنا -------------------------- */}
      <section className="py-10 sm:py-14 px-4 sm:px-6" style={{ backgroundColor: COFFEE.creamSoft }} dir="rtl">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: COFFEE.dark }}>
                خدماتنا
              </h2>
              <p className="text-sm max-w-lg mx-auto" style={{ color: "#888" }}>
                نوفر لك كل ما تحتاجه في رحلتك العقارية
              </p>
            </div>
          </Reveal>
          <div className="flex flex-col gap-6">
            {services.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.key} delay={index * 150}>
                  <div
                    onClick={() => navigate(`/${item.key}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") navigate(`/${item.key}`);
                    }}
                    className="group relative cursor-pointer overflow-hidden w-full max-w-[720px] mx-auto rounded-[20px] bg-white px-6 sm:px-8 py-6 shadow-md border text-center hover:-translate-y-2 hover:shadow-[0_20px_45px_rgba(0,0,0,.12)] transition-all duration-500 ease-out"
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(176,141,87,.07), transparent)" }} />
                    <div className="relative flex flex-col items-center text-center">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" style={{ backgroundColor: COFFEE.gold }}>
                        <Icon className="w-6 h-6" style={{ color: COFFEE.darkest }} />
                      </div>
                      <h3 className="text-lg sm:text-2xl font-extrabold mb-1.5" style={{ color: COFFEE.dark }}>{item.title}</h3>
                      <div className="mb-3 h-[3px] w-12 rounded-full" style={{ background: COFFEE.gold }} />
                      <p className="text-sm sm:text-base leading-6 font-semibold" style={{ color: "#454545" }}>{item.text}</p>
                      <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-out w-full">
                        <div className="overflow-hidden">
                          <p className="text-xs sm:text-sm leading-6 mt-3 pt-3 font-semibold border-t" style={{ color: COFFEE.mid, borderColor: "#f0e8da" }}>{item.detail}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* --------------------------- أفضل العقارات -------------------------- */}
      <BestPropertiesSection favorites={favorites} onToggleFav={onToggleFav} />
      {/* ----------------------------- من نحن ------------------------------ */}
      <section className="py-10 sm:py-14 px-4 sm:px-6" style={{ backgroundColor: COFFEE.creamSoft }} dir="rtl">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="rounded-[22px] p-6 sm:p-10 shadow-xl border" style={{ background: "#fff", borderColor: "#efe6d7" }}>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 animate-float" style={{ backgroundColor: COFFEE.gold }}>
                  <Building2 className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: COFFEE.darkest }} />
                </div>
                <span className="text-[11px] sm:text-xs font-bold tracking-[0.3em]" style={{ color: COFFEE.gold }}>سكني</span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mt-3 mb-4 leading-tight" style={{ color: COFFEE.dark }}>شريكك العقاري في دمياط الجديدة</h2>
                <p className="text-sm sm:text-base leading-relaxed max-w-2xl font-semibold mb-5" style={{ color: "#3f3f3f" }}>
                  في سكني هدفنا نبسط رحلة البحث عن العقار. بنوفر لك شقق ووحدات للبيع والإيجار في دمياط الجديدة،
                  مع معلومات واضحة، وصور حقيقية، ومتابعة مستمرة لحد إتمام الاتفاق.
                </p>
                <div className="w-full max-w-2xl mb-6">
                  <h3 className="text-lg sm:text-xl font-bold mb-3" style={{ color: COFFEE.dark }}>لماذا سكني؟</h3>
                  <ul className="text-sm sm:text-base leading-loose text-right space-y-1" style={{ color: "#3f3f3f" }}>
                    <li>✅ عمولة أقل من نصف شهر.</li>
                    <li>✅ عقارات متنوعة ومحدثة باستمرار.</li>
                    <li>✅ توفير الوقت والمجهود بدل اللف والسؤال.</li>
                    <li>✅ شفافية ومصداقية في كل خطوة.</li>
                    <li>✅ متابعة معاك قبل وبعد الاتفاق.</li>
                  </ul>
                </div>
                <p className="text-sm sm:text-base leading-relaxed max-w-2xl font-semibold mb-6" style={{ color: "#3f3f3f" }}>
                  رؤيتنا إن سكني تكون الوجهة الأولى لأي شخص بيدور على عقار في دمياط الجديدة،
                  من خلال تقديم خدمة احترافية، سهلة، وموثوقة.
                </p>
                <a
                  href="https://wa.me/201067725976"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm sm:text-base font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ backgroundColor: "#25D366", color: "#fff" }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  تواصل معنا واتساب
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

export default Home;
