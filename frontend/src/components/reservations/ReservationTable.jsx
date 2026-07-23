import React from "react";
import ReservationRow from "./ReservationRow";

function ReservationTable({
  reservations = [],
  onView,
  onDelete,
}) {
  return (
    <div
      className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden"
      dir="rtl"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-base table-fixed">

          <colgroup>
            <col className="w-[110px]" />
            <col className="w-[220px]" />
            <col className="w-[170px]" />
            <col className="w-[160px]" />
            <col className="w-[150px]" />
            <col className="w-[170px]" />
            <col className="w-[170px]" />
            <col className="w-[120px]" />
          </colgroup>

          <thead className="bg-stone-100">
            <tr>

              <th className="px-4 py-5 text-right font-bold text-stone-600">
                الصورة
              </th>

              <th className="px-4 py-5 text-right font-bold text-stone-600">
                العقار
              </th>

              <th className="px-4 py-5 text-right font-bold text-stone-600">
                العميل
              </th>

              <th className="px-4 py-5 text-right font-bold text-stone-600">
                الهاتف
              </th>

              <th className="px-4 py-5 text-right font-bold text-stone-600">
                الحالة
              </th>

              <th className="px-4 py-5 text-right font-bold text-stone-600">
                تاريخ الطلب
              </th>

              <th className="px-4 py-5 text-right font-bold text-stone-600">
                آخر تحديث
              </th>

              <th className="px-4 py-5 text-center font-bold text-stone-600">
                الإجراءات
              </th>

            </tr>
          </thead>

          <tbody>

            {reservations.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-20 text-center text-stone-400 font-semibold text-lg"
                >
                  لا توجد طلبات حجز حالياً
                </td>
              </tr>
            ) : (
              reservations.map((reservation) => (
                <ReservationRow
                  key={reservation.id}
                  reservation={reservation}
                  onView={onView}
                  onDelete={onDelete}
                />
              ))
            )}

          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReservationTable;