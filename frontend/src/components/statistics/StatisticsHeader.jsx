import React from "react";
import { BarChart3 } from "lucide-react";
import { COFFEE } from "../../constants/constants";

function StatisticsHeader() {
  return (
    <div className="mb-6 md:mb-10">

      <div className="flex items-center gap-3 mb-2">

        <BarChart3
          size={28}
          className="shrink-0 md:hidden"
          style={{ color: COFFEE.gold }}
        />
        <BarChart3
          size={34}
          className="shrink-0 hidden md:block"
          style={{ color: COFFEE.gold }}
        />

        <h1
          className="text-2xl md:text-3xl lg:text-4xl font-extrabold"
          style={{ color: COFFEE.dark }}
        >
          إحصائيات الموقع
        </h1>

      </div>

      <p className="text-stone-500 text-sm md:text-lg">
        متابعة أداء الموقع وتحليل العقارات والحجوزات بشكل شامل.
      </p>

    </div>
  );
}

export default StatisticsHeader;