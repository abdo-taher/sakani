import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  BedDouble,
  Bath,
  Layers,
  Ruler,
  Paintbrush,
  Sofa,
  Building2,
  Video,
  CheckCircle2,
  ImageIcon,
  Tag,
  Home,
  X,
  ZoomIn,
} from "lucide-react";
import usePageTitle from "../hooks/usePageTitle";
import { getPropertyById, recordView } from "../services/propertyService";
import { createReservation, checkReservation } from "../services/reservationService";
import { formatPhone, getPhoneError } from "../utils/phoneValidator";
import { COFFEE } from "../constants/constants";
import { errorToast } from "../utils/toast";
import { SAMPLE_IMG, fmtPrice } from "../utils/helpers";
import VideoThumb from "../components/VideoThumb";
import RelatedPropertiesSection from "../components/RelatedPropertiesSection";

const STATUS_MAP = {
  available: { label: "متاح", color: "#16A34A", bg: "#DCFCE7" },
  reserved: { label: "محجوز", color: "#F59E0B", bg: "#FEF3C7" },
  sold: { label: "تم البيع", color: "#DC2626", bg: "#FEE2E2" },
  rented: { label: "تم التأجير", color: "#2563EB", bg: "#DBEAFE" },
  0: { label: "متاح", color: "#16A34A", bg: "#DCFCE7" },
};

const FINISHING_MAP = {
  super_lux: "سوبر لوكس",
  lux: "لوكس",
  semi_finished: "نصف تشطيب",
  red_brick: "طوب أحمر",
};

const FURNISHING_MAP = {
  furnished: "مفروش",
  unfurnished: "غير مفروش",
};

const ROOM_STATUS_MAP = {
  available: { label: "متاح", color: "#16A34A", bg: "#DCFCE7" },
  reserved: { label: "محجوز", color: "#F59E0B", bg: "#FEF3C7" },
  rented: { label: "مؤجر", color: "#2563EB", bg: "#DBEAFE" },
};

function MediaLightbox({ media, initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const touchStart = useRef(null);
  const touchDelta = useRef(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => (i + 1) % media.length);
      if (e.key === "ArrowRight") setIndex((i) => (i - 1 + media.length) % media.length);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [media.length, onClose]);

  const onTouchStart = useCallback((e) => {
    touchStart.current = e.touches[0].clientX;
    touchDelta.current = 0;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (touchStart.current != null) {
      touchDelta.current = e.touches[0].clientX - touchStart.current;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (Math.abs(touchDelta.current) > 50) {
      if (touchDelta.current > 0) {
        setIndex((i) => (i - 1 + media.length) % media.length);
      } else {
        setIndex((i) => (i + 1) % media.length);
      }
    }
    touchStart.current = null;
    touchDelta.current = 0;
  }, [media.length]);

  const current = media[index];
  const hasMultiple = media.length > 1;

  function renderMediaContent() {
    if (current.type === "video") {
      return (
        <video
          key={current.url}
          src={current.url}
          controls
          autoPlay
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      );
    }
    return (
      <img
        src={current.url}
        alt=""
        className="max-w-full max-h-full object-contain rounded-lg select-none"
        draggable={false}
      />
    );
  }

  function renderNavButtons() {
    if (!hasMultiple) return null;
    return (
      <>
        <button
          onClick={() => setIndex((i) => (i + 1) % media.length)}
          className="absolute left-2 sm:left-5 top-[40%] sm:top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/30 transition"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={() => setIndex((i) => (i - 1 + media.length) % media.length)}
          className="absolute right-2 sm:right-5 top-[40%] sm:top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/30 transition"
        >
          <ChevronRight size={24} />
        </button>
      </>
    );
  }

  function renderThumbnailStrip() {
    if (!hasMultiple) return null;
    return (
      <div className="flex items-center justify-center gap-2 pb-4 sm:pb-6 px-4 shrink-0" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        {media.map((m, idx) => {
          const isActive = idx === index;
          const borderClass = isActive ? "border-white" : "border-white/30 opacity-60";
          if (m.type === "video") {
            return (
              <button key={idx} onClick={() => setIndex(idx)} className={`shrink-0 w-12 h-10 sm:w-14 sm:h-12 rounded-lg overflow-hidden border-2 transition ${borderClass}`}>
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <Video size={12} color="white" />
                </div>
              </button>
            );
          }
          return (
            <button key={idx} onClick={() => setIndex(idx)} className={`shrink-0 w-12 h-10 sm:w-14 sm:h-12 rounded-lg overflow-hidden border-2 transition ${borderClass}`}>
              <img src={m.url} alt="" className="w-full h-full object-cover" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex flex-col"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center justify-between px-3 py-3 sm:px-6 sm:py-4 shrink-0" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <button onClick={onClose} className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition">
          <X size={22} />
        </button>
        <span className="text-white/70 text-xs sm:text-sm font-bold">
          {index + 1} / {media.length}
        </span>
        <div className="w-10 h-10 sm:w-11 sm:h-11" />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-12 pb-4 sm:pb-8 min-h-0">
        {renderMediaContent()}
      </div>

      {renderNavButtons()}
      {renderThumbnailStrip()}
    </div>
  );
}

function PublicPropertyDetail() {
  usePageTitle("تفاصيل العقار — سكني");
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [phoneError, setPhoneError] = useState("");
  const [alreadyReserved, setAlreadyReserved] = useState(false);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reserveSuccess, setReserveSuccess] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [reservationType, setReservationType] = useState("property");
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    try {
      const response = await getPropertyById(id);
      setProperty(response.data);
      recordView(id).catch(() => {});
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      if (status === 404) {
        setError("العقار غير موجود");
      } else {
        setError("تعذر تحميل بيانات العقار");
      }
    } finally {
      setLoading(false);
    }
  };

  const checkIfReserved = async (phone) => {
    if (!phone || phone.length < 11) return;
    setChecking(true);
    try {
      const res = await checkReservation(property.id, phone, selectedRoomId);
      setAlreadyReserved(res.reserved);
    } catch {
      setAlreadyReserved(false);
    } finally {
      setChecking(false);
    }
  };

  const handleReserve = async () => {
    const err = getPhoneError(form.phone);
    if (err) {
      setPhoneError(err);
      return;
    }
    if (!form.name.trim()) {
      errorToast("الاسم مطلوب");
      return;
    }
    setPhoneError("");
    if (alreadyReserved) return;

    setSubmitting(true);
    try {
      await createReservation({
        property_id: property.id,
        room_id: selectedRoomId,
        name: form.name,
        phone: form.phone,
        message: form.message,
      });
      setReserveSuccess(true);
      setForm({ name: "", phone: "", message: "" });
    } catch {
      errorToast("حدث خطأ أثناء إرسال طلب الحجز");
    } finally {
      setSubmitting(false);
    }
  };

  const getRoomsArray = () => {
    if (Array.isArray(property.rooms)) return property.rooms;
    if (Array.isArray(property.detailed_rooms)) return property.detailed_rooms;
    return [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold" style={{ color: COFFEE.mid }}>جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-stone-300" />
          <h2 className="text-xl font-bold mb-2" style={{ color: COFFEE.mid }}>{error}</h2>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 rounded-lg text-white font-bold"
            style={{ background: COFFEE.gold }}
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  if (!property) return null;

  const images = (property.images || [])
    .filter((img) => (img.media_type || "image") === "image" && !img.caption)
    .map((img) => img.image_url);

  const videos = (property.images || [])
    .filter((img) => img.media_type === "video")
    .map((img) => img.image_url);

  if (videos.length === 0 && property.video_url) {
    videos.push(property.video_url);
  }

  const media = [
    ...images.map((url) => ({ type: "image", url })),
    ...videos.map((url) => ({ type: "video", url })),
  ];

  if (media.length === 0) {
    media.push({ type: "image", url: SAMPLE_IMG(property.id) });
  }

  const currentMedia = media[mediaIndex] || media[0];
  const statusInfo = STATUS_MAP[property.status] || STATUS_MAP.available;
  const isRent = property.category?.slug === "rent";
  const hasMultipleMedia = media.length > 1;

  function renderBreadcrumb() {
    const crumbs = [];

    crumbs.push(
      <button key="home" onClick={() => navigate("/")} className="flex items-center gap-1 hover:underline hover:opacity-80 transition shrink-0">
        <Home className="w-3.5 h-3.5" /> الرئيسية
      </button>
    );
    crumbs.push(<ChevronLeft key="sep-home" className="w-2.5 h-2.5 shrink-0" />);

    if (property.category?.slug === "rent") {
      crumbs.push(
        <button key="rent" onClick={() => navigate("/rent")} className="hover:underline hover:opacity-80 transition">الإيجار</button>
      );
      crumbs.push(<ChevronLeft key="sep-rent" className="w-2.5 h-2.5" />);
      if (property.location?.name) {
        crumbs.push(
          <button key="loc" onClick={() => navigate(`/rent/${encodeURIComponent(property.location.name)}`)} className="hover:underline hover:opacity-80 transition">{property.location.name}</button>
        );
        crumbs.push(<ChevronLeft key="sep-loc" className="w-2.5 h-2.5" />);
      }
    } else if (property.category?.slug === "buy") {
      crumbs.push(
        <button key="buy" onClick={() => navigate("/buy")} className="hover:underline hover:opacity-80 transition">البيع</button>
      );
      crumbs.push(<ChevronLeft key="sep-buy" className="w-2.5 h-2.5" />);
    }

    crumbs.push(
      <span key="title" className="font-bold shrink-0" style={{ color: COFFEE.dark }}>{property.title}</span>
    );

    return (
      <nav className="flex items-center gap-1.5 text-[11px] sm:text-sm overflow-x-auto pb-1 whitespace-nowrap" style={{ color: COFFEE.stone }}>
        {crumbs}
      </nav>
    );
  }

  function renderTitleAndStatus() {
    return (
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold leading-tight break-words" style={{ color: COFFEE.dark }}>
            {property.title}
          </h1>
          <p className="flex items-center gap-1.5 mt-1 sm:mt-1.5 text-[11px] sm:text-sm" style={{ color: COFFEE.mid }}>
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{property.location?.name}</span>
          </p>
        </div>
        <div
          className="px-2.5 py-1 sm:px-4 sm:py-2 rounded-xl font-bold text-[11px] sm:text-sm shrink-0"
          style={{ background: statusInfo.bg, color: statusInfo.color }}
        >
          {statusInfo.label}
        </div>
      </div>
    );
  }

  function renderMainMedia() {
    function renderMediaType() {
      if (currentMedia.type === "video") {
        return (
          <video key={currentMedia.url} src={currentMedia.url} controls preload="none" className="w-full h-full object-cover" />
        );
      }
      return (
        <img src={currentMedia.url} alt={property.title} loading="lazy" className="w-full h-full object-cover" />
      );
    }

    function renderZoomOverlay() {
      return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 flex items-center justify-center backdrop-blur-sm opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <ZoomIn size={18} className="text-white" />
          </div>
        </div>
      );
    }

    function renderCarouselArrows() {
      if (!hasMultipleMedia) return null;
      return (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setMediaIndex((i) => (i + 1) % media.length); }}
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setMediaIndex((i) => (i - 1 + media.length) % media.length); }}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition"
          >
            <ChevronRight size={20} />
          </button>
        </>
      );
    }

    function renderCounter() {
      if (!hasMultipleMedia) return null;
      return (
        <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full font-bold">
          {mediaIndex + 1} / {media.length}
        </div>
      );
    }

    function renderVideoBadge() {
      if (currentMedia.type !== "video") return null;
      return (
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-red-600 text-white text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full font-bold flex items-center gap-1">
          <Video size={12} /> فيديو
        </div>
      );
    }

    return (
      <div
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-100 aspect-[4/3] sm:aspect-[16/10] cursor-pointer group"
        style={{ touchAction: "manipulation" }}
        onClick={() => setLightboxOpen(true)}
      >
        {renderMediaType()}
        {renderZoomOverlay()}
        {renderCarouselArrows()}
        {renderCounter()}
        {renderVideoBadge()}
      </div>
    );
  }

  function renderThumbnails() {
    if (!hasMultipleMedia) return null;
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {media.map((m, idx) => {
          const isActive = idx === mediaIndex;
          const borderClass = isActive ? "border-amber-600" : "border-transparent";
          if (m.type === "video") {
            return (
              <button key={idx} onClick={() => setMediaIndex(idx)} className={`shrink-0 w-16 h-14 sm:w-20 sm:h-16 rounded-xl overflow-hidden border-2 transition min-h-[44px] ${borderClass}`}>
                <div className="relative w-full h-full overflow-hidden bg-black">
                  <VideoThumb src={m.url} className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video size={14} color="white" />
                  </div>
                </div>
              </button>
            );
          }
          return (
            <button key={idx} onClick={() => setMediaIndex(idx)} className={`shrink-0 w-16 h-14 sm:w-20 sm:h-16 rounded-xl overflow-hidden border-2 transition min-h-[44px] ${borderClass}`}>
              <img src={m.url} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          );
        })}
      </div>
    );
  }

  function renderDescription() {
    if (!property.description) return null;
    return (
      <div>
        <h3 className="font-bold mb-2 sm:mb-3 text-sm sm:text-base" style={{ color: COFFEE.dark }}>الوصف</h3>
        <p className="leading-relaxed text-xs sm:text-sm" style={{ color: COFFEE.mid }}>{property.description}</p>
      </div>
    );
  }

  function renderAmenities() {
    if (!property.amenities || property.amenities.length <= 0) return null;
    return (
      <div>
        <h3 className="font-bold mb-2 sm:mb-3 text-sm sm:text-base" style={{ color: COFFEE.dark }}>المميزات والمرافق</h3>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {property.amenities.map((a) => (
            <span key={a.id} className="px-2.5 py-1 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-sm font-bold" style={{ background: COFFEE.cream, color: COFFEE.dark }}>
              {a.name}
            </span>
          ))}
        </div>
      </div>
    );
  }

  function renderTags() {
    if (!property.tags || property.tags.length <= 0) return null;
    return (
      <div>
        <h3 className="font-bold mb-2 sm:mb-3 text-sm sm:text-base" style={{ color: COFFEE.dark }}>الوسوم</h3>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {property.tags.map((t) => (
            <span key={t.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-sm font-bold" style={{ background: COFFEE.gold, color: "white" }}>
              <Tag size={13} />
              {t.name}
            </span>
          ))}
        </div>
      </div>
    );
  }

  function renderRoomCard(room) {
    const roomStatus = ROOM_STATUS_MAP[room.status] || ROOM_STATUS_MAP.available;
    const roomImages = room.room_images || room.roomImages || [];
    const primaryImg = roomImages.find((img) => img.is_primary) || roomImages[0];
    const isSelected = selectedRoomId === room.id;
    const isAvailable = room.status === "available";

    function handleRoomClick() {
      if (!isAvailable) return;
      setSelectedRoomId(isSelected ? null : room.id);
      setReserveSuccess(false);
      setAlreadyReserved(false);
    }

    function renderRoomImage() {
      if (primaryImg) {
        return (
          <img src={primaryImg.image_url} alt={room.name} className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0" />
        );
      }
      return (
        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center shrink-0" style={{ background: COFFEE.cream }}>
          <ImageIcon size={22} color={COFFEE.gold} />
        </div>
      );
    }

    function renderRoomArea() {
      if (room.area <= 0) return null;
      return <p className="text-[10px] sm:text-xs mt-1" style={{ color: COFFEE.mid }}>{room.area} م²</p>;
    }

    function renderRoomDescription() {
      if (!room.description) return null;
      return <p className="text-[10px] sm:text-xs mt-1 line-clamp-2" style={{ color: COFFEE.mid }}>{room.description}</p>;
    }

    function renderSelectButton() {
      if (!isAvailable) return null;
      return (
        <div className="mt-3 text-center">
          <span
            className="inline-block text-[11px] sm:text-xs font-bold px-3 sm:px-4 py-2 sm:py-1.5 rounded-full transition min-h-[36px] leading-[20px]"
            style={{
              background: isSelected ? COFFEE.gold : "rgba(204,154,58,0.1)",
              color: isSelected ? COFFEE.dark : COFFEE.gold,
            }}
          >
            {isSelected ? "تم التحديد ✓" : "اضغط لاختيار هذه الغرفة"}
          </span>
        </div>
      );
    }

    return (
      <div
        key={room.id}
        className={`rounded-2xl border-2 p-3 sm:p-4 transition cursor-pointer ${
          isSelected ? "ring-2 ring-amber-400" : "hover:shadow-md"
        }`}
        style={{
          borderColor: isSelected ? COFFEE.gold : "#f0ebe4",
          background: isSelected ? "rgba(204,154,58,0.05)" : "white",
        }}
        onClick={handleRoomClick}
      >
        <div className="flex gap-2.5 sm:gap-3">
          {renderRoomImage()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
              <p className="font-bold text-sm sm:text-base" style={{ color: COFFEE.dark }}>{room.name}</p>
              <span className="px-1.5 py-0.5 sm:px-2 rounded text-[10px] font-bold" style={{ background: roomStatus.bg, color: roomStatus.color }}>
                {roomStatus.label}
              </span>
            </div>
            <p className="text-base sm:text-lg font-extrabold" style={{ color: COFFEE.gold }}>
              {fmtPrice(room.price)}
              <span className="text-[10px] sm:text-xs font-normal" style={{ color: COFFEE.mid }}> / شهر</span>
            </p>
            {renderRoomArea()}
            {renderRoomDescription()}
          </div>
        </div>
        {renderSelectButton()}
      </div>
    );
  }

  function renderRoomsSection() {
    if (!isRent) return null;
    if (!property.has_detailed_rooms) return null;
    const rooms = getRoomsArray();
    if (rooms.length <= 0) return null;
    return (
      <div>
        <h3 className="font-bold mb-3 text-sm sm:text-base" style={{ color: COFFEE.dark }}>الغرف المتاحة</h3>
        <div className="grid gap-3">
          {rooms.map((room) => renderRoomCard(room))}
        </div>
      </div>
    );
  }

  function renderPriceBox() {
    if (isRent && property.has_detailed_rooms) {
      const rooms = getRoomsArray();
      let priceText = "اتصل للسعر";
      let subtitle = null;

      if (selectedRoomId) {
        const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
        if (selectedRoom && selectedRoom.price > 0) {
          priceText = fmtPrice(selectedRoom.price);
        }
        subtitle = <p className="text-[10px] sm:text-xs mt-1" style={{ color: COFFEE.mid }}>الإيجار الشهري</p>;
      } else {
        const prices = rooms.map((r) => r.price).filter((p) => p && p > 0);
        if (prices.length > 0) {
          priceText = fmtPrice(Math.min(...prices));
        } else if (property.price && property.price > 0) {
          priceText = fmtPrice(property.price);
        }
      }

      const label = selectedRoomId ? "سعر الغرفة المختارة" : "يبدأ من";

      return (
        <div className="rounded-2xl p-4 sm:p-5 lg:p-6 text-center" style={{ background: "#FBF3DF" }}>
          <p className="text-[11px] sm:text-sm font-bold mb-1" style={{ color: COFFEE.mid }}>{label}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold" style={{ color: COFFEE.dark }}>{priceText}</p>
          {subtitle}
        </div>
      );
    }

    const label = isRent ? "الإيجار الشهري" : "السعر";
    const priceText = (property.price && property.price > 0) ? fmtPrice(property.price) : "اتصل للسعر";

    return (
      <div className="rounded-2xl p-4 sm:p-5 lg:p-6 text-center" style={{ background: "#FBF3DF" }}>
        <p className="text-[11px] sm:text-sm font-bold mb-1" style={{ color: COFFEE.mid }}>{label}</p>
        <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold" style={{ color: COFFEE.dark }}>{priceText}</p>
      </div>
    );
  }

  function renderInfoCards() {
    const items = [
      { icon: Layers, label: "القسم", value: property.category?.name },
      { icon: Building2, label: "نوع العقار", value: property.propertyType?.name },
      { icon: MapPin, label: "المكان", value: property.location?.name },
      { icon: BedDouble, label: "الغرف", value: property.rooms },
      { icon: Bath, label: "الحمامات", value: property.bathrooms },
      { icon: Layers, label: "الدور", value: property.floor },
      { icon: Paintbrush, label: "التشطيب", value: FINISHING_MAP[property.finishing] || property.finishing },
      { icon: Sofa, label: "التأثيث", value: FURNISHING_MAP[property.furnishing] || property.furnishing },
    ];

    if (!isRent && property.area) {
      items.splice(3, 0, { icon: Ruler, label: "المساحة", value: `${property.area} م²` });
    }

    const visible = items.filter((item) => item.value != null && item.value !== "" && item.value !== 0);

    return (
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 lg:gap-3">
        {visible.map((item, idx) => (
          <div key={idx} className="rounded-xl sm:rounded-2xl p-2 sm:p-2.5 lg:p-3 border flex items-start gap-1.5 sm:gap-2" style={{ borderColor: "#f0ebe4", background: "white" }}>
            <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: COFFEE.cream }}>
              <item.icon size={12} color={COFFEE.gold} />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-bold" style={{ color: COFFEE.mid }}>{item.label}</p>
              <p className="text-[10px] sm:text-xs lg:text-sm font-bold truncate" style={{ color: COFFEE.dark }}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderReservationTypeToggle() {
    if (!isRent) return null;
    if (!property.has_detailed_rooms) return null;
    const rooms = getRoomsArray();
    const availableRooms = rooms.filter((r) => r.status === "available");
    if (availableRooms.length <= 0) return null;

    return (
      <div className="flex gap-2 mb-3 sm:mb-4">
        <button
          onClick={() => { setReservationType("property"); setSelectedRoomId(null); setReserveSuccess(false); setAlreadyReserved(false); }}
          className="flex-1 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold border-2 transition"
          style={{
            borderColor: reservationType === "property" ? COFFEE.gold : "#f0ebe4",
            background: reservationType === "property" ? COFFEE.gold : "white",
            color: reservationType === "property" ? COFFEE.darkest : COFFEE.mid,
          }}
        >
          حجز بالشقة
        </button>
        <button
          onClick={() => { setReservationType("room"); setReserveSuccess(false); setAlreadyReserved(false); }}
          className="flex-1 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold border-2 transition"
          style={{
            borderColor: reservationType === "room" ? COFFEE.gold : "#f0ebe4",
            background: reservationType === "room" ? COFFEE.gold : "white",
            color: reservationType === "room" ? COFFEE.darkest : COFFEE.mid,
          }}
        >
          حجز بالغرفة
        </button>
      </div>
    );
  }

  function renderReservationForm() {
    function renderSuccessMessage() {
      if (!reserveSuccess) return null;
      return (
        <div className="text-center py-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#DCFCE7" }}>
            <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: "#16A34A" }} />
          </div>
          <h3 className="font-extrabold text-base sm:text-lg mb-2" style={{ color: COFFEE.dark }}>تم إرسال طلب الحجز</h3>
          <p className="text-xs sm:text-sm" style={{ color: COFFEE.mid }}>سنتواصل معك في أقرب وقت</p>
        </div>
      );
    }

    function renderPhoneMessages() {
      if (phoneError) {
        return <p className="text-red-500 text-[10px] sm:text-xs mt-1 font-semibold">{phoneError}</p>;
      }
      if (alreadyReserved) {
        return <p className="text-amber-600 text-[10px] sm:text-xs mt-1 font-semibold">لقد قمت بحجز هذا العقار بالفعل</p>;
      }
      if (checking) {
        return <p className="text-stone-400 text-[10px] sm:text-xs mt-1">جاري التحقق...</p>;
      }
      return null;
    }

    function renderRoomPrompt() {
      if (!isRent) return null;
      if (!property.has_detailed_rooms) return null;
      if (reservationType !== "room") return null;
      if (selectedRoomId) return null;
      return (
        <p className="text-center text-xs sm:text-sm mt-3" style={{ color: COFFEE.stone }}>
          اختر غرفة من القائمة أعلاه ثم أكمل بيانات الحجز
        </p>
      );
    }

    function renderFormFields() {
      if (reserveSuccess) return null;

      const shouldShowForm = !isRent || !property.has_detailed_rooms || reservationType === "property" || !!selectedRoomId;
      if (!shouldShowForm) return null;

      const phoneInputClass = `w-full border rounded-xl px-3 py-3 sm:px-4 sm:py-3 text-sm outline-none focus:ring-2 ${phoneError ? "border-red-400" : alreadyReserved ? "border-amber-400" : ""}`;
      const phoneInputStyle = (!phoneError && !alreadyReserved) ? { borderColor: "#f0ebe4" } : {};

      const submitLabel = alreadyReserved ? "تم الحجز بالفعل" : submitting ? "جاري الإرسال..." : "إرسال طلب الحجز";
      const submitBg = alreadyReserved ? "#16A34A" : COFFEE.gold;
      const submitColor = alreadyReserved ? "#fff" : COFFEE.darkest;

      return (
        <div className="space-y-2.5 sm:space-y-3">
          <input
            type="text"
            placeholder="الاسم الكامل"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded-xl px-3 py-3 sm:px-4 sm:py-3 text-sm outline-none focus:ring-2"
            style={{ borderColor: "#f0ebe4" }}
          />

          <div>
            <input
              type="tel"
              placeholder="01xxxxxxxxx"
              value={form.phone}
              dir="ltr"
              onChange={(e) => {
                const val = formatPhone(e.target.value);
                setForm({ ...form, phone: val });
                if (phoneError) setPhoneError(getPhoneError(val) || "");
                if (alreadyReserved) setAlreadyReserved(false);
              }}
              onBlur={() => checkIfReserved(form.phone)}
              className={phoneInputClass}
              style={phoneInputStyle}
            />
            {renderPhoneMessages()}
          </div>

          <textarea
            placeholder="ملاحظات (اختياري)"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            rows={2}
            className="w-full border rounded-xl px-3 py-3 sm:px-4 sm:py-3 text-sm outline-none focus:ring-2 resize-none"
            style={{ borderColor: "#f0ebe4" }}
          />

          <button
            onClick={handleReserve}
            disabled={submitting || alreadyReserved}
            className="w-full py-3 sm:py-3.5 rounded-xl font-bold text-sm transition hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
            style={{ backgroundColor: submitBg, color: submitColor }}
          >
            {submitLabel}
          </button>
        </div>
      );
    }

    return (
      <>
        {renderSuccessMessage()}
        {renderFormFields()}
        {renderRoomPrompt()}
      </>
    );
  }

  function renderReservationBox() {
    return (
      <div className="rounded-2xl border p-3 sm:p-4 lg:p-5" style={{ borderColor: "#f0ebe4", background: "white" }}>
        <h3 className="font-extrabold mb-3 sm:mb-4 text-sm sm:text-base" style={{ color: COFFEE.dark }}>احجز الآن</h3>
        {renderReservationTypeToggle()}
        {renderReservationForm()}
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden" dir="rtl">
      <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 max-w-6xl mx-auto">
        {renderBreadcrumb()}
        {renderTitleAndStatus()}

        <div className="grid lg:grid-cols-5 gap-5 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-3 space-y-3 sm:space-y-4 lg:space-y-6">
            {renderMainMedia()}
            {renderThumbnails()}
            {renderDescription()}
            {renderAmenities()}
            {renderTags()}
            {renderRoomsSection()}
          </div>

          <div className="lg:col-span-2 space-y-4 sm:space-y-5 lg:space-y-6">
            {renderPriceBox()}
            {renderInfoCards()}
            {renderReservationBox()}
          </div>
        </div>
      </div>

      <RelatedPropertiesSection
        propertyId={property.id}
        favorites={null}
        onToggleFav={null}
      />

      {lightboxOpen && (
        <MediaLightbox
          media={media}
          initialIndex={mediaIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}

export default PublicPropertyDetail;
