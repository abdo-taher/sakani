import React from "react";
import PropertyRow from "./PropertyRow";

function PropertyTable({
  properties = [],
  onPreview,
  onEdit,
  onDelete,
  onStatusChange,
  onRefresh,
}) {
  return (
    <div
      className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden"
      dir="rtl"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-base table-fixed">
          <colgroup>
            <col className="w-[110px]" />
            <col className="w-[200px]" />
            <col className="w-[100px]" />
            <col className="w-[150px]" />
            <col className="w-[120px]" />
            <col className="w-[100px]" />
            <col className="w-[130px]" />
            <col className="w-[140px]" />
          </colgroup>

          <thead className="bg-stone-100">
            <tr>
              <th className="px-4 py-5 text-right font-bold text-stone-600 whitespace-nowrap">
                الصورة
              </th>
              <th className="px-4 py-5 text-right font-bold text-stone-600 whitespace-nowrap">
                اسم العقار
              </th>
              <th className="px-4 py-5 text-right font-bold text-stone-600 whitespace-nowrap">
                النوع
              </th>
              <th className="px-4 py-5 text-right font-bold text-stone-600 whitespace-nowrap">
                المكان
              </th>
              <th className="px-4 py-5 text-right font-bold text-stone-600 whitespace-nowrap">
                السعر
              </th>
              <th className="px-4 py-5 text-right font-bold text-stone-600 whitespace-nowrap">
                المشاهدات
              </th>
              <th className="px-4 py-5 text-right font-bold text-stone-600 whitespace-nowrap">
                الحالة
              </th>
              <th className="px-4 py-5 text-center font-bold text-stone-600 whitespace-nowrap">
                الإجراءات
              </th>
            </tr>
          </thead>

          <tbody>
            {properties.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-20 text-center text-stone-400 font-semibold text-lg"
                >
                  لا توجد عقارات حالياً
                </td>
              </tr>
            ) : (
              properties.map((property) => (
                <PropertyRow
                  key={property.id}
                  property={property}
                  onPreview={onPreview}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                  onRefresh={onRefresh}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PropertyTable;