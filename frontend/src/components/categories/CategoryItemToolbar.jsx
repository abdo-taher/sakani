import React from "react";
import { Search } from "lucide-react";

function CategoryItemToolbar({
  search,
  setSearch,
}) {
  return (
    <div
      className="bg-white rounded-3xl shadow-sm border border-stone-200 p-8 mb-10"
      dir="rtl"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-stone-800">
          البحث
        </h2>

        <Search
          size={30}
          className="text-yellow-600"
        />
      </div>

      <div className="relative">
        <Search
          size={22}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400"
        />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث باسم النوع..."
          className="w-full rounded-xl border border-stone-300 pr-12 pl-4 py-4 outline-none focus:ring-2 focus:ring-yellow-200"
        />
      </div>
    </div>
  );
}

export default CategoryItemToolbar;