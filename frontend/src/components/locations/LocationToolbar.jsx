import React from "react";
import { Search } from "lucide-react";
import { COFFEE } from "../../constants/constants";

function LocationToolbar({
  search,
  setSearch,
}) {
  return (
    <div
      className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 md:p-8 mb-10"
      dir="rtl"
    >
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-2xl font-bold"
          style={{ color: COFFEE.dark }}
        >
          البحث
        </h2>

        <Search
          size={26}
          style={{ color: COFFEE.gold }}
        />
      </div>

      <div className="relative">
        <Search
          size={20}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400"
        />

        <input
          type="text"
          placeholder="ابحث باسم المكان..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-stone-300 pr-12 pl-4 py-3.5 text-base outline-none focus:border-yellow-600 focus:ring-2 focus:ring-yellow-100 transition"
        />
      </div>
    </div>
  );
}

export default LocationToolbar;