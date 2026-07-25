import React from "react";
import PropertyCard from "./PropertyCard";

function PropertyGrid({ list, emptyText, favorites = new Set(), onToggleFav, onOpen }) {
  if (!list.length) {
    return (
      <div className="animate-fadePop text-center py-20 text-stone-400 font-semibold" dir="rtl">
        {emptyText || "لا توجد نتائج متاحة حاليًا"}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {list.map((p, i) => (
        <PropertyCard key={p.id} p={p} index={i} isFav={favorites.has(p.id)} onToggleFav={onToggleFav} onOpen={onOpen} />
      ))}
    </div>
  );
}

export default PropertyGrid;