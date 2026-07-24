import React, { useEffect, useState, useRef } from "react";
import { Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { COFFEE } from "../constants/constants";
import { getBestProperties } from "../services/propertyService";
import PropertyShowcaseCard from "./PropertyShowcaseCard";
import Reveal from "./Reveal";

function BestPropertiesSection({ favorites, onToggleFav }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [filteredProperties, setFilteredProperties] = useState([]);
  const scrollContainerRef = useRef(null);

  const PROPERTIES_LIMIT = 8; // Maximum number of properties to show per category

  const categories = [
    { label: "الكل", value: "all", icon: "🔥" },
    { label: "إيجار", value: "rent", icon: "🏠" },
    { label: "شراء", value: "buy", icon: "🛒" },
    { label: "بيع", value: "sell", icon: "🏷️" },
  ];

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

  useEffect(() => {
    let filtered = properties || [];
    if (activeFilter !== "all") {
      filtered = filtered.filter(p => p?.category?.slug === activeFilter);
    }
    // Limit the number of properties shown
    setFilteredProperties(filtered.slice(0, PROPERTIES_LIMIT));
  }, [properties, activeFilter]);

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
  };

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
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveFilter(cat.value)}
                className="px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: cat.value === activeFilter ? COFFEE.gold : "white",
                  color: cat.value === activeFilter ? "white" : COFFEE.dark,
                  border: `1.5px solid ${cat.value === activeFilter ? COFFEE.gold : "#e8e0d4"}`,
                }}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Properties Slider */}
        <div className="relative">
          {/* Scroll buttons */}
          {filteredProperties.length > 4 && (
            <>
              <button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
                style={{ color: COFFEE.gold }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
                style={{ color: COFFEE.gold }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Properties container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-5 overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredProperties.map((p, i) => (
              <div key={p.id} className="flex-shrink-0 w-72">
                <Reveal delay={i * 80}>
                  <PropertyShowcaseCard
                    p={p}
                    isFav={favorites?.has?.(p.id) || false}
                    onToggleFav={onToggleFav}
                  />
                </Reveal>
              </div>
            ))}
          </div>

          {filteredProperties.length === 0 && (
            <div className="text-center py-8">
              <p className="text-lg font-bold" style={{ color: COFFEE.stone }}>
                لا توجد عقارات في هذا القسم حالياً
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default BestPropertiesSection;
