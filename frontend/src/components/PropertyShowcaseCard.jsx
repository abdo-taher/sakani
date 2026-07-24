import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Bed, Bath, Maximize, MapPin, PlayCircle, Eye, Star } from "lucide-react";
import { COFFEE } from "../constants/constants";
import { fmtPrice, SAMPLE_IMG } from "../utils/helpers";
import VideoThumb from "./VideoThumb";

const CATEGORY_CONFIG = {
  rent: {
    label: "إيجار",
    color: "#16A34A",
    bg: "#DCFCE7",
    border: "#BBF7D0",
    icon: "🏠",
  },
  buy: {
    label: "شراء",
    color: "#2563EB",
    bg: "#DBEAFE",
    border: "#BFDBFE",
    icon: "🛒",
  },
  sell: {
    label: "بيع",
    color: "#D97706",
    bg: "#FEF3C7",
    border: "#FDE68A",
    icon: "🏷️",
  },
};

const STATUS_LABELS = {
  available: { text: "متاح", color: "#2E7D32" },
  reserved: { text: "محجوز", color: "#B08D57" },
  sold: { text: "تم البيع", color: "#8B1E1E" },
  rented: { text: "تم التأجير", color: "#8B1E1E" },
};

function PropertyShowcaseCard({ p, isFav, onToggleFav, showBadge = true }) {
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

  const hasVideo = (p.images && p.images.some(img => img.media_type === "video")) || p.video_url;
  const firstVideo = p.images && p.images.find(img => img.media_type === "video");
  const firstImage = p.images && p.images.find(img => (img.media_type || "image") === "image" && !img.caption);

  const mainImage = !imgError && firstImage ? firstImage.image_url || firstImage.path : null;
  const mainVideo = hasVideo ? (firstVideo ? firstVideo.image_url : p.video_url) : null;

  const videoThumbnail = firstVideo?.image_public_id
    ? p.images?.find(
        (img) => img.media_type === "image" && img.caption === firstVideo.image_public_id
      )?.image_url
    : null;

  const status = STATUS_LABELS[p.status] || STATUS_LABELS.available;
  const category = CATEGORY_CONFIG[p.category?.slug] || CATEGORY_CONFIG.sell;
  const isFeatured = p.featured;
  const isRent = p.category?.slug === "rent";

  return (
    <div
      onClick={() => navigate(`/property/${p.id}`)}
      className="group relative bg-white rounded-2xl overflow-hidden border-2 border-transparent transition-all duration-300 cursor-pointer hover:-translate-y-1.5 hover:shadow-2xl"
      dir="rtl"
    >
      {/* Category Badge */}
      {showBadge && (
        <div
          className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-md backdrop-blur-sm"
          style={{
            backgroundColor: category.bg,
            color: category.color,
            border: `1.5px solid ${category.border}`,
          }}
        >
          <span className="text-sm">{category.icon}</span>
          {category.label}
        </div>
      )}

      {/* Featured Badge */}
      {isFeatured && (
        <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1 bg-amber-400 text-amber-900 shadow-md">
          <Star className="w-3 h-3 fill-current" />
          مميز
        </div>
      )}

      {/* Image / Video */}
      <div className="relative w-full h-52 overflow-hidden bg-stone-100">
        {mainVideo ? (
          <VideoThumb
            src={mainVideo}
            posterUrl={videoThumbnail}
            alt={p.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : mainImage ? (
          <img
            src={mainImage}
            alt={p.title}
            onError={() => setImgError(true)}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <img
            src={SAMPLE_IMG(p.id)}
            alt={p.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}

        {/* Video play overlay */}
        {hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
              <PlayCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        )}

        {/* Status badge */}
        <div
          className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow"
          style={{ backgroundColor: status.color }}
        >
          {status.text}
        </div>

        {/* Views */}
        {p.cached_views > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 text-white text-[11px] font-bold backdrop-blur-sm">
            <Eye className="w-3 h-3" />
            {p.cached_views}
          </div>
        )}

        {/* Heart */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav && onToggleFav(p.id);
          }}
          className="absolute top-3 left-12 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-110 transition-transform z-10"
        >
          <Heart className="w-4 h-4" fill={isFav ? "#e0435c" : "none"} style={{ color: isFav ? "#e0435c" : COFFEE.gold }} />
        </button>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-extrabold text-base mb-1 truncate group-hover:text-amber-800 transition-colors" style={{ color: COFFEE.dark }}>
          {p.title}
        </h3>

        <div className="flex items-center gap-1 text-xs mb-3" style={{ color: "#9a9a9a" }}>
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{p.location?.name || "غير محدد"}</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs mb-3 border-t border-b py-2" style={{ borderColor: "#f2f2f2", color: "#777" }}>
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
          {!isRent && p.area && p.area > 0 && (
            <div className="flex items-center gap-1">
              <Maximize className="w-3.5 h-3.5" style={{ color: COFFEE.gold }} />
              {p.area} م²
            </div>
          )}
        </div>

        {/* Price + available rooms */}
        <div className="flex items-center justify-between">
          {isRent && p.has_detailed_rooms && (() => {
            const rooms = Array.isArray(p.rooms) ? p.rooms : Array.isArray(p.detailed_rooms) ? p.detailed_rooms : [];
            return rooms.length > 0 ? (
              <span className="font-extrabold text-lg" style={{ color: COFFEE.mid }}>
                يبدأ من {fmtPrice(Math.min(...rooms.map(r => r.price || 0)))}
              </span>
            ) : (
              <span className="font-extrabold text-lg" style={{ color: COFFEE.mid }}>
                {fmtPrice(p.price || 0)}
              </span>
            );
          })() || (
            <span className="font-extrabold text-lg" style={{ color: COFFEE.mid }}>
              {fmtPrice(p.price || 0)}
            </span>
          )}
          {p.rent_duration && <span className="text-xs" style={{ color: "#aaa" }}>/{p.rent_duration}</span>}
        </div>

        {isRent && p.has_detailed_rooms && (() => {
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

export default PropertyShowcaseCard;
