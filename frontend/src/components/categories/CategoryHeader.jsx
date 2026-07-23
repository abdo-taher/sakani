import React from "react";
import { FolderTree } from "lucide-react";
import { COFFEE } from "../../constants/constants";

function CategoryHeader() {
  return (
    <div className="flex items-center justify-between mb-10 flex-wrap gap-5">

      <div>
        <div className="flex items-center gap-3 mb-2">
          <FolderTree
            size={34}
            style={{ color: COFFEE.gold }}
          />

          <h1
            className="text-5xl font-extrabold"
            style={{ color: COFFEE.dark }}
          >
            إدارة الأقسام
          </h1>
        </div>

        <p className="text-stone-500 text-lg">
          أضف، عدل أو احذف أقسام العقارات بسهولة.
        </p>
      </div>

    </div>
  );
}

export default CategoryHeader;