import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { COFFEE } from "../constants/constants";
import PropertyShowcaseCard from "./PropertyShowcaseCard";
import Reveal from "./Reveal";

function PropertySlider({ properties, favorites, onToggleFav, limit = 5 }) {
  const scrollContainerRef = useRef(null);
  
  // Limit properties to specified number
  const limitedProperties = properties.slice(0, limit);

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 320, behavior: 'smooth' });
  };

  if (limitedProperties.length === 0) return null;

  return (
    <div className="relative">
      {/* Navigation buttons - only show if more than 1 property */}
      {limitedProperties.length > 1 && (
        <>
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
            style={{ color: COFFEE.gold }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
            style={{ color: COFFEE.gold }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Single column horizontal scrolling container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 px-12"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {limitedProperties.map((p, i) => (
          <div key={p.id} className="flex-shrink-0 w-80">
            <Reveal delay={i * 100}>
              <PropertyShowcaseCard
                p={p}
                isFav={favorites?.has?.(p.id) || false}
                onToggleFav={onToggleFav}
              />
            </Reveal>
          </div>
        ))}
      </div>

      {/* Property count indicator */}
      <div className="text-center mt-4">
        <p className="text-sm" style={{ color: COFFEE.stone }}>
          عرض {limitedProperties.length} من {properties.length} عقار
        </p>
      </div>
    </div>
  );
}

export default PropertySlider;