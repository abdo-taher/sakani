import React, { useEffect, useState } from "react";
import { Flame, ArrowLeft } from "lucide-react";
import { COFFEE } from "../constants/constants";
import { getBestProperties } from "../services/propertyService";
import PropertyShowcaseCard from "./PropertyShowcaseCard";
import Reveal from "./Reveal";

function BestPropertiesSection({ favorites, onToggleFav }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getBestProperties();
        setProperties(data);
      } catch (err) {
        console.error("Failed to load best properties", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || properties.length === 0) return null;

  return (
    <section className="py-10 sm:py-14 px-4 sm:px-6" style={{ backgroundColor: COFFEE.creamSoft }} dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <Reveal>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: "rgba(176,141,87,0.12)" }}>
              <Flame className="w-4 h-4" style={{ color: COFFEE.gold }} />
              <span className="text-xs font-extrabold tracking-wider" style={{ color: COFFEE.gold }}>العقارات المميزة</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: COFFEE.dark }}>
              أفضل العقارات المتاحة
            </h2>
            <p className="text-sm max-w-lg mx-auto" style={{ color: "#888" }}>
              اخترنا لك أفضل العقارات بناءً على التقييمات والمشاهدات
            </p>
          </div>
        </Reveal>

        {/* Category filter pills */}
        <Reveal delay={100}>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[
              { label: "الكل", value: "all", icon: "🔥" },
              { label: "إيجار", value: "rent", icon: "🏠" },
              { label: "شراء", value: "buy", icon: "🛒" },
              { label: "بيع", value: "sell", icon: "🏷️" },
            ].map((cat) => (
              <span
                key={cat.value}
                className="px-4 py-2 rounded-full text-xs font-bold cursor-default"
                style={{
                  backgroundColor: cat.value === "all" ? COFFEE.gold : "white",
                  color: cat.value === "all" ? "white" : COFFEE.dark,
                  border: `1.5px solid ${cat.value === "all" ? COFFEE.gold : "#e8e0d4"}`,
                }}
              >
                {cat.icon} {cat.label}
              </span>
            ))}
          </div>
        </Reveal>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {properties.map((p, i) => (
            <Reveal key={p.id} delay={i * 80}>
              <PropertyShowcaseCard
                p={p}
                isFav={favorites?.has?.(p.id) || false}
                onToggleFav={onToggleFav}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default BestPropertiesSection;
