import React from "react";
import usePageTitle from "../hooks/usePageTitle";
import {
  Tag,
  ShoppingBag,
  KeyRound,
  ChevronLeft,
} from "lucide-react";

import Reveal from "../components/Reveal";

import { COFFEE } from "../constants/constants";
import { useNavigate } from "react-router-dom";

function Need() {
  usePageTitle("محتاج اي؟ — سكني");
  const navigate = useNavigate();
  const options = [
    {
      key: "buy",
      label: "عايز تشتري",
      icon: ShoppingBag,
      text: "قدّم طلب شراء بالمواصفات اللي محتاجها",
      link: "/buy-request",
    },
    {
      key: "rent",
      label: "عايز تأجر",
      icon: KeyRound,
      text: "قدّم طلب إيجار بالمواصفات اللي تناسبك",
      link: "/rent-request",
    },
  ];
  return (
    <div
      className="relative min-h-[85vh] flex items-center justify-center py-20 px-4 sm:px-6 overflow-hidden"
      style={{ backgroundColor: COFFEE.creamSoft }}
      dir="rtl"
    >
      <div
        className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: COFFEE.gold }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: COFFEE.gold }}
      />

      <div className="relative max-w-4xl mx-auto text-center w-full">
        <span
          className="animate-heroFade-1 inline-block text-xs font-bold tracking-wider px-4 py-1.5 rounded-full mb-5"
          style={{ backgroundColor: `${COFFEE.gold}22`, color: COFFEE.dark }}
        >
          خدماتنا
        </span>
        <h1 className="animate-heroFade-1 text-2xl sm:text-4xl font-extrabold mb-4 leading-snug" style={{ color: COFFEE.dark }}>
          محتاج مساعدة؟ قولنا محتاج إيه بالظبط
        </h1>
        <p className="animate-heroFade-2 text-stone-500 mb-14 text-sm sm:text-base">
          اختر الخدمة اللي تناسبك وهنوجهك للصفحة الصح على طول
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-2xl mx-auto">
          {options.map((o, i) => {
            const Icon = o.icon;
            return (
              <Reveal
                key={o.key}
                delay={i * 120}
                as="button"
                onClick={() => navigate(o.link)}
                className="group flex flex-col items-center rounded-2xl bg-white p-8 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all border w-full text-center h-full"
                style={{ borderColor: "#EADFD0" }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-12 transition-transform animate-float"
                  style={{ backgroundColor: COFFEE.gold }}
                >
                  <Icon className="w-7 h-7" style={{ color: COFFEE.darkest }} />
                </div>
                <h3 className="font-extrabold text-lg mb-2" style={{ color: COFFEE.dark }}>{o.label}</h3>
                <p className="text-sm text-stone-500 mb-5 leading-relaxed flex-1">{o.text}</p>
                <span className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: COFFEE.gold }}>
                  اذهب الآن <ChevronLeft className="w-4 h-4" />
                </span>
              </Reveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Need;
