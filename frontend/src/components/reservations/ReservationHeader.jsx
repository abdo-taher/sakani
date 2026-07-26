import React from "react";
import { Plus, ClipboardList } from "lucide-react";
import { COFFEE } from "../../constants/constants";

function ReservationHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 md:gap-5 mb-6 md:mb-10">
      <div className="min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardList
            size={28}
            className="shrink-0 md:hidden"
            style={{ color: COFFEE.gold }}
          />
          <ClipboardList
            size={34}
            className="shrink-0 hidden md:block"
            style={{ color: COFFEE.gold }}
          />

          <h1
            className="text-2xl md:text-3xl lg:text-4xl font-extrabold"
            style={{ color: COFFEE.dark }}
          >
            طلبات الحجز
          </h1>
        </div>

        <p className="text-stone-500 text-sm md:text-lg">
          متابعة جميع طلبات الحجز الواردة من العملاء وإدارة حالتها.
        </p>
      </div>
    </div>
  );
}

export default ReservationHeader;