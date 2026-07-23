import React from "react";

function RecentReservations({ reservations = [], loading = false }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">

      <h2 className="text-xl font-bold mb-6">
        آخر طلبات الحجز
      </h2>

      {loading ? (
        <div className="text-stone-400 text-center py-12">
          جاري التحميل...
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-stone-400 text-center py-12">
          لا توجد طلبات حالياً
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="flex items-center justify-between border-b pb-3 last:border-none"
            >
              <span className="font-medium text-stone-700">
                {reservation.name || reservation.customer_name || `طلب #${reservation.id}`}
              </span>

              {reservation.status && (
                <span className="text-stone-500 text-sm">
                  {reservation.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default RecentReservations;