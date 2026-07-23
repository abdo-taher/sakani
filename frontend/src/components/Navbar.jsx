import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  Home as HomeIcon,
  Tag,
  ShoppingBag,
  KeyRound,
  HelpCircle,
  Phone,
  ShieldCheck,
  Heart,
  Building2,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { COFFEE } from "../constants/constants";

/* -------------------------------------------------------------------- */
/*  مكون: بار التنقل                                                     */
/* -------------------------------------------------------------------- */
function Navbar({ isAdmin, favoritesCount = 0, onOpenFavorites }) {
  const [scrolled, setScrolled] = useState(false);
  const [pulseHeart, setPulseHeart] = useState(false);
  const navigate = useNavigate();
const location = useLocation();

const page =
  location.pathname === "/"
    ? "home"
    : location.pathname.replace("/", "");
  const prevFav = useRef(favoritesCount);
  
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (favoritesCount > prevFav.current) {
      setPulseHeart(true);
      const t = setTimeout(() => setPulseHeart(false), 500);
      return () => clearTimeout(t);
    }
    prevFav.current = favoritesCount;
  }, [favoritesCount]);

  const items = [
 {
  key: "home",
  path: "/",
  label: "الرئيسية",
  icon: HomeIcon,
},
{
  key: "need",
  path: "/need",
  label: "محتاج اي؟",
  icon: HelpCircle,
},
{
  key: "rent",
  path: "/rent",
  label: "إيجار",
  icon: KeyRound,
},
{
  key: "buy",
  path: "/buy",
  label: "شراء",
  icon: ShoppingBag,
},

{
  key: "contact",
  path: "/contact",
  label: "تواصل معنا",
  icon: Phone,
},
];
  const navRef = useRef(null);
  const btnRefs = useRef({});
  const [pill, setPill] = useState({ left: 0, width: 0, top: 0, height: 0, ready: false });

  const measurePill = () => {
    const activeBtn = btnRefs.current[page];
    const nav = navRef.current;
    if (activeBtn && nav) {
      const navBox = nav.getBoundingClientRect();
      const btnBox = activeBtn.getBoundingClientRect();
      setPill({
        left: btnBox.left - navBox.left,
        width: btnBox.width,
        top: btnBox.top - navBox.top,
        height: btnBox.height,
        ready: true,
      });
    }
  };

  useLayoutEffect(() => {
    measurePill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, scrolled]);

  useEffect(() => {
    window.addEventListener("resize", measurePill);
    return () => window.removeEventListener("resize", measurePill);
  }, []);

  const mobileRefs = useRef({});
  useEffect(() => {
    const el = mobileRefs.current[page];
    if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [page]);

  return (
    <header
      className={`w-full sticky top-0 z-50 transition-all duration-300 ${scrolled ? "shadow-xl backdrop-blur-md" : "shadow-md"}`}
      style={{ backgroundColor: scrolled ? `${COFFEE.darkest}f2` : COFFEE.darkest }}
    >
      <div className="relative h-[2px] w-full overflow-hidden">
        <div
          className="absolute inset-0 animate-shimmerLine"
          style={{
            background: `linear-gradient(90deg, transparent, ${COFFEE.gold}, transparent)`,
            width: "40%",
          }}
        />
      </div>

      <div
        className="max-w-7xl mx-auto px-6 sm:px-10 flex items-center justify-between transition-all duration-300 gap-6"
        style={{ height: scrolled ? "68px" : "84px" }}
        dir="rtl"
      >
        {/* اللوجو */}
        <button onClick={() => navigate("/")} className="flex items-center gap-3 shrink-0 group">
          <div
            className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center group-hover:rotate-[20deg] transition-transform duration-300 animate-float"
            style={{ backgroundColor: COFFEE.gold }}
          >
            <span className="absolute inset-0 rounded-full animate-haloPulse" />
            <Building2 className="w-5 h-5 sm:w-[22px] sm:h-[22px] relative z-10" style={{ color: COFFEE.darkest }} />
          </div>
          <span
            className="text-lg sm:text-2xl font-bold tracking-wide transition-all duration-300 group-hover:tracking-wider"
            style={{ color: COFFEE.cream }}
          >
            سكني
          </span>
        </button>

        {/* روابط سطح المكتب */}
       <nav ref={navRef} className="hidden md:flex items-center gap-4 lg:gap-5 relative flex-1 justify-center">
          <div
            className="absolute rounded-full transition-all duration-500 ease-[cubic-bezier(.65,.05,.36,1)]"
            style={{
              left: pill.left,
              top: pill.top,
              width: pill.width,
              height: pill.height,
              backgroundColor: COFFEE.gold,
              opacity: pill.ready ? 1 : 0,
              boxShadow: `0 2px 12px ${COFFEE.gold}66`,
            }}
          />
          {items.map((it) => {
            const Icon = it.icon;
            const active = page === it.key;
            return (
              <button
                key={it.key}
                ref={(el) => (btnRefs.current[it.key] = el)}
                onClick={() => navigate(it.path)}
                className="relative z-10 flex items-center gap-2 px-6 lg:px-7 py-3 rounded-full text-base lg:text-lg font-semibold transition-all duration-300 hover:scale-105 group/item whitespace-nowrap"
                style={{ color: active ? COFFEE.darkest : COFFEE.cream }}
              >
                <Icon
                 className={`w-5 h-5 transition-transform duration-300 ${active ? "scale-110" : "group-hover/item:-translate-y-0.5"}`}
                />
                {it.label}
                {!active && (
                  <span
                    className="absolute bottom-1 right-1/2 translate-x-1/2 h-[2px] w-0 group-hover/item:w-[60%] transition-all duration-300 rounded-full"
                    style={{ backgroundColor: COFFEE.gold }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* المفضلة + الأدمن */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <button
            onClick={onOpenFavorites}
            className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 hover:scale-110 active:scale-95 transition-transform"
            style={{ borderColor: COFFEE.gold }}
            title="المفضلة"
          >
            <Heart
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${pulseHeart ? "scale-125" : ""}`}
              style={{ color: COFFEE.gold, fill: favoritesCount > 0 ? COFFEE.gold : "transparent" }}
            />
            {pulseHeart && (
              <span className="absolute inset-0 rounded-full animate-ping" style={{ border: `2px solid ${COFFEE.gold}` }} />
            )}
            {favoritesCount > 0 && (
              <span
                key={favoritesCount}
                className="animate-fadePop absolute -top-1.5 -left-1.5 min-w-[19px] h-[19px] px-1 rounded-full text-[10px] font-extrabold flex items-center justify-center"
                style={{ backgroundColor: COFFEE.gold, color: COFFEE.darkest }}
              >
                {favoritesCount}
              </span>
            )}
          </button>
          {isAdmin && (
            <button
             onClick={() => navigate("/dashboard")}
              className="btn-shimmer flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold border-2 hover:scale-105 active:scale-95 transition-transform whitespace-nowrap"
              style={{ borderColor: COFFEE.gold, color: COFFEE.gold }}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">لوحة التحكم</span>
            </button>
          )}
        </div>
      </div>

      {/* موبايل */}
      <div className="md:hidden flex overflow-x-auto gap-2 px-4 pb-3 scrollbar-hide" dir="rtl">
        {items.map((it) => {
          const Icon = it.icon;
          const active = page === it.key;
          return (
            <button
              key={it.key}
              ref={(el) => (mobileRefs.current[it.key] = el)}
              onClick={() => navigate(it.path)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all duration-300 ${active ? "scale-105" : "active:scale-95"}`}
              style={{
                backgroundColor: active ? COFFEE.gold : "transparent",
                color: active ? COFFEE.darkest : COFFEE.cream,
                border: `1px solid ${COFFEE.gold}`,
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {it.label}
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes shimmerLine {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(350%); }
        }
        .animate-shimmerLine { animation: shimmerLine 3.5s ease-in-out infinite; }
        @keyframes haloPulse {
          0% { box-shadow: 0 0 0 0 ${COFFEE.gold}66; }
          70% { box-shadow: 0 0 0 8px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
        .animate-haloPulse { animation: haloPulse 2.4s ease-out infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </header>
  );
}

export default Navbar;