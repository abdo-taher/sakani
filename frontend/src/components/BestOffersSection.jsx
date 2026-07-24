import React, { useEffect, useState } from "react";
import { Tag, ChevronLeft, Eye } from "lucide-react";
import { COFFEE } from "../constants/constants";
import { getBestProperties } from "../services/propertyService";
import PropertyShowcaseCard from "./PropertyShowcaseCard";
import Reveal from "./Reveal";

function BestOffersSection({ favorites, onToggleFav }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getBestProperties();
        setProperties(data.slice(0, 4));
      } catch (err) {
        console.error("Failed to load best offers", err);
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
              <Tag className="w-4 h-4" style={{ color: COFFEE.gold }} />
              <span className="text-xs font-extrabold tracking-wider" style={{ color: COFFEE.gold }}>العروض المميزة</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: COFFEE.dark }}>
              افضل العروض
            </h2>
            <p className="text-sm max-w-lg mx-auto" style={{ color: "#888" }}>
              أحدث العروض المتاحة من قبل مالكي العقارات
            </p>
          </div>
        </Reveal>

        {/* Properties Grid */}
        <Reveal delay={100}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {properties.map((p, i) => (
              <Reveal key={p.id} delay={i * 100}>
                <PropertyShowcaseCard
                  p={p}
                  isFav={favorites?.has?.(p.id) || false}
                  onToggleFav={onToggleFav}
                />
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* View All Button */}
        <Reveal delay={200}>
          <div className="text-center mt-8">
            <a
              href="/sell"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm hover:scale-105 transition-all duration-300"
              style={{ backgroundColor: COFFEE.gold, color: COFFEE.darkest }}
            >
              <span>عرض جميع العروض</span>
              <ChevronLeft className="w-4 h-4" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default BestOffersSection;
