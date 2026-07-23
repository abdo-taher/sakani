import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const MONTH_NAMES = {
  "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
  "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
  "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
};

const PIE_COLORS = ["#8B6F47", "#C9A876", "#D9C9A8", "#6B4F3B", "#A8896A", "#E5D5B8"];

function formatMonth(monthStr) {
  if (!monthStr) return "";
  const [, month] = monthStr.split("-");
  return MONTH_NAMES[month] || monthStr;
}

function Charts({ monthlyStats = [], categoryDistribution = [], loading = false }) {
  const chartData = monthlyStats.map((item) => ({
    ...item,
    monthLabel: formatMonth(item.month),
  }));

  const hasMonthlyData = chartData.some(
    (item) => item.properties > 0 || item.reservations > 0
  );

  const hasCategoryData = categoryDistribution.length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">

      <h2 className="text-xl font-bold mb-6">
        إحصائيات الموقع
      </h2>

      {loading ? (
        <div className="h-80 flex items-center justify-center text-stone-400">
          جاري تحميل الإحصائيات...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* نمو العقارات وطلبات الحجز */}
          <div>
            <h3 className="text-sm font-semibold text-stone-500 mb-4">
              العقارات وطلبات الحجز (آخر 6 شهور)
            </h3>

            {hasMonthlyData ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ECE7DD" />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="properties"
                    name="العقارات"
                    stroke="#8B6F47"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="reservations"
                    name="طلبات الحجز"
                    stroke="#C9A876"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-stone-400 text-sm">
                لا توجد بيانات كافية بعد
              </div>
            )}
          </div>

          {/* توزيع العقارات حسب القسم */}
          <div>
            <h3 className="text-sm font-semibold text-stone-500 mb-4">
              توزيع العقارات حسب القسم
            </h3>

            {hasCategoryData ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-stone-400 text-sm">
                لا توجد عقارات مضافة بعد
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

export default Charts;