import React, { useState } from "react";
import { MapPin, ChevronLeft, ArrowRight } from "lucide-react";
import PropertyGrid from "./PropertyGrid";
import { COFFEE } from "../constants/constants";

function PropertySectionByLocation({
  properties,
  favorites,
  onToggleFav,
  onOpen,
}) {
  const [selectedLocation, setSelectedLocation] = useState(null);

  const grouped = properties.reduce((acc, property) => {
    const location = property.location?.name || "أماكن أخرى";

    if (!acc[location]) {
      acc[location] = [];
    }

    acc[location].push(property);

    return acc;
  }, {});

  // ✅ لو مفيش منطقة متفتحة، اعرض الكاردز المقفولة بس
  if (!selectedLocation) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(grouped).map(([location, list]) => (
          <button
            key={location}
            onClick={() => setSelectedLocation(location)}
            className="text-right bg-white rounded-3xl border shadow-sm hover:shadow-lg transition p-8 flex flex-col items-start gap-4"
            style={{ borderColor: "#eee" }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: COFFEE.gold }}
            >
              <MapPin className="w-6 h-6" style={{ color: COFFEE.darkest }} />
            </div>

            <div>
              <h3
                className="text-xl font-extrabold"
                style={{ color: COFFEE.dark }}
              >
                {location}
              </h3>
              <p className="mt-2 text-gray-500">
                {list.length} عقار متاح
              </p>
            </div>

            <span
              className="flex items-center gap-1 font-bold mt-2"
              style={{ color: COFFEE.gold }}
            >
              اذهب الآن
              <ChevronLeft className="w-4 h-4" />
            </span>
          </button>
        ))}
      </div>
    );
  }

  // ✅ منطقة متفتحة: اعرض العقارات اللي جواها بس + زرار رجوع
  const list = grouped[selectedLocation] || [];

  return (
    <div>
      <button
        onClick={() => setSelectedLocation(null)}
        className="flex items-center gap-2 mb-8 font-bold"
        style={{ color: COFFEE.dark }}
      >
        <ArrowRight className="w-5 h-5" />
        رجوع لكل الأماكن
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: COFFEE.gold }}
        >
          <MapPin className="w-5 h-5" style={{ color: COFFEE.darkest }} />
        </div>

        <h2 className="text-2xl font-extrabold" style={{ color: COFFEE.dark }}>
          {selectedLocation}
        </h2>
      </div>

      <PropertyGrid
        list={list}
        favorites={favorites}
        onToggleFav={onToggleFav}
        onOpen={onOpen}
      />
    </div>
  );
}

export default PropertySectionByLocation;