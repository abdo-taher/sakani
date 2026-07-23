import React from "react";
import NeedRequestRow from "./NeedRequestRow";

function NeedRequestTable({
  requests = [],
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
            <col className="w-[170px]" />
            <col className="w-[170px]" />
            <col className="w-[140px]" />
            <col className="w-[180px]" />
            <col className="w-[170px]" />
            <col className="w-[170px]" />
            <col className="w-[170px]" />
            <col className="w-[120px]" />
          </colgroup>

          <thead className="bg-stone-100">
            <tr>

              <th className="px-4 py-5 text-right font-bold text-stone-600">
                العميل
              </th>

              <th className="px-4 py-5 text-right font-bold text-stone-600">
                الهاتف
              </th>

              <th className="px-4 py-5 text-right font-bold text-stone-600">
                نوع الطلب
              </th>

              <th className="px-4 py-5 text-right font-bold text-stone-600">
                المنطقة
              </th>

              <th className="px-4 py-5 text-right font-bold text-stone-600">
                الميزانية
              </th>

              <th className="px-4 py-5 text-right font-bold text-stone-600">
                الحالة
              </th>

              <th className="px-4 py-5 text-right font-bold text-stone-600">
                تاريخ الطلب
              </th>

              <th className="px-4 py-5 text-center font-bold text-stone-600">
                الإجراءات
              </th>

            </tr>
          </thead>

          <tbody>

            {requests.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-20 text-center text-stone-400 font-semibold text-lg"
                >
                  لا توجد طلبات حالياً
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <NeedRequestRow
                  key={request.id}
                  request={request}
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

export default NeedRequestTable;