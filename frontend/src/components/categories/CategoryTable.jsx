import React from "react";
import CategoryRow from "./CategoryRow";

function CategoryTable({ categories = [], onManage }) {
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
                اسم القسم
              </th>

              <th className="px-6 py-5 text-center font-bold text-stone-600">
                عدد العناصر
              </th>

              <th className="px-6 py-5 text-center font-bold text-stone-600">
                الإجراءات
              </th>
            </tr>
          </thead>

          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="py-20 text-center text-stone-400 font-semibold text-lg"
                >
                  لا توجد أقسام حالياً
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  onManage={onManage}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CategoryTable;