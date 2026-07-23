import React from "react";
import {
  TrendingUp,
  MapPinned,
  Building2,
  BadgeDollarSign,
  ClipboardList,
  Home,
} from "lucide-react";

import { COFFEE } from "../../constants/constants";

function formatPrice(value) {
  if (!value) return "0 ج.م";
  return `${Number(value).toLocaleString("ar-EG")} ج.م`;
}

function StatisticsSummary({ summary, loading }) {
  const data = [
    {
      icon: <MapPinned size={22} />,
      title: "أكثر منطقة نشاطاً",
      value: summary?.most_active_location ?? "—",
    },
    {
      icon: <Building2 size={22} />,
      title: "أكثر نوع عقار",
      value: summary?.most_common_category ?? "—",
    },
    {
      icon: <BadgeDollarSign size={22} />,
      title: "متوسط سعر البيع",
      value: formatPrice(summary?.avg_sale_price),
    },
    {
      icon: <Home size={22} />,
      title: "متوسط سعر الإيجار",
      value: formatPrice(summary?.avg_rent_price),
    },
    {
  icon: <TrendingUp size={22} />,
  title: "نسبة البيع",
  value: `${summary?.sale_ratio ?? 0}%`,
  subtitle: "من إجمالي العقارات",
  
},

    {
      icon: <ClipboardList size={22} />,
      title: "طلبات تحتاج متابعة",
      value: `${summary?.pending_reservations ?? 0} طلبات`,
    },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6">

      <h2
        className="text-2xl font-bold mb-8"
        style={{ color: COFFEE.dark }}
      >
        ملخص وتحليل الموقع
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {data.map((item, index) => (
          <div
            key={index}
            className="border border-stone-200 rounded-2xl p-5 hover:shadow-md transition"
          >
            <div className="flex items-center gap-3 mb-4">

              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: `${COFFEE.gold}20`,
                  color: COFFEE.gold,
                }}
              >
                {item.icon}
              </div>

              <h3
                className="font-bold text-lg"
                style={{ color: COFFEE.dark }}
              >
                {item.title}
              </h3>

            </div>

            <p
  className="text-2xl font-extrabold"
  style={{ color: COFFEE.mid }}
>
  {loading ? "..." : item.value}
</p>

{item.subtitle && (
  <p className="text-xs text-stone-400 mt-1">
    {item.subtitle}
  </p>
)}

          </div>
        ))}

      </div>

    </div>
  );
}

export default StatisticsSummary;