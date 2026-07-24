import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Bed, Bath, Maximize, MapPin, PlayCircle, Loader2 } from "lucide-react";
import { COFFEE } from "../constants/constants";
import VideoThumb from "./VideoThumb";

const STATUS_LABELS = {
  available: { text: "متاح", color: "#2E7D32" },
  reserved: { text: "محجوز", color: "#B08D57" },
  sold: { text: "تم البيع", color: "#8B1E1E" },
  rented: { text: "تم التأجير", color: "#8B1E1E" },
};

function fmtPrice(price) {
  return new Intl.NumberFormat("ar-EG").format(price);
}

function PropertyCard({ p, isFav, onToggleFav }) {
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

  const isUploading = p.is_uploading;
  const hasVideo = (p.images && p.images.some(img => img.media_type === 'video')) || p.video_url;

  const firstVideo = p.images && p.images.find(img => img.media_type === 'video');
  const firstImage = p.images && p.images.find(img => (img.media_type || 'image') === 'image');

  const mainImage = !imgError && firstImage
    ? firstImage.image_url || firstImage.path
    : null;

  const mainVideo = hasVideo
    ? (firstVideo ? firstVideo.image_url : p.video_url)
    : null;

  const status = STATUS_LABELS[p.status] || STATUS_LABELS.available;

  return (
    <div
      onClick={() => !isUploading && navigate(`/property/${p.id}`)}
      className={`group relative bg-white rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      style={{ borderColor: "#eee" }}
      dir="rtl"
    >
      <div className="relative h-48 w-full overflow-hidden bg-stone-100">
        {mainVideo ? (
          <VideoThumb
            src={mainVideo}
            alt={p.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : mainImage ? (
          <img
            src={mainImage}
            alt={p.title}
            onError={() => setImgError(true)}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 text-sm">لا توجد صورة</div>
        )}

        {hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <PlayCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        )}

        <div
          className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: status.color }}
        >
          {status.text}
        </div>

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/90 text-white text-xs font-bold backdrop-blur-sm">
              <Loader2 size={14} className="animate-spin" />
              جاري رفع الوسائط...
            </div>
          </div>
        )}

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