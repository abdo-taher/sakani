import React from "react";
import { Plus } from "lucide-react";
import { COFFEE } from "../../constants/constants";

function PropertyHeader({
  onAdd,
  onOpenFeatures,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-5 mb-10">
      <div className="min-w-0">
        <h1
          className="text-3xl md:text-4xl xl:text-5xl font-extrabold"
          style={{ color: COFFEE.dark }}
        >
          إدارة العقارات
        </h1>

        <p className="text-stone-500 mt-3 text-base md:text-lg">
          أضف، عدل، احذف، أو غيّر حالة أي عقار بسهولة.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">

  <button
    onClick={onOpenFeatures}
    className="flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-md border"
    style={{
      borderColor: COFFEE.gold,
      color: COFFEE.dark,
      background: "#fff",
    }}
  >
    ⭐ إدارة المميزات
  </button>

  <button
    onClick={onAdd}
    className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-md"
    style={{
      backgroundColor: COFFEE.gold,
      color: COFFEE.dark,
    }}
  >
    <Plus size={22} />
    إضافة عقار جديد
  </button>

</div>
    </div>
  );
}

export default PropertyHeader;