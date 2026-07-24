import React, { useState } from "react";

import {
  Heart,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  BedDouble,
  Bath,
  Layers,
  Sun,
  Sparkles,
  Tag,
} from "lucide-react";

import { COFFEE } from "../constants/constants";

import { SAMPLE_IMG, fmtPrice } from "../utils/helpers";


function PropertyModal({
  property,
  isFav,
  onToggleFav,
  onClose,
  onReserve,
}) {
  const [mediaIndex, setMediaIndex] = useState(0);
  if (!property) return null;

  const images = (property.images || [])
    .filter(img => (img.media_type || 'image') === 'image')
    .map(img => img.image_url);

  const videos = (property.images || [])
    .filter(img => img.media_type === 'video')
    .map(img => img.image_url);

  if (videos.length === 0 && property.video_url) {
    videos.push(property.video_url);
  }

  const media = [
    ...images.map(url => ({ type: 'image', url })),
    ...videos.map(url => ({ type: 'video', url })),
  ];

  if (media.length === 0) {
    media.push({ type: 'image', url: SAMPLE_IMG(property.id) });
  }

  const totalMedia = media.length;
  const currentMedia = media[mediaIndex] || media[0];
  const next = (e) => { e.stopPropagation(); setMediaIndex((i) => (i + 1) % totalMedia); };
  const prev = (e) => { e.stopPropagation(); setMediaIndex((i) => (i - 1 + totalMedia) % totalMedia); };

  const isAvailable = property.status === "available";

  const stats = [
    { icon: BedDouble, label: "الغرف", value: property.rooms },
    { icon: Bath, label: "الحمامات", value: property.bathrooms },
    { icon: Layers, label: "الدور", value: property.floor },
    { icon: Sun, label: "البلكونات", value: property.balconies },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-modalBackdropIn"
      style={{ backgroundColor: "rgba(20,12,8,0.72)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="animate-modalIn bg-white rounded-3xl overflow-hidden max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Media Area */}
        <div className="relative h-64 sm:h-96 w-full overflow-hidden group shrink-0">
          {currentMedia.type === 'video' ? (
            <video
              key={mediaIndex}
              src={currentMedia.url}
              controls
              autoPlay
              className="w-full h-full object-cover"
            />
          ) : (
            <img key={mediaIndex} src={currentMedia.url} alt={property.title} className="w-full h-full object-cover animate-fadePop" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          <button onClick={onClose} className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/85 flex items-center justify-center hover:rotate-90 transition-transform duration-300">
            <X className="w-5 h-5" style={{ color: COFFEE.dark }} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFav && onToggleFav(property.id); }}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/85 flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Heart className="w-4 h-4" fill={isFav ? "#e0435c" : "none"} style={{ color: isFav ? "#e0435c" : COFFEE.mid }} />
          </button>
          {totalMedia > 1 && (
            <>
              <button onClick={prev} className="absolute top-1/2 -translate-y-1/2 right-3 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center hover:scale-110 transition-transform">
                <ChevronRight className="w-5 h-5" style={{ color: COFFEE.dark }} />
              </button>
              <button onClick={next} className="absolute top-1/2 -translate-y-1/2 left-3 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center hover:scale-110 transition-transform">
                <ChevronLeft className="w-5 h-5" style={{ color: COFFEE.dark }} />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {media.map((m, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setMediaIndex(i); }}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{ width: i === mediaIndex ? "20px" : "6px", backgroundColor: i === mediaIndex ? COFFEE.gold : "rgba(255,255,255,0.7)" }}
                  />
                ))}
              </div>
            </>
          )}
          {/* Media counter */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white bg-black/50">
            {mediaIndex + 1} / {totalMedia}
          </div>
        </div>

        {/* المحتوى */}
        <div className="p-6 sm:p-8">

          {/* العنوان + الموقع + الحالة */}
          <div className="flex items-start justify-between gap-3 mb-2 animate-heroFade">
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-snug" style={{ color: COFFEE.dark }}>
              {property.title}
            </h2>

            {property.status && (
              <span
                className="shrink-0 text-xs font-bold px-3.5 py-2 rounded-full whitespace-nowrap"
                style={
                  isAvailable
                    ? { backgroundColor: "#DCFCE7", color: "#16A34A" }
                    : { backgroundColor: "#FEE2E2", color: "#DC2626" }
                }
              >
                {isAvailable ? "متاح" : property.status}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-stone-500 text-sm mb-6 animate-heroFade-1">
            <MapPin className="w-4 h-4 shrink-0" />
            <span>
              {property.location?.name}
              {property.category?.slug !== "rent" && property.area && ` · ${property.area} م²`}
            </span>
          </div>

          {/* الوصف */}
          {property.description && (
            <p className="text-stone-600 text-[15px] leading-8 mb-6 pb-6 border-b" style={{ borderColor: "#EADFD0" }}>
              {property.description}
            </p>
          )}

          {/* تاجات: نوع العقار / القسم / التشطيب */}
          {(property.property_type?.name || property.category?.name || property.finishing) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {property.property_type?.name && (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full bg-stone-100 text-stone-700">
                  <Tag className="w-4 h-4" style={{ color: COFFEE.gold }} />
                  {property.property_type.name}
                </span>
              )}
              {property.category?.name && (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full bg-stone-100 text-stone-700">
                  <Tag className="w-4 h-4" style={{ color: COFFEE.gold }} />
                  {property.category.name}
                </span>
              )}
              {property.finishing && (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full bg-stone-100 text-stone-700">
                  <Sparkles className="w-4 h-4" style={{ color: COFFEE.gold }} />
                  {property.finishing}
                </span>
              )}
            </div>
          )}

          {/* الإحصائيات */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
            {stats.map(({ icon: Icon, label, value }, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl py-5 px-2 bg-stone-50 border border-stone-100 text-center"
              >
                <Icon className="w-6 h-6" style={{ color: COFFEE.gold }} />
                <p className="font-extrabold text-2xl leading-none" style={{ color: COFFEE.dark }}>
                  {value ?? "—"}
                </p>
                <p className="text-sm text-stone-400 font-medium">{label}</p>
              </div>
            ))}
          </div>

          {/* المميزات */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="mb-7">
              <h3
                className="text-lg font-bold mb-3"
                style={{ color: COFFEE.dark }}
              >
                المميزات
              </h3>

              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <span
                    key={amenity.id}
                    className="px-4 py-2.5 rounded-full text-sm font-semibold"
                    style={{
                      backgroundColor: COFFEE.cream,
                      color: COFFEE.dark,
                    }}
                  >
                    ✓ {amenity.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* السعر + زر الحجز */}
          <div className="flex items-center justify-between flex-wrap gap-4 pt-6 border-t animate-heroFade-3" style={{ borderColor: "#EADFD0" }}>
            <div>
              <p className="text-sm text-stone-400 mb-1">
                {property.category?.slug === "rent" ? "الإيجار الشهري" : "السعر"}
              </p>
              <span className="font-extrabold text-3xl sm:text-4xl" style={{ color: COFFEE.gold }}>
                {fmtPrice(property.price)}
              </span>
            </div>

            <button
              onClick={onReserve}
              className="btn-shimmer flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-base hover:scale-105 transition-transform"
              style={{
                backgroundColor: COFFEE.gold,
                color: COFFEE.darkest,
              }}
            >
              احجز الآن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export default PropertyModal;
