import React from "react";
import {
  X,
  User,
  Phone,
  Home,
  MapPin,
  Layers,
  Maximize2,
  BedDouble,
  Bath,
  Building2,
  Paintbrush,
} from "lucide-react";

import Swal from "sweetalert2";

import { COFFEE } from "../../constants/constants";
import { updateReservation } from "../../services/reservationService";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0">
      <div className="flex items-center gap-2 text-stone-500">
        <Icon size={17} />
        <span className="text-sm">{label}</span>
      </div>

      <span className="font-bold text-stone-800 text-sm">
        {value ?? "—"}
      </span>
    </div>
  );
}

const STATUS_MAP = {
  pending: {
    label: "طلب جديد",
    bg: "#F5E6C8",
    text: "#8A6D1D",
  },

  contacted: {
    label: "تم التواصل",
    bg: "#DCEFE1",
    text: "#1F7A3F",
  },
};

function ReservationDetails({
  reservation,
  onClose,
  onSaveStatus,
}) {
  if (!reservation) return null;

  const property = reservation.property || {};

  const image =
    property.images?.length > 0
      ? property.images[0].image_url
      : "";

  const status = reservation.status || "pending";
  const statusInfo =
    STATUS_MAP[status] || STATUS_MAP.pending;

  const handleMarkContacted = async () => {
    try {
      await updateReservation(reservation.id, {
        status: "contacted",
      });

      onSaveStatus("contacted");

      Swal.fire({
        icon: "success",
        title: "تم",
        text: "تم تحديث حالة الطلب.",
        timer: 1500,
        showConfirmButton: false,
      });

      onClose();
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "تعذر تحديث الحالة.",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center p-6">

      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">

        <div
          className="flex items-center justify-between px-8 py-5 sticky top-0"
          style={{ backgroundColor: COFFEE.dark }}
        >
          <h2 className="text-xl font-extrabold text-white">
            تفاصيل طلب الحجز
          </h2>

          <button
            onClick={onClose}
            className="text-white"
          >
            <X size={26} />
          </button>
        </div>

        <div className="p-8 space-y-8">

          <div
            className="px-5 py-3 rounded-xl font-bold inline-block"
            style={{
              background: statusInfo.bg,
              color: statusInfo.text,
            }}
          >
            {statusInfo.label}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">

            <div>

              <img
                src={image}
                alt={property.title}
                className="w-full h-64 rounded-2xl object-cover border"
              />

              <div className="bg-stone-50 rounded-2xl p-5 mt-5">

                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <User size={18} />
                  بيانات العميل
                </h3>

                <InfoRow
                  icon={User}
                  label="الاسم"
                  value={reservation.name}
                />

                <InfoRow
                  icon={Phone}
                  label="الهاتف"
                  value={reservation.phone}
                />

                <div className="mt-4">
                  <span className="text-stone-500 text-sm">
                    الملاحظات
                  </span>

                  <div className="bg-white border rounded-xl p-3 mt-2">
                    {reservation.message ||
                      "لا توجد ملاحظات"}
                  </div>
                </div>

              </div>

            </div>

            <div className="bg-stone-50 rounded-2xl p-5">

              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Home size={18} />
                بيانات العقار
              </h3>

              <div
                className="text-xl font-extrabold mb-5"
                style={{ color: COFFEE.dark }}
              >
                {property.title}
              </div>

              <InfoRow
                icon={Building2}
                label="النوع"
                value={property.property_type?.name}
              />

              <InfoRow
                icon={Layers}
                label="القسم"
                value={property.category?.name}
              />

              <InfoRow
                icon={MapPin}
                label="المكان"
                value={property.location?.name}
              />

              <InfoRow
                icon={Maximize2}
                label="المساحة"
                value={property.area}
              />

              <InfoRow
                icon={BedDouble}
                label="الغرف"
                value={property.rooms}
              />

              <InfoRow
                icon={Bath}
                label="الحمامات"
                value={property.bathrooms}
              />

              <InfoRow
                icon={Layers}
                label="الدور"
                value={property.floor}
              />

              <InfoRow
                icon={Paintbrush}
                label="التشطيب"
                value={property.finishing}
              />

              <div
                className="mt-5 rounded-xl px-5 py-4 text-center font-extrabold"
                style={{
                  background: "#FBF3DF",
                  color: COFFEE.dark,
                }}
              >
                {property.price
                  ? `${property.price} جنيه`
                  : "السعر غير محدد"}
              </div>

            </div>

          </div>

          <div className="flex justify-between">

            {status === "pending" && (
              <button
                onClick={handleMarkContacted}
                className="px-8 py-3 rounded-xl text-white font-bold bg-green-600 hover:bg-green-700"
              >
                تم التواصل
              </button>
            )}

            <button
              onClick={onClose}
              className="px-8 py-3 border rounded-xl"
            >
              إغلاق
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ReservationDetails;