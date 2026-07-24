import React from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Trash2, ExternalLink, Loader2, CloudUpload } from "lucide-react";
import PropertyStatus from "./PropertyStatus";
import { COFFEE } from "../../constants/constants";

function PropertyRow({
  property,
  onPreview,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const navigate = useNavigate();
  const uploading = property.is_uploading;

  return (
    <tr
      className={`border-t border-stone-100 hover:bg-stone-50 transition`}
      style={uploading ? {
        backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(245,158,11,0.06) 10px, rgba(245,158,11,0.06) 20px)",
        backgroundColor: "#FFFBEB",
      } : {}}
    >
      <td className="px-4 py-4">
        {uploading ? (
          <div className="w-20 h-14 rounded-lg bg-amber-100 flex items-center justify-center border border-amber-300">
            <Loader2 size={20} className="animate-spin text-amber-500" />
          </div>
        ) : property.images?.length ? (
          <img
            src={property.images[0].image_url}
            alt={property.title}
            className="w-20 h-14 rounded-lg object-cover bg-stone-100"
          />
        ) : (
          <div className="w-20 h-14 rounded-lg bg-stone-100 flex items-center justify-center text-xs">
            لا توجد صورة
          </div>
        )}
      </td>

      <td className="px-4 py-4 font-bold text-stone-800 truncate" title={property.title}>
        <div className="flex items-center gap-2">
          {property.title}
          {uploading && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full font-bold">
              <Loader2 size={12} className="animate-spin" />
              جاري الرفع
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-4 whitespace-nowrap">
        {property.category?.name}
      </td>

      <td className="px-4 py-4 truncate" title={property.location?.name}>
        {property.location?.name}
      </td>

      <td className="px-4 py-4 whitespace-nowrap font-semibold">
        {property.price?.toLocaleString()} ج.م
      </td>

      <td className="px-4 py-4">
        <PropertyStatus
          value={property.status}
          onChange={(status) => onStatusChange(property.id, status)}
        />
      </td>

      <td className="px-4 py-4">
        <div className="flex justify-center gap-1.5">
          <button
            onClick={() => navigate(`/dashboard/properties/${property.id}`)}
            disabled={uploading}
            className="w-9 h-9 rounded-lg hover:bg-amber-50 flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed"
            title="تفاصيل العقار"
          >
            <ExternalLink size={18} color={COFFEE.gold} />
          </button>

          <button
            onClick={() => onPreview(property)}
            disabled={uploading}
            className="w-9 h-9 rounded-lg hover:bg-stone-100 flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed"
            title="معاينة العقار"
          >
            <Eye size={18} color={COFFEE.dark} />
          </button>

          <button
            onClick={() => onEdit(property)}
            disabled={uploading}
            className="w-9 h-9 rounded-lg hover:bg-yellow-50 flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed"
            title="تعديل العقار"
          >
            <Pencil size={18} color={COFFEE.gold} />
          </button>

          <button
            onClick={() => onDelete(property.id)}
            disabled={uploading}
            className="w-9 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed"
            title="حذف العقار"
          >
            <Trash2 size={18} color="#DC2626" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default PropertyRow;
