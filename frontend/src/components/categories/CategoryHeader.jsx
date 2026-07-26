import React from "react";
import { FolderTree } from "lucide-react";
import { COFFEE } from "../../constants/constants";

function CategoryHeader() {
  return (
    <div className="flex items-center justify-between mb-6 md:mb-10 flex-wrap gap-4 md:gap-5">

      <div className="min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <FolderTree
            size={28}
            className="shrink-0 md:hidden"
            style={{ color: COFFEE.gold }}
          />
          <FolderTree
            size={34}
            className="shrink-0 hidden md:block"
            style={{ color: COFFEE.gold }}
          />

          <h1
            className="text-2xl md:text-3xl lg:text-5xl font-extrabold"
            style={{ color: COFFEE.dark }}
          >
            إدارة الأقسام
          </h1>
        </div>

        <p className="text-stone-500 text-sm md:text-lg">
          أضف، عدل أو احذف أقسام العقارات بسهولة.
        </p>
      </div>

    </div>
  );
}

export default CategoryHeader;