import React, { useState } from "react";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { COFFEE } from "../constants/constants";
import PropertyShowcaseCard from "./PropertyShowcaseCard";

const INITIAL_SHOW = 4;

function PropertySectionByLocation({
  location: locationProp,
  properties,
  favorites,
  onToggleFav,
  onOpen,
}) {
  const [expanded, setExpanded] = useState(false);

  const grouped = locationProp
    ? { [locationProp]: properties }
    : properties.reduce((acc, property) => {
        const loc = property.location?.name || "أماكن أخرى";
        if (!acc[loc]) acc[loc] = [];
        acc[loc].push(property);
        return acc;
      }, {});

  const locationEntries = Object.entries(grouped);
  const showMore = properties.length > INITIAL_SHOW;
  const visibleProperties = expanded ? properties : properties.slice(0, INITIAL_SHOW);

  return (
    <div className="space-y-6">
      {locationEntries.map(([locName, locProperties]) => {
        const locationObj = locProperties[0]?.location;
        const locationImage = locationObj?.image_url;

        return (
          <div
            key={locName}
            className="rounded-2xl sm:rounded-3xl border overflow-hidden"
            style={{ borderColor: "#f0ebe4" }}
          >
            {/* Location Header */}
            <div
              className="flex items-center gap-3 sm:gap-4 px-4 py-3.5 sm:px-6 sm:py-5 cursor-pointer select-none transition-colors hover:bg-stone-50"
              onClick={() => setExpanded(!expanded)}
            >
              {locationImage ? (
                <img
                  src={locationImage}
                  alt={locName}
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0"
                />
              ) : (
                <div
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: COFFEE.cream }}
                >
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: COFFEE.gold }} />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-xl font-extrabold truncate" style={{ color: COFFEE.dark }}>
                  {locName}
                </h2>
                <p className="text-[10px] sm:text-sm mt-0.5" style={{ color: COFFEE.stone }}>
                  {locProperties.length} عقار متاح
                </p>
              </div>

              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 transition-transform"
                style={{
                  backgroundColor: COFFEE.cream,
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: COFFEE.gold }} />
              </div>
            </div>

            {/* Properties Grid */}
            <div
              className="overflow-hidden transition-all duration-500 ease-in-out"
              style={{
                maxHeight: expanded ? `${locProperties.length * 500}px` : "2400px",
              }}
            >
              <div className="px-3 pb-4 sm:px-6 sm:pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {(expanded ? locProperties : locProperties.slice(0, INITIAL_SHOW)).map((p, i) => (
                  <PropertyShowcaseCard
                    key={p.id}
                    p={p}
                    isFav={favorites?.has?.(p.id) || false}
                    onToggleFav={onToggleFav}
                  />
                ))}
              </div>

              {locProperties.length > INITIAL_SHOW && !expanded && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(true);
                  }}
                  className="w-full py-2.5 sm:py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-t transition-colors hover:bg-stone-50"
                  style={{ color: COFFEE.gold, borderColor: "#f0ebe4" }}
                >
                  عرض جميع العقارات ({locProperties.length})
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}

              {expanded && locProperties.length > INITIAL_SHOW && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(false);
                  }}
                  className="w-full py-2.5 sm:py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-t transition-colors hover:bg-stone-50"
                  style={{ color: COFFEE.gold, borderColor: "#f0ebe4" }}
                >
                  عرض أقل
                  <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PropertySectionByLocation;
