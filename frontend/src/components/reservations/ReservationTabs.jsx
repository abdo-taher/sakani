import React from "react";
import { COFFEE } from "../../constants/constants";

function ReservationTabs({
  activeTab,
  setActiveTab,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-2 mb-8 flex gap-2">

      <button
        onClick={() => setActiveTab("reservations")}
        className={`flex-1 py-4 rounded-xl font-bold transition ${
          activeTab === "reservations"
            ? "text-white"
            : "text-stone-600 hover:bg-stone-100"
        }`}
        style={
          activeTab === "reservations"
            ? {
                backgroundColor: COFFEE.gold,
              }
            : {}
        }
      >
        طلبات الحجز
      </button>

      <button
        onClick={() => setActiveTab("needs")}
        className={`flex-1 py-4 rounded-xl font-bold transition ${
          activeTab === "needs"
            ? "text-white"
            : "text-stone-600 hover:bg-stone-100"
        }`}
        style={
          activeTab === "needs"
            ? {
                backgroundColor: COFFEE.gold,
              }
            : {}
        }
      >
        طلبات العملاء
      </button>

    </div>
  );
}

export default ReservationTabs;