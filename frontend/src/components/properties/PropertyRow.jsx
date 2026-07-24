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
    <tr className={`border-t border-stone-100 hover:bg-stone-50 transition ${uploading ? "opacity-40 pointer-events-none" : ""}`}>
      <td className="px-4 py-4">
        {uploading ? (
          <div className="w-20 h-14 rounded-lg bg-stone-200 flex items-center justify-center">
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
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              <CloudUpload size={12} />
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
