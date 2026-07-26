import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Bed, Bath, Maximize, MapPin, PlayCircle, Eye, Star } from "lucide-react";
import { COFFEE } from "../constants/constants";
import { fmtPrice, SAMPLE_IMG } from "../utils/helpers";
import VideoThumb from "./VideoThumb";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

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
  const [imgErrors, setImgErrors] = useState({});
  const navigate = useNavigate();

  const media = React.useMemo(() => {
    if (!p.images || p.images.length === 0) return [];
    const images = p.images
      .filter(img => (img.media_type || 'image') === 'image' && !img.caption)
      .map(img => ({ type: 'image', url: img.image_url || img.path }));
    const videos = p.images
      .filter(img => img.media_type === 'video')
      .map(img => {
        const thumb = img.image_public_id
          ? p.images?.find(im => im.media_type === 'image' && im.caption === img.image_public_id)?.image_url
          : null;
        return { type: 'video', url: img.image_url, poster: thumb };
      });
    return [...images, ...videos];
  }, [p.images]);

  const hasMedia = media.length > 0;
  const hasVideo = media.some(m => m.type === 'video');

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

      {/* Image / Video Swiper */}
      <div className="relative w-full h-44 sm:h-52 overflow-hidden bg-stone-100">
        {hasMedia ? (
          <Swiper
            modules={[Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            spaceBetween={0}
            slidesPerView={1}
            className="w-full h-full showcase-card-swiper"
            dir="ltr"
          >
            {media.map((item, idx) => (
              <SwiperSlide key={idx}>
                <div className="w-full h-44 sm:h-52 relative">
                  {item.type === 'video' ? (
                    <>
                      <VideoThumb
                        src={item.url}
                        posterUrl={item.poster}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                          <PlayCircle className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <img
                      src={item.url}
                      alt={p.title}
                      onError={() => setImgErrors(prev => ({ ...prev, [idx]: true }))}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <img
            src={SAMPLE_IMG(p.id)}
            alt={p.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}

        {/* Status badge */}
        <div
          className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow z-10"
          style={{ backgroundColor: status.color }}
        >
          {status.text}
        </div>

        {/* Views */}
        {p.cached_views > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 text-white text-[11px] font-bold backdrop-blur-sm z-10">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none z-[5]" />

        {media.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-bold backdrop-blur-sm z-10">
            1 / {media.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <h3 className="font-extrabold text-base mb-1 truncate group-hover:text-amber-800 transition-colors" style={{ color: COFFEE.dark }}>
          {p.title}
        </h3>

        <div className="flex items-center gap-1 text-xs mb-3" style={{ color: "#9a9a9a" }}>
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{p.location?.name || "غير محدد"}</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs mb-3 border-t border-b py-2" style={{ borderColor: "#f2f2f2", color: "#777" }}>
          {p.rooms > 0 && (
            <div className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5" style={{ color: COFFEE.gold }} />
              {p.rooms}
            </div>
          )}
          {p.bathrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" style={{ color: COFFEE.gold }} />
              {p.bathrooms}
            </div>
          )}
          {!isRent && p.area > 0 && (
            <div className="flex items-center gap-1">
              <Maximize className="w-3.5 h-3.5" style={{ color: COFFEE.gold }} />
              {p.area} م²
            </div>
          )}
          {/* Add spacer if no stats to show proper spacing */}
          {(p.rooms <= 0) && (p.bathrooms <= 0) && (p.area <= 0 || isRent) && (
            <span>&nbsp;</span>
          )}
        </div>

        {/* Price + available rooms */}
        <div className="flex items-center justify-between">
          {isRent && p.has_detailed_rooms && (() => {
            const rooms = Array.isArray(p.rooms) ? p.rooms : Array.isArray(p.detailed_rooms) ? p.detailed_rooms : [];
            const prices = rooms.map(r => r.price).filter(price => price && price > 0);
            return prices.length > 0 ? (
              <span className="font-extrabold text-lg" style={{ color: COFFEE.mid }}>
                يبدأ من {fmtPrice(Math.min(...prices))}
              </span>
            ) : p.price && p.price > 0 ? (
              <span className="font-extrabold text-lg" style={{ color: COFFEE.mid }}>
                {fmtPrice(p.price)}
              </span>
            ) : (
              <span className="font-bold text-sm" style={{ color: "#888" }}>
                اتصل للسعر
              </span>
            );
          })() || (p.price && p.price > 0 ? (
            <span className="font-extrabold text-lg" style={{ color: COFFEE.mid }}>
              {fmtPrice(p.price)}
            </span>
          ) : (
            <span className="font-bold text-sm" style={{ color: "#888" }}>
              اتصل للسعر
            </span>
          ))}
          {p.rent_duration != null && <span className="text-xs" style={{ color: "#aaa" }}>/{p.rent_duration}</span>}
        </div>

        {/* {isRent && p.has_detailed_rooms && (() => {
          const rooms = Array.isArray(p.rooms) ? p.rooms : Array.isArray(p.detailed_rooms) ? p.detailed_rooms : [];
          const availableCount = rooms.filter(r => r.status === "available").length;
          return availableCount > 0 && (
            <p className="text-xs mt-1 font-bold" style={{ color: COFFEE.gold }}>
              {availableCount} غرف متاحة
            </p>
          );
        })()} */}
      </div>
    </div>
  );
}

export default PropertyShowcaseCard;
