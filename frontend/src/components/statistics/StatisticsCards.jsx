import React from "react";
import {
  Building2,
  ClipboardList,
  MapPinned,
  FolderTree,
  CheckCircle2,
  Home,
  BadgeDollarSign,
} from "lucide-react";
import { COFFEE } from "../../constants/constants";

function StatisticsCards({ cards, loading }) {
  const data = [
    {
      title: "عدد العقارات",
      value: cards?.properties ?? 0,
      icon: <Building2 size={28} />,
    },
    {
      title: "طلبات الحجز",
      value: cards?.reservations ?? 0,
      icon: <ClipboardList size={28} />,
    },
    {
      title: "الأماكن",
      value: cards?.locations ?? 0,
      icon: <MapPinned size={28} />,
    },
    {
      title: "الأقسام",
      value: cards?.categories ?? 0,
      icon: <FolderTree size={28} />,
    },
    {
      title: "العقارات المتاحة",
      value: cards?.available ?? 0,
      icon: <Home size={28} />,
    },
    {
      title: "تم البيع",
      value: cards?.sold ?? 0,
      icon: <BadgeDollarSign size={28} />,
    },
    {
      title: "تم الإيجار",
      value: cards?.rented ?? 0,
      icon: <CheckCircle2 size={28} />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6 mb-10">

      {data.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between mb-6">

            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: `${COFFEE.gold}20`,
                color: COFFEE.gold,
              }}
            >
              {card.icon}
            </div>

            <div className="text-right">
              <p className="text-stone-500 text-sm">
                {card.title}
              </p>

              <h2
                className="text-3xl font-extrabold mt-2"
                style={{ color: COFFEE.dark }}
              >
                {loading ? "..." : card.value}
              </h2>
            </div>

          </div>
        </div>
      ))}

    </div>
  );
}

export default StatisticsCards;