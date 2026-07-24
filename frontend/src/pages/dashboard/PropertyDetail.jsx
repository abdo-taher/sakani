import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRight,
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
  ImageIcon,
  User,
  Phone,
  Calendar,
  Clock,
  BadgeCheck,
  Trash2,
  Loader2,
  Eye,
  Plus,
  Edit3,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import usePageTitle from "../../hooks/usePageTitle";
import { getPropertyById, updateProperty } from "../../services/propertyService";
import { deleteRoom } from "../../services/roomService";
import { updateReservation, deleteReservation } from "../../services/reservationService";
import { COFFEE } from "../../constants/constants";
import { successToast, errorToast } from "../../utils/toast";
import { confirmDelete } from "../../utils/confirm";
import { fmtPrice } from "../../utils/helpers";
import VideoThumb from "../../components/VideoThumb";

const STATUS_MAP = {
  available: { label: "متاح", color: "#16A34A", bg: "#DCFCE7" },
  reserved: { label: "محجوز", color: "#F59E0B", bg: "#FEF3C7" },
  sold: { label: "تم البيع", color: "#DC2626", bg: "#FEE2E2" },
  rented: { label: "تم التأجير", color: "#2563EB", bg: "#DBEAFE" },
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

const RESERVATION_STATUS_MAP = {
  pending: { label: "طلب جديد", bg: "#F5E6C8", text: "#8A6D1D" },
  contacted: { label: "تم التواصل", bg: "#DCEFE1", text: "#1F7A3F" },
};

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div
      className="rounded-2xl p-4 border flex items-start gap-3"
      style={{ borderColor: COFFEE.line, background: "white" }}
    >
      <span
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: COFFEE.cream }}
      >
        <Icon size={18} color={COFFEE.gold} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold mb-1" style={{ color: COFFEE.stone }}>
          {label}
        </p>
        <p className="font-bold truncate" style={{ color: COFFEE.dark }}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function PropertyDetail() {
  usePageTitle("تفاصيل العقار — سكني");
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mediaIndex, setMediaIndex] = useState(0);

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    try {
      const response = await getPropertyById(id);
      setProperty(response.data);
    } catch (error) {
      console.error(error);
      errorToast("تعذر تحميل بيانات العقار");
      navigate("/dashboard/properties");
    } finally {
      setLoading(false);
    }
  };

  const handleReservationStatus = async (reservationId, newStatus) => {
    try {
      await updateReservation(reservationId, { status: newStatus });
      setProperty((prev) => ({
        ...prev,
        reservations: prev.reservations.map((r) =>
          r.id === reservationId ? { ...r, status: newStatus } : r
        ),
      }));
      successToast("تم تحديث حالة الطلب");
    } catch {
      errorToast("تعذر تحديث الحالة");
    }
  };

  const handleDeleteReservation = async (reservationId) => {
    const confirmed = await confirmDelete("طلب الحجز");
    if (!confirmed) return;
    try {
      await deleteReservation(reservationId);
      setProperty((prev) => ({
        ...prev,
        reservations: prev.reservations.filter((r) => r.id !== reservationId),
      }));
      successToast("تم حذف طلب الحجز");
    } catch {
      errorToast("تعذر حذف طلب الحجز");
    }
  };

  const isRent = property?.category?.slug === "rent";

  const toggleDetailedRooms = async () => {
    try {
      await updateProperty(property.id, { has_detailed_rooms: !property.has_detailed_rooms });
      setProperty((prev) => ({ ...prev, has_detailed_rooms: !prev.has_detailed_rooms }));
      successToast(property.has_detailed_rooms ? "تم تعطيل الغرف بالتفصيل" : "تم تفعيل الغرف بالتفصيل");
    } catch {
      errorToast("تعذر تغيير الإعداد");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    const confirmed = await confirmDelete("الغرفة");
    if (!confirmed) return;
    try {
      await deleteRoom(roomId, property.id);
      setProperty((prev) => ({
        ...prev,
        rooms: (prev.rooms || []).filter((r) => r.id !== roomId),
      }));
      successToast("تم حذف الغرفة");
    } catch {
      errorToast("تعذر حذف الغرفة");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold" style={{ color: COFFEE.stone }}>
            جاري تحميل البيانات...
          </p>
        </div>
      </div>
    );
  }

  if (!property) return null;

  const images = (property.images || [])
    .filter((img) => (img.media_type || "image") === "image")
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
    media.push({ type: "image", url: "" });
  }

  const currentMedia = media[mediaIndex] || media[0];
  const statusInfo = STATUS_MAP[property.status] || STATUS_MAP.available;

  return (
    <div className="p-8 space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/properties")}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-stone-100 transition"
          >
            <ArrowRight size={22} color={COFFEE.dark} />
          </button>
          <div
            className="px-4 py-2 rounded-xl font-bold text-sm"
            style={{ background: statusInfo.bg, color: statusInfo.color }}
          >
            {statusInfo.label}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold bg-stone-100 text-stone-600">
            <Eye size={14} />
            {(property.cached_views ?? property.views ?? 0).toLocaleString()} مشاهدة
          </div>
        </div>
      </div>

      {/* Uploading Banner */}
      {property.is_uploading && (
        <div
          className="rounded-2xl p-4 flex items-center gap-3 border"
          style={{ background: "#FEF3C7", borderColor: "#FDE68A", color: "#92400E" }}
        >
          <Loader2 size={20} className="animate-spin shrink-0" />
          <div>
            <p className="font-bold text-sm">جاري رفع الوسائط في الخلفية</p>
            <p className="text-xs mt-0.5 opacity-75">لا يمكنك تعديل هذا العقار حتى اكتمال الرفع</p>
          </div>
        </div>
      )}

      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: COFFEE.dark }}>
          {property.title}
        </h1>
        <p className="text-sm mt-1" style={{ color: COFFEE.stone }}>
          {property.location?.name}
        </p>
      </div>

      {/* Media Slider + Details */}
      <div className="grid lg:grid-cols-5 gap-8">
        {/* Slider - 3 cols */}
        <div className="lg:col-span-3">
          <div className="relative rounded-3xl overflow-hidden bg-stone-100" style={{ aspectRatio: "16/10" }}>
            {currentMedia.type === "video" ? (
              <video
                key={currentMedia.url}
                src={currentMedia.url}
                controls
                preload="none"
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={currentMedia.url}
                alt={property.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            )}

            {media.length > 1 && (
              <>
                <button
                  onClick={() => setMediaIndex((i) => (i + 1) % media.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setMediaIndex((i) => (i - 1 + media.length) % media.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {media.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full font-bold">
                {mediaIndex + 1} / {media.length}
              </div>
            )}

            {currentMedia.type === "video" && (
              <div className="absolute top-3 right-3 bg-red-600 text-white text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
                <Video size={12} /> فيديو
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {media.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {media.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => setMediaIndex(idx)}
                  className={`shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition ${
                    idx === mediaIndex ? "border-amber-600" : "border-transparent"
                  }`}
                >
                  {m.type === "video" ? (
                    <div className="relative w-full h-full overflow-hidden bg-black">
                      <VideoThumb src={m.url} className="w-full h-full object-cover opacity-80" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video size={14} color="white" />
                      </div>
                    </div>
                  ) : (
                    <img src={m.url} alt="" loading="lazy" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div className="mt-6">
              <h3 className="font-bold mb-3" style={{ color: COFFEE.dark }}>
                الوصف
              </h3>
              <p className="leading-relaxed" style={{ color: COFFEE.stone }}>
                {property.description}
              </p>
            </div>
          )}

          {/* Amenities */}
          {property.amenities?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold mb-3" style={{ color: COFFEE.dark }}>
                المميزات والمرافق
              </h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((a) => (
                  <span
                    key={a.id}
                    className="px-4 py-2 rounded-xl text-sm font-bold"
                    style={{ background: COFFEE.cream, color: COFFEE.dark }}
                  >
                    {a.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Room Management - only for rent properties */}
          {isRent && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold" style={{ color: COFFEE.dark }}>
                  إدارة الغرف
                </h3>
                <button
                  onClick={toggleDetailedRooms}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition"
                  style={{
                    background: property.has_detailed_rooms ? "rgba(46,125,50,0.1)" : "rgba(156,163,175,0.1)",
                    color: property.has_detailed_rooms ? "#16A34A" : "#6B7280",
                  }}
                >
                  {property.has_detailed_rooms ? (
                    <ToggleRight size={20} />
                  ) : (
                    <ToggleLeft size={20} />
                  )}
                  غرف بالتفصيل
                </button>
              </div>

              {property.has_detailed_rooms && (
                <div
                  className="rounded-2xl border p-4"
                  style={{ borderColor: COFFEE.line, background: "white" }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold" style={{ color: COFFEE.stone }}>
                      {property.rooms?.length || 0} غرف
                    </p>
                    <button
                      onClick={() => navigate(`/dashboard/properties/${property.id}/rooms/create`)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition hover:brightness-110"
                      style={{ background: COFFEE.gold, color: COFFEE.dark }}
                    >
                      <Plus size={16} />
                      إضافة غرفة
                    </button>
                  </div>

                  {!property.rooms?.length ? (
                    <div className="text-center py-6">
                      <BedDouble size={32} color={COFFEE.gold} className="mx-auto mb-2" />
                      <p className="text-sm font-bold" style={{ color: COFFEE.stone }}>
                        لا توجد غرف بعد
                      </p>
                      <p className="text-xs mt-1" style={{ color: COFFEE.stone }}>
                        اضغط "إضافة غرفة" لإضافة غرفة جديدة
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {property.rooms.map((room) => {
                        const roomStatusMap = {
                          available: { label: "متاح", color: "#16A34A", bg: "#DCFCE7" },
                          reserved: { label: "محجوز", color: "#F59E0B", bg: "#FEF3C7" },
                          rented: { label: "مؤجر", color: "#2563EB", bg: "#DBEAFE" },
                        };
                        const roomStatus = roomStatusMap[room.status] || roomStatusMap.available;
                        const primaryImg = (room.room_images || room.roomImages || []).find(img => img.is_primary) || (room.room_images || room.roomImages || [])[0];

                        return (
                          <div
                            key={room.id}
                            className="flex items-center gap-4 p-3 rounded-xl border transition hover:shadow-sm"
                            style={{ borderColor: COFFEE.line }}
                          >
                            {primaryImg ? (
                              <img
                                src={primaryImg.image_url}
                                alt={room.name}
                                className="w-16 h-16 rounded-xl object-cover shrink-0"
                              />
                            ) : (
                              <div
                                className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: COFFEE.cream }}
                              >
                                <ImageIcon size={20} color={COFFEE.gold} />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold truncate" style={{ color: COFFEE.dark }}>
                                  {room.name}
                                </p>
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0"
                                  style={{ background: roomStatus.bg, color: roomStatus.color }}
                                >
                                  {roomStatus.label}
                                </span>
                              </div>
                              <p className="text-sm font-bold" style={{ color: COFFEE.gold }}>
                                {fmtPrice(room.price)} ج.م/شهر
                              </p>
                              {room.area && (
                                <p className="text-xs" style={{ color: COFFEE.stone }}>
                                  {room.area} م²
                                </p>
                              )}
                            </div>

                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => navigate(`/dashboard/properties/${property.id}/rooms/${room.id}/edit`)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center border transition hover:bg-stone-50"
                                style={{ borderColor: COFFEE.line }}
                              >
                                <Edit3 size={14} color={COFFEE.dark} />
                              </button>
                              <button
                                onClick={() => handleDeleteRoom(room.id)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center border border-red-200 text-red-500 transition hover:bg-red-50"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Details - 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price */}
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: "#FBF3DF" }}
          >
            <p className="text-sm font-bold mb-1" style={{ color: COFFEE.stone }}>
              السعر
            </p>
            <p className="text-3xl font-extrabold" style={{ color: COFFEE.dark }}>
              {fmtPrice(property.price)}
            </p>
          </div>

          {/* Property Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            <InfoCard icon={Layers} label="القسم" value={property.category?.name} />
            <InfoCard icon={Building2} label="نوع العقار" value={property.propertyType?.name} />
            <InfoCard icon={MapPin} label="المكان" value={property.location?.name} />
            <InfoCard icon={Ruler} label="المساحة" value={property.area ? `${property.area} م²` : null} />
            <InfoCard icon={BedDouble} label="الغرف" value={property.rooms} />
            <InfoCard icon={Bath} label="الحمامات" value={property.bathrooms} />
            <InfoCard icon={Layers} label="الدور" value={property.floor} />
            <InfoCard
              icon={Paintbrush}
              label="التشطيب"
              value={FINISHING_MAP[property.finishing] || property.finishing}
            />
            <InfoCard
              icon={Sofa}
              label="التأثيث"
              value={FURNISHING_MAP[property.furnishing] || property.furnishing}
            />
          </div>
        </div>
      </div>

      {/* Reservations */}
      <div>
        <h2 className="text-xl font-extrabold mb-4" style={{ color: COFFEE.dark }}>
          طلبات الحجز على هذا العقار
          {property.reservations?.length > 0 && (
            <span className="mr-2 text-sm font-bold" style={{ color: COFFEE.gold }}>
              ({property.reservations.length})
            </span>
          )}
        </h2>

        {!property.reservations?.length ? (
          <div
            className="rounded-2xl p-8 text-center border"
            style={{ borderColor: COFFEE.line, background: "white" }}
          >
            <Calendar size={40} color={COFFEE.gold} className="mx-auto mb-3" />
            <p className="font-bold" style={{ color: COFFEE.stone }}>
              لا توجد طلبات حجز بعد
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {property.reservations.map((reservation) => {
              const resStatus = RESERVATION_STATUS_MAP[reservation.status] || RESERVATION_STATUS_MAP.pending;
              return (
                <div
                  key={reservation.id}
                  className="rounded-2xl p-5 border"
                  style={{ borderColor: COFFEE.line, background: "white" }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: COFFEE.cream }}
                      >
                        <User size={18} color={COFFEE.gold} />
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: COFFEE.dark }}>
                          {reservation.name}
                        </p>
                        <p className="text-sm flex items-center gap-1" style={{ color: COFFEE.stone }}>
                          <Phone size={12} /> {reservation.phone}
                        </p>
                      </div>
                    </div>
                    <span
                      className="px-3 py-1 rounded-lg text-xs font-bold"
                      style={{ background: resStatus.bg, color: resStatus.text }}
                    >
                      {resStatus.label}
                    </span>
                  </div>

                  {reservation.message && (
                    <div
                      className="rounded-xl p-3 mb-4 text-sm"
                      style={{ background: COFFEE.cream, color: COFFEE.dark }}
                    >
                      {reservation.message}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs" style={{ color: COFFEE.stone }}>
                    <Clock size={12} />
                    {new Date(reservation.created_at).toLocaleDateString("ar-EG", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>

                  <div className="flex gap-2 mt-4">
                    {reservation.status !== "contacted" && (
                      <button
                        onClick={() => handleReservationStatus(reservation.id, "contacted")}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 flex items-center gap-1.5"
                      >
                        <BadgeCheck size={14} /> تم التواصل
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteReservation(reservation.id)}
                      className="px-4 py-2 rounded-xl text-sm font-bold text-red-600 border border-red-200 hover:bg-red-50 flex items-center gap-1.5"
                    >
                      <Trash2 size={14} /> حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default PropertyDetail;
