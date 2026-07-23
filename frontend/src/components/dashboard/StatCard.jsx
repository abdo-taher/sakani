import React from "react";
import { COFFEE } from "../../constants/constants";

function StatCard({
  title,
  value,
  icon: Icon,
  color = COFFEE.gold,
}) {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ borderColor: "#ECE7DD" }}
    >
      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm text-stone-500 mb-2">
            {title}
          </p>

          <h2
            className="text-4xl font-extrabold"
            style={{ color: COFFEE.dark }}
          >
            {value}
          </h2>
        </div>

        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            backgroundColor: `${color}22`,
          }}
        >
          <Icon
            size={30}
            style={{ color }}
          />
        </div>

      </div>
    </div>
  );
}

export default StatCard;