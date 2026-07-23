import React from "react";
import { Plus, FolderTree } from "lucide-react";
import { COFFEE } from "../../constants/constants";

function CategoryDetailsHeader({
  categoryName,
  onAdd,
}) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-6 mb-10">

      <div>
        <div className="flex items-center gap-3 mb-2">
          <FolderTree
            size={34}
            style={{ color: COFFEE.gold }}
          />

          <h1
            className="text-4xl font-extrabold"
            style={{ color: COFFEE.dark }}
          >
            {categoryName}
          </h1>
        </div>

        <p className="text-stone-500 text-lg">
          أضف أو عدل أو احذف الأنواع الخاصة بهذا القسم.
        </p>
      </div>

      <button
        onClick={onAdd}
        className="flex items-center gap-3 rounded-2xl px-7 py-4 shadow-md font-bold text-lg transition hover:scale-105"
        style={{
          backgroundColor: COFFEE.gold,
          color: COFFEE.dark,
        }}
      >
        <Plus size={22} />
        إضافة نوع جديد
      </button>

    </div>
  );
}

export default CategoryDetailsHeader;