import React from "react";
import { FolderOpen } from "lucide-react";

function CategoryRow({ category, onManage }) {
  return (
    <tr className="border-t border-stone-100 hover:bg-stone-50 transition">

      {/* اسم القسم */}
      <td className="px-6 py-5 font-semibold text-stone-800">
        {category.name}
      </td>

      {/* عدد العناصر */}
      <td className="px-6 py-5 text-center font-semibold">
        {category.itemsCount}
      </td>

      {/* الإجراءات */}
      <td className="px-6 py-5">
        <div className="flex justify-center gap-2">

          {/* إدارة */}
          <button
            onClick={() => onManage(category)}
            className="w-10 h-10 rounded-lg hover:bg-blue-50 flex items-center justify-center transition"
            title="إدارة العناصر"
          >
            <FolderOpen size={18} color="#2563EB" />
          </button>

        </div>
      </td>
    </tr>
  );
}

export default CategoryRow;