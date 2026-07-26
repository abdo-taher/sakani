import React, { useEffect, useState, useRef } from "react";
import { Link2, ChevronLeft, ChevronRight } from "lucide-react";
import { COFFEE } from "../constants/constants";
import { getRelatedProperties } from "../services/propertyService";
import PropertyShowcaseCard from "./PropertyShowcaseCard";
import Reveal from "./Reveal";

function RelatedPropertiesSection({ propertyId, favorites, onToggleFav }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (!propertyId) return;
    const load = async () => {
      try {
        const data = await getRelatedProperties(propertyId);
        setProperties(data);
      } catch (err) {
        console.error("Failed to load related properties", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [propertyId]);

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 320, behavior: 'smooth' });
  };

  if (loading || properties.length === 0) return null;

  return (
    <section className="py-8 px-4 sm:px-6 max-w-6xl mx-auto" dir="rtl">
      <Reveal>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(176,141,87,0.12)" }}>
            <Link2 className="w-5 h-5" style={{ color: COFFEE.gold }} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold" style={{ color: COFFEE.dark }}>
              عقارات مشابهة
            </h2>
            <p className="text-xs" style={{ color: "#999" }}>
              عقارات بنفس المنطقة أو الفئة أو الميزانية
            </p>
          </div>
        </div>
      </Reveal>

      {/* Properties Slider */}
      <div className="relative">
        {/* Scroll buttons */}
        {properties.length > 4 && (
          <>
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
              style={{ color: COFFEE.gold }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
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
          {properties.map((p, i) => (
            <div key={p.id} className="flex-shrink-0 w-72">
              <Reveal delay={i * 80}>
                <PropertyShowcaseCard
                  p={p}
                  isFav={favorites?.has?.(p.id) || false}
                  onToggleFav={onToggleFav}
                  showBadge={true}
                />
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default RelatedPropertiesSection;
