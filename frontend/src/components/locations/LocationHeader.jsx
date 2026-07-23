import React from "react";
import { Plus, MapPinned } from "lucide-react";
import { COFFEE } from "../../constants/constants";

function LocationHeader({ onAdd }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-5 mb-10">
      <div className="min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <MapPinned
            size={34}
            style={{ color: COFFEE.gold }}
          />

          <h1
            className="text-3xl md:text-4xl xl:text-5xl font-extrabold"
            style={{ color: COFFEE.dark }}
          >
            إدارة الأماكن
          </h1>
        </div>

        <p className="text-stone-500 text-base md:text-lg">
          أضف، عدل أو احذف أماكن العقارات بسهولة.
        </p>
      </div>

      <button
        onClick={onAdd}
        className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base md:text-lg transition-all duration-300 hover:scale-105 active:scale-95 shadow-md whitespace-nowrap shrink-0"
        style={{
          backgroundColor: COFFEE.gold,
          color: COFFEE.dark,
        }}
      >
        <Plus size={24} />
        إضافة مكان جديد
      </button>
    </div>
  );
}

export default LocationHeader;