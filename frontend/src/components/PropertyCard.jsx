import React, { useState } from "react";
import { Heart, Bed, Bath, Maximize, MapPin, PlayCircle } from "lucide-react";
import { COFFEE } from "../constants/constants";

const STATUS_LABELS = {
  available: { text: "متاح", color: "#2E7D32" },
  reserved: { text: "محجوز", color: "#B08D57" },
  sold: { text: "تم البيع", color: "#8B1E1E" },
  rented: { text: "تم التأجير", color: "#8B1E1E" },
};

function fmtPrice(price) {
  return new Intl.NumberFormat("ar-EG").format(price);
}

function PropertyCard({ p, isFav, onToggleFav, onOpen }) {
  const [imgError, setImgError] = useState(false);

  const mainImage =
    !imgError && p.images && p.images.length > 0
      ? p.images[0].image_url || p.images[0].path
      : null;

  const status = STATUS_LABELS[p.status] || STATUS_LABELS.available;

  return (
    <div
      onClick={() => onOpen && onOpen(p)}
      className="group relative bg-white rounded-2xl overflow-hidden border cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{ borderColor: "#eee" }}
      dir="rtl"
    >
      <div className="relative h-48 w-full overflow-hidden bg-stone-100">
        {mainImage ? (
          <img
            src={mainImage}
            alt={p.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 text-sm">لا توجد صورة</div>
        )}

        {p.video_url && (
          <div
            className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            فيديو
          </div>
        )}

        <div
          className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: status.color }}
        >
          {status.text}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav && onToggleFav(p.id);
          }}
          className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
        >
          <Heart className="w-4 h-4" fill={isFav ? COFFEE.gold : "none"} style={{ color: COFFEE.gold }} />
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-extrabold text-base mb-1 truncate" style={{ color: COFFEE.dark }}>{p.title}</h3>

        <div className="flex items-center gap-1 text-xs text-stone-400 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{p.location?.name || "غير محدد"}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-stone-500 mb-3 border-t border-b py-2" style={{ borderColor: "#f2f2f2" }}>
          <div className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5" style={{ color: COFFEE.gold }} />
            {p.rooms}
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5" style={{ color: COFFEE.gold }} />
            {p.bathrooms}
          </div>
          <div className="flex items-center gap-1">
            <Maximize className="w-3.5 h-3.5" style={{ color: COFFEE.gold }} />
            {p.area} م²
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-extrabold text-lg" style={{ color: COFFEE.mid }}>{fmtPrice(p.price)} ج.م</span>
          {p.rent_duration && <span className="text-xs text-stone-400">/{p.rent_duration}</span>}
        </div>
      </div>
    </div>
  );
}

export default PropertyCard;