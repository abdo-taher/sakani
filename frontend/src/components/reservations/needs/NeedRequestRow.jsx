import React from "react";
import { Eye, Trash2 } from "lucide-react";
import { COFFEE } from "../../../constants/constants";

function NeedRequestRow({
  request,
  onView,
  onDelete,
}) {
  const statusMap = {
    new: {
      text: "طلب جديد",
      bg: "bg-yellow-100",
      color: "text-yellow-700",
    },
    contacted: {
      text: "تم التواصل",
      bg: "bg-blue-100",
      color: "text-blue-700",
    },
    completed: {
      text: "تم توفير عقار",
      bg: "bg-green-100",
      color: "text-green-700",
    },
    cancelled: {
      text: "ملغي",
      bg: "bg-red-100",
      color: "text-red-700",
    },
  };

  const requestTypeMap = {
    rent: "إيجار",
    buy: "شراء",
    sell: "بيع",
  };

  const status = statusMap[request.status] || statusMap.new;

  // ⚠️ نفس ملاحظة المودال: لو الاسم بيطلع فاضي في الجدول برضو،
  // المشكلة إن request.customerName مش نفس اسم الحقل في الداتا الحقيقية.
  const customerName =
    request.customerName ||
    request.name ||
    request.clientName ||
    request.fullName ||
    "غير محدد";

  // ⚠️ لو التاريخ فاضي: request.createdAt مش نفس اسم الحقل الحقيقي.
  // جرّب created_at / requestDate / date. لو لسه فاضي ابعتلي شكل الـ object.
  const rawDate =
    request.createdAt ||
    request.created_at ||
    request.requestDate ||
    request.date;

  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "غير محدد";

  return (
    <tr className="border-t border-stone-100 hover:bg-stone-50 transition">
      <td className="px-4 py-4 font-semibold">{customerName}</td>

      <td className="px-4 py-4">{request.phone}</td>

      <td className="px-4 py-4">
        {requestTypeMap[request.requestType]}
      </td>

      <td className="px-4 py-4">{request.location}</td>

      <td className="px-4 py-4">{request.budget}</td>

      <td className="px-4 py-4">
        <span
          className={`px-4 py-2 rounded-full text-sm font-bold ${status.bg} ${status.color}`}
        >
          {status.text}
        </span>
      </td>

      <td className="px-4 py-4">{formattedDate}</td>

      <td className="px-4 py-4">
        <div className="flex justify-center gap-2">
          <button
            onClick={() => onView(request)}
            className="w-10 h-10 rounded-lg hover:bg-stone-100 flex items-center justify-center transition"
          >
            <Eye size={18} color={COFFEE.dark} />
          </button>

          <button
            onClick={() => onDelete(request.id)}
            className="w-10 h-10 rounded-lg hover:bg-red-50 flex items-center justify-center transition"
          >
            <Trash2 size={18} color="#DC2626" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default NeedRequestRow;