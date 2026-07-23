import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { COFFEE } from "../../constants/constants";

const COLORS = [
  "#B08D57",
  "#6F4E37",
  "#2B1B12",
  "#A16207",
  "#DC2626",
  "#3B8A5A",
];

function StatisticsCharts({ propertyDistribution = [], reservationStatus = [], loading }) {
  const hasPropertyData = propertyDistribution.length > 0;
  const hasReservationData = reservationStatus.some((item) => item.value > 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">

      {/* توزيع العقارات حسب القسم */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6">

        <h2
          className="text-xl font-bold mb-6"
          style={{ color: COFFEE.dark }}
        >
          توزيع العقارات
        </h2>

        {loading ? (
          <div className="h-80 flex items-center justify-center text-stone-400">
            جاري التحميل...
          </div>
        ) : hasPropertyData ? (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>

              <Pie
                data={propertyDistribution}
                dataKey="value"
                nameKey="name"
                outerRadius={110}
                label
              >
                {propertyDistribution.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip />
              <Legend />

            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-80 flex items-center justify-center text-stone-400 text-sm">
            لا توجد عقارات مضافة بعد
          </div>
        )}

      </div>

      {/* حالة طلبات الحجز */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6">

        <h2
          className="text-xl font-bold mb-6"
          style={{ color: COFFEE.dark }}
        >
          حالة طلبات الحجز
        </h2>

        {loading ? (
          <div className="h-80 flex items-center justify-center text-stone-400">
            جاري التحميل...
          </div>
        ) : hasReservationData ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={reservationStatus}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="name" />

              <YAxis allowDecimals={false} />

              <Tooltip />

              <Bar
                dataKey="value"
                fill={COFFEE.gold}
                radius={[8, 8, 0, 0]}
              />

            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-80 flex items-center justify-center text-stone-400 text-sm">
            لا توجد طلبات حجز بعد
          </div>
        )}

      </div>

    </div>
  );
}

export default StatisticsCharts;