import React from "react";
import { Search, Filter, ChevronDown } from "lucide-react";
import { COFFEE } from "../../constants/constants";

function ReservationToolbar({
  search,
  setSearch,
  status,
  setStatus,
}) {
  const selectClass =
    "w-full rounded-xl border border-stone-300 pl-10 pr-4 py-3.5 text-base outline-none focus:border-yellow-600 focus:ring-2 focus:ring-yellow-100 bg-white cursor-pointer transition";

  return (
    <div
      className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 md:p-8 mb-10"
      dir="rtl"
    >
      <div className="flex items-center gap-2 mb-8">
        <Filter
          size={24}
          style={{ color: COFFEE.gold }}
        />

        <h2
          className="font-bold text-xl"
          style={{ color: COFFEE.dark }}
        >
          البحث والتصفية
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* البحث */}
        <div>
          <label className="block text-base font-bold mb-2.5 text-stone-600">
            بحث
          </label>

          <div className="relative">
            <Search
              size={20}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400"
            />

            <input
              type="text"
              placeholder="ابحث باسم العميل أو رقم الهاتف أو العقار..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-stone-300 pr-12 pl-4 py-3.5 text-base outline-none focus:border-yellow-600 focus:ring-2 focus:ring-yellow-100 transition"
            />
          </div>
        </div>

        {/* الحالة */}
        <div>
          <label className="block text-base font-bold mb-2.5 text-stone-600">
            حالة الطلب
          </label>

          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={selectClass}
            >
              <option value="">كل الطلبات</option>
              <option value="new">طلب جديد</option>
              <option value="contacted">تم التواصل</option>
              <option value="rented">تم الإيجار</option>
              <option value="sold">تم البيع</option>
              <option value="cancelled">ملغي</option>
            </select>
            <ChevronDown size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>
        </div>

      </div>
    </div>
  );
}

export default ReservationToolbar;