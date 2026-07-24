import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Bed, Bath, Maximize, MapPin, PlayCircle, Loader2, CloudUpload } from "lucide-react";
import { COFFEE } from "../constants/constants";
import { fmtPrice, SAMPLE_IMG } from "../utils/helpers";
import VideoThumb from "./VideoThumb";

const STATUS_LABELS = {
  available: { text: "متاح", color: "#2E7D32" },
  reserved: { text: "محجوز", color: "#B08D57" },
  sold: { text: "تم البيع", color: "#8B1E1E" },
  rented: { text: "تم التأجير", color: "#8B1E1E" },
};

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

  const videoThumbnail = firstVideo?.image_public_id
    ? p.images?.find(
        (img) => img.media_type === "image" && img.caption === firstVideo.image_public_id
      )?.image_url
    : null;

  const status = STATUS_LABELS[p.status] || STATUS_LABELS.available;

  return (
    <div
      onClick={() => !isUploading && navigate(`/property/${p.id}`)}
      className={`group relative bg-white rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
        isUploading
          ? 'cursor-not-allowed border-dashed border-amber-400'
          : 'cursor-pointer hover:-translate-y-1 hover:shadow-xl border-transparent'
      }`}
      style={{
        boxShadow: isUploading
          ? "0 0 0 1px rgba(245,158,11,0.15), 0 2px 8px rgba(245,158,11,0.10)"
          : undefined,
      }}
      dir="rtl"
    >
      {isUploading && (
        <div
          className="absolute top-0 right-0 left-0 z-20 flex items-center justify-center gap-2 py-1.5 text-xs font-bold text-amber-800"
          style={{ backgroundColor: "rgba(254,243,199,0.95)" }}
        >
          <CloudUpload size={14} className="animate-bounce" />
          جاري رفع الوسائط
          <Loader2 size={13} className="animate-spin" />
        </div>
      )}

      <div className={`relative w-full overflow-hidden bg-stone-100 ${isUploading ? 'h-44' : 'h-48'}`}>
        {mainVideo ? (
          <VideoThumb
            src={mainVideo}
            posterUrl={videoThumbnail}
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
        ) : isUploading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Loader2 size={28} className="animate-spin text-amber-400" />
            <span className="text-amber-500 text-xs font-semibold">جاري رفع الصور...</span>
          </div>
        ) : (
          <img
            src={SAMPLE_IMG(p.id)}
            alt={p.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}

        {hasVideo && !isUploading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <PlayCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        )}

        {!isUploading && (
          <div
            className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: status.color }}
          >
            {status.text}
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-amber-500/10" style={{ marginTop: '16px' }}>
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
        <h3 className="font-extrabold text-base mb-1 truncate" style={{ color: isUploading ? "#92400E" : COFFEE.dark }}>{p.title}</h3>

        <div className="flex items-center gap-1 text-xs text-stone-400 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{p.location?.name || "غير محدد"}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-stone-500 mb-3 border-t border-b py-2" style={{ borderColor: "#f2f2f2" }}>
          {p.rooms && p.rooms > 0 && (
            <div className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5" style={{ color: COFFEE.gold }} />
              {p.rooms}
            </div>
          )}
          {p.bathrooms && p.bathrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" style={{ color: COFFEE.gold }} />
              {p.bathrooms}
            </div>
          )}
          {p.category?.slug !== "rent" && p.area && p.area > 0 && (
            <div className="flex items-center gap-1">
              <Maximize className="w-3.5 h-3.5" style={{ color: COFFEE.gold }} />
              {p.area} م²
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          {p.category?.slug === "rent" && p.has_detailed_rooms && (() => {
            const rooms = Array.isArray(p.rooms) ? p.rooms : Array.isArray(p.detailed_rooms) ? p.detailed_rooms : [];
            return rooms.length > 0 ? (
              <span className="font-extrabold text-lg" style={{ color: isUploading ? "#D97706" : COFFEE.mid }}>
                يبدأ من {fmtPrice(Math.min(...rooms.map(r => r.price || 0)))}
              </span>
            ) : (
              <span className="font-extrabold text-lg" style={{ color: isUploading ? "#D97706" : COFFEE.mid }}>
                {fmtPrice(p.price || 0)}
              </span>
            );
          })() || (
            <span className="font-extrabold text-lg" style={{ color: isUploading ? "#D97706" : COFFEE.mid }}>
              {fmtPrice(p.price || 0)}
            </span>
          )}
          {p.rent_duration && <span className="text-xs text-stone-400">/{p.rent_duration}</span>}
        </div>
        {p.category?.slug === "rent" && p.has_detailed_rooms && (() => {
          const rooms = Array.isArray(p.rooms) ? p.rooms : Array.isArray(p.detailed_rooms) ? p.detailed_rooms : [];
          const availableCount = rooms.filter(r => r.status === "available").length;
          return availableCount > 0 ? (
            <p className="text-xs mt-1 font-bold" style={{ color: COFFEE.gold }}>
              {availableCount} غرف متاحة
            </p>
          ) : null;
        })()}
      </div>
    </div>
  );
}

export default PropertyCard;