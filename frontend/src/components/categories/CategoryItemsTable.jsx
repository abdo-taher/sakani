import React from "react";
import CategoryItemRow from "./CategoryItemRow";

function CategoryItemsTable({
  items = [],
  onEdit,
  onDelete,
}) {
  return (
    <div
      className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden"
      dir="rtl"
    >
      <div className="overflow-x-auto">
      <table className="w-full text-base">
        <thead className="bg-stone-100">
          <tr>
            <th className="px-6 py-5 text-right font-bold text-stone-600">
              اسم النوع
            </th>

            <th className="px-6 py-5 text-center font-bold text-stone-600">
              الإجراءات
            </th>
          </tr>
        </thead>

        <tbody>
          {items.length === 0 ? (
            <tr>
              <td
                colSpan={2}
                className="py-20 text-center text-stone-400 font-semibold text-lg"
              >
                لا توجد أنواع حالياً
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <CategoryItemRow
                key={item.id}
                item={item}
                onEdit={onEdit}
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

export default CategoryItemsTable;