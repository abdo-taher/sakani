import React from "react";

function RecentProperties({ properties = [], loading = false }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">

      <h2 className="text-xl font-bold mb-6">
        آخر العقارات المضافة
      </h2>

      {loading ? (
        <div className="text-stone-400 text-center py-12">
          جاري التحميل...
        </div>
      ) : properties.length === 0 ? (
        <div className="text-stone-400 text-center py-12">
          لا توجد بيانات حالياً
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((property) => (
            <div
              key={property.id}
              className="flex items-center justify-between border-b pb-3 last:border-none"
            >
              <span className="font-medium text-stone-700">
                {property.title || property.name || `عقار #${property.id}`}
              </span>

              {property.price > 0 && (
                <span className="text-stone-500 text-sm">
                  {property.price} جنيه
                </span>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default RecentProperties;