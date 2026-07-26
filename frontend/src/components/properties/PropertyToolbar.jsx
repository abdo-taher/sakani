import React from "react";
import { Search, Filter, ChevronDown } from "lucide-react";
import { COFFEE } from "../../constants/constants";

function PropertyToolbar({
  search,
  setSearch,
  type,
  setType,
  status,
  setStatus,
  location,
  setLocation,
 categories = [],
locations = [],
}) {
  const selectStyle = {
    WebkitAppearance: "none",
    MozAppearance: "none",
    appearance: "none",
  };

  return (
    <div
      className="bg-white rounded-3xl shadow-sm border border-stone-200 p-4 md:p-6 lg:p-8 mb-6 md:mb-10"
      dir="rtl"
    >
      <div className="flex items-center gap-2 mb-8">
        <Filter size={24} style={{ color: COFFEE.gold }} />
        <h2 className="font-bold text-xl" style={{ color: COFFEE.dark }}>
          البحث والتصفية
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-6">
        {/* البحث */}
        <div>
          <label className="block text-base font-bold mb-2.5 text-stone-600">
            بحث
          </label>
          <div className="relative">
            <Search
              size={20}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="ابحث باسم العقار..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-stone-300 pr-12 pl-4 py-3.5 text-base outline-none focus:border-yellow-600 focus:ring-2 focus:ring-yellow-100 transition"
            />
          </div>
        </div>

        {/* النوع */}
        <div>
          <label className="block text-base font-bold mb-2.5 text-stone-600">
            النوع
          </label>
          <div className="relative">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={selectStyle}
              className="w-full rounded-xl border border-stone-300 pl-10 pr-4 py-3.5 text-base outline-none focus:border-yellow-600 focus:ring-2 focus:ring-yellow-100 bg-white cursor-pointer transition"
            >
             <option value="">كل الأقسام</option>
  
              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.name}
                >
                  {category.name}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>
        </div>

        {/* الحالة */}
        <div>
          <label className="block text-base font-bold mb-2.5 text-stone-600">
            الحالة
          </label>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={selectStyle}
              className="w-full rounded-xl border border-stone-300 pl-10 pr-4 py-3.5 text-base outline-none focus:border-yellow-600 focus:ring-2 focus:ring-yellow-100 bg-white cursor-pointer transition"
            >
              <option value="">الكل</option>
              <option value="available">متاح</option>
              <option value="reserved">محجوز</option>
              <option value="sold">تم البيع</option>
              <option value="rented">تم التأجير</option>
            </select>
            <ChevronDown size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>
        </div>

        {/* المكان */}
        <div>
          <label className="block text-base font-bold mb-2.5 text-stone-600">
            المكان
          </label>
          <div className="relative">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={selectStyle}
              className="w-full rounded-xl border border-stone-300 pl-10 pr-4 py-3.5 text-base outline-none focus:border-yellow-600 focus:ring-2 focus:ring-yellow-100 bg-white cursor-pointer transition"
            >
              <option value="">كل الأماكن</option>
             {locations.map((location) => (
                <option
                  key={location.id}
                  value={location.name}
                >
                  {location.name}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertyToolbar;