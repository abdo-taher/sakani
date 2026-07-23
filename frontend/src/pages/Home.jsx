import React, { useRef, useState } from "react";

import {
  Building2,
  Users,
  MapPin,
  Award,
  Tag,
  ShoppingBag,
  KeyRound,
  HelpCircle,
  ChevronLeft,
  Quote,
  Star,
} from "lucide-react";

import Reveal from "../components/Reveal";
import CountUp from "../components/CountUp";
import PropertyCard from "../components/PropertyCard";

import { COFFEE } from "../constants/constants";
import { useNavigate } from "react-router-dom";

/* -------------------------------------------------------------------- */
/*  صفحة: الرئيسية                                                       */
/* -------------------------------------------------------------------- */
function Home({ properties = [], favorites, onToggleFav, onOpen }) {
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

  const featured = [];
  const testimonials = [];

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
      {/* ------------------------------ Hero ------------------------------ */}
      <div
        ref={heroRef}
        onMouseMove={onHeroMove}
        onMouseLeave={() => setHeroTilt({ x: 0, y: 0 })}
        className="relative w-full h-[46vh] sm:h-[58vh] overflow-hidden"
      >
        <video
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out"
          style={{ transform: `scale(1.08) translate(${heroTilt.x * 0.6}px, ${heroTilt.y * 0.6}px)` }}
          src="/12287315_3840_2160_25fps.mp4"
          poster="https://picsum.photos/seed/herohouse/1600/900"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(43,27,18,0.35) 0%, rgba(43,27,18,0.75) 100%)` }} />
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full blur-3xl opacity-30 animate-blob pointer-events-none" style={{ backgroundColor: COFFEE.gold }} />
        <div className="absolute bottom-0 -left-16 w-72 h-72 rounded-full blur-3xl opacity-20 animate-blob-2 pointer-events-none" style={{ backgroundColor: COFFEE.cream }} />

        <div
          className="relative h-full flex flex-col items-center justify-center text-center px-4 transition-transform duration-200 ease-out"
          style={{ transform: `translate(${heroTilt.x * 0.3}px, ${heroTilt.y * 0.3}px)` }}
          dir="rtl"
        >
          <span className="animate-heroFade text-[11px] sm:text-xs tracking-[0.3em] font-bold mb-2" style={{ color: COFFEE.gold }}>سكني</span>
          <h1 className="animate-heroFade-1 text-2xl sm:text-4xl font-extrabold mb-3 max-w-3xl leading-tight" style={{ color: COFFEE.creamSoft }}>
            بيتك القادم يبدأ من هنا
          </h1>
          <p className="animate-heroFade-2 text-xs sm:text-base max-w-xl mb-5 leading-relaxed" style={{ color: COFFEE.cream }}>
            نقدم لك أفضل فرص البيع والشراء والإيجار في دمياط ودمياط الجديدة، بثقة وخبرة تمتد لسنوات.
          </p>
          <div className="animate-heroFade-3 flex flex-wrap gap-2.5 justify-center mb-6">
            <button onClick={() => navigate("/sell")} className="btn-shimmer px-5 py-2.5 rounded-full font-bold text-sm hover:scale-105 hover:shadow-xl transition-transform duration-300" style={{ backgroundColor: COFFEE.gold, color: COFFEE.darkest }}>تصفح شقق البيع</button>
            <button onClick={() => navigate("/need")} className="btn-shimmer px-5 py-2.5 rounded-full font-bold text-sm border-2 hover:scale-105 hover:bg-white/10 transition-all duration-300" style={{ borderColor: COFFEE.cream, color: COFFEE.cream }}>محتاج مساعدة؟</button>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-scrollHint pointer-events-none">
          <span className="w-5 h-8 rounded-full border-2 flex justify-center pt-1.5" style={{ borderColor: COFFEE.cream }}>
            <span className="w-1 h-1.5 rounded-full animate-scrollDot" style={{ backgroundColor: COFFEE.gold }} />
          </span>
        </div>
      </div>

      {/* ---------------------------- إحصائيات ----------------------------- */}
      <section className="py-8 px-4 sm:px-6" style={{ backgroundColor: COFFEE.darkest }} dir="rtl">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { icon: Building2, value: 250, suffix: "+", label: "عقار تم بيعه" },
            { icon: Users, value: 1200, suffix: "+", label: "عميل سعيد" },
            { icon: MapPin, value: 2, suffix: "", label: "مدينة نخدمها" },
            { icon: Award, value: 8, suffix: "+", label: "سنوات خبرة" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={i} delay={i * 110} className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full flex items-center justify-center mb-2 animate-float" style={{ backgroundColor: "rgba(176,141,87,0.15)" }}>
                  <Icon className="w-4 h-4" style={{ color: COFFEE.gold }} />
                </div>
                <p className="text-lg sm:text-2xl font-extrabold" style={{ color: COFFEE.creamSoft }}>
                  <CountUp value={s.value} />{s.suffix}
                </p>
                <p className="text-[11px] sm:text-xs mt-1" style={{ color: COFFEE.cream }}>{s.label}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ----------------------------- من نحن ------------------------------ */}
      <section className="py-10 sm:py-14 px-4 sm:px-6" style={{ backgroundColor: COFFEE.creamSoft }} dir="rtl">
<div
  className="w-full mt-8 mx-auto"
  style={{ maxWidth: "1200px" }}
>
  <Reveal>
            <div
              className="rounded-[22px] p-6 sm:p-10 shadow-xl border"
              style={{ background: "#fff", borderColor: "#efe6d7" }}
            >
              <div className="flex flex-col items-center text-center">

                <div
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 animate-float"
                  style={{ backgroundColor: COFFEE.gold }}
                >
                  <Building2 className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: COFFEE.darkest }} />
                </div>

                <span className="text-[11px] sm:text-xs font-bold tracking-[0.3em]" style={{ color: COFFEE.gold }}>
                  من نحن
                </span>

                <h2
                  className="text-2xl sm:text-3xl md:text-4xl font-extrabold mt-3 mb-4 leading-tight"
                  style={{ color: COFFEE.dark }}
                >
                  شريكك العقاري الموثوق في دمياط
                </h2>

                <p
                  className="text-sm sm:text-base leading-relaxed max-w-2xl font-semibold"
                  style={{ color: "#3f3f3f" }}
                >
                  نحن شركة عقارية متخصصة في البيع والشراء والإيجار داخل دمياط
                  ودمياط الجديدة، هدفنا هو توفير تجربة احترافية وآمنة لكل عميل،
                  بداية من البحث عن العقار وحتى إتمام التعاقد، مع متابعة كاملة
                  وشفافية في جميع المراحل.
                </p>

              </div>
            </div>
          </Reveal>
<div className="h-8"></div>

          {/* --------------------------- خدماتنا -------------------------- */}
<div
  className="flex flex-col gap-6 mt-8"
  style={{
    alignItems: "center",
    paddingBottom: "40px",
  }}
>            {services.map((item, index) => {
              const Icon = item.icon;

              return (
<Reveal
  key={item.key}
  delay={index * 150}
  style={{
    width: "100%",
    display: "flex",
    justifyContent: "center",
  }}
>
                  <div
                   onClick={() => navigate(`/${item.key}`)}
                    role="button"
                    tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      navigate(`/${item.key}`);
                    }
                  }}
                 className="group relative cursor-pointer overflow-hidden
                      w-full
                      max-w-[720px]
                      rounded-[20px]
                      bg-white
                      px-6
                      sm:px-8
                      py-6
                      shadow-md
                      border
                      text-center
                      hover:-translate-y-2
                      hover:shadow-[0_20px_45px_rgba(0,0,0,.12)]
                      transition-all
                      duration-500
                      ease-out" >

                                          {/* خلفية متدرجة عند الهوفر */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: "linear-gradient(135deg, rgba(176,141,87,.07), transparent)" }}
                    />

                    <div className="relative flex flex-col items-center text-center">
                      <div
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300"
                        style={{ backgroundColor: COFFEE.gold }}
                      >
                        <Icon className="w-6 h-6" style={{ color: COFFEE.darkest }} />
                      </div>

                      <h3 className="text-lg sm:text-2xl font-extrabold mb-1.5" style={{ color: COFFEE.dark }}>
                        {item.title}
                      </h3>

                      <div className="mb-3 h-[3px] w-12 rounded-full" style={{ background: COFFEE.gold }} />

                      <p className="text-sm sm:text-base leading-6 font-semibold" style={{ color: "#454545" }}>
                        {item.text}
                      </p>

                      <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-out w-full">
                        <div className="overflow-hidden">
                          <p className="text-xs sm:text-sm leading-6 mt-3 pt-3 font-semibold border-t" style={{ color: COFFEE.mid, borderColor: "#f0e8da" }}>
                            {item.detail}
                          </p>
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
    </div>
  );
}

export default Home;