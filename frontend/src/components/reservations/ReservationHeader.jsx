import React from "react";
import { Plus, ClipboardList } from "lucide-react";
import { COFFEE } from "../../constants/constants";

function ReservationHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-5 mb-10">
      <div className="min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardList
            size={34}
            style={{ color: COFFEE.gold }}
          />

          <h1
            className="text-4xl font-extrabold"
            style={{ color: COFFEE.dark }}
          >
            طلبات الحجز
          </h1>
        </div>

        <p className="text-stone-500 text-lg">
          متابعة جميع طلبات الحجز الواردة من العملاء وإدارة حالتها.
        </p>
      </div>
    </div>
  );
}

export default ReservationHeader;