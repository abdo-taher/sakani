import React from "react";
import { Eye, Trash2 } from "lucide-react";
import { COFFEE } from "../../constants/constants";
import { SAMPLE_IMG } from "../../utils/helpers";

function ReservationRow({
  reservation,
  onView,
  onDelete,
}) {
  const statusMap = {
  pending: {
    text: "جديد",
    bg: "bg-yellow-100",
    color: "text-yellow-700",
  },
  contacted: {
    text: "تم التواصل",
    bg: "bg-blue-100",
    color: "text-blue-700",
  },
};

  const status = statusMap[reservation.status] || statusMap.new;
   const image =
  reservation.property?.images?.length > 0
    ? reservation.property.images[0].image_url
    : SAMPLE_IMG(reservation.property?.id);

const propertyName =
  reservation.property?.title || "-";

  return (
    <tr className="border-t border-stone-100 hover:bg-stone-50 transition">

      {/* صورة العقار */}
      <td className="px-4 py-4">
        <img
         src={image}
        alt={propertyName}
          className="w-20 h-14 rounded-lg object-cover bg-stone-100"
        />
      </td>

      {/* اسم العقار */}
      <td className="px-4 py-4 font-bold text-stone-800">
       {propertyName}
      </td>

      {/* اسم العميل */}
      <td className="px-4 py-4">
        {reservation.name}
      </td>

      {/* الهاتف */}
      <td className="px-4 py-4">
        {reservation.phone}
      </td>

      {/* الحالة */}
      <td className="px-4 py-4">
        <span
          className={`px-4 py-2 rounded-full text-sm font-bold ${status.bg} ${status.color}`}
        >
          {status.text}
        </span>
      </td>

      {/* تاريخ الطلب */}
      <td className="px-4 py-4">
       {new Date(reservation.created_at).toLocaleDateString("ar-EG")}
      </td>

      {/* آخر تحديث */}
      <td className="px-4 py-4">
       {new Date(reservation.updated_at).toLocaleDateString("ar-EG")}
      </td>

      {/* الإجراءات */}
      <td className="px-4 py-4">
        <div className="flex justify-center gap-2">

          <button
            onClick={() => onView(reservation)}
            className="w-10 h-10 rounded-lg hover:bg-stone-100 flex items-center justify-center transition"
          >
            <Eye
              size={18}
              color={COFFEE.dark}
            />
          </button>

          <button
            onClick={() => onDelete(reservation.id)}
            className="w-10 h-10 rounded-lg hover:bg-red-50 flex items-center justify-center transition"
          >
            <Trash2
              size={18}
              color="#DC2626"
            />
          </button>

        </div>
      </td>

    </tr>
  );
}

export default ReservationRow;