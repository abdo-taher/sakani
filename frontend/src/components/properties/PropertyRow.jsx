import React from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Trash2, ExternalLink, Loader2, CloudUpload, EyeOff } from "lucide-react";
import PropertyStatus from "./PropertyStatus";
import { COFFEE } from "../../constants/constants";
import { fmtPrice, SAMPLE_IMG } from "../../utils/helpers";

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
      className={`border-t transition`}
      style={uploading ? {
        backgroundColor: "#FFFBEB",
        borderLeft: "4px solid #F59E0B",
      } : {
        borderBottom: "1px solid #f5f5f4",
        backgroundColor: "transparent",
      }}
    >
      <td className="px-4 py-4">
        {uploading ? (
          <div className="w-20 h-14 rounded-lg bg-amber-50 flex items-center justify-center border-2 border-dashed border-amber-400">
            <Loader2 size={22} className="animate-spin text-amber-500" />
          </div>
        ) : (
          <img
            src={property.images?.[0]?.image_url || SAMPLE_IMG(property.id)}
            alt={property.title}
            className="w-20 h-14 rounded-lg object-cover bg-stone-100"
          />
        )}
      </td>

      <td className="px-4 py-4 font-bold truncate" title={property.title}>
        <div className="flex flex-col gap-1.5">
          <span className={uploading ? "text-amber-700" : "text-stone-800"}>
            {property.title}
          </span>
          {uploading && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full font-bold w-fit">
              <Loader2 size={11} className="animate-spin" />
              جاري رفع الوسائط
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-4 whitespace-nowrap">
        <span className={uploading ? "text-amber-600" : ""}>
          {property.category?.name}
        </span>
      </td>

      <td className="px-4 py-4 truncate" title={property.location?.name}>
        <span className={uploading ? "text-amber-600" : ""}>
          {property.location?.name}
        </span>
      </td>

      <td className="px-4 py-4 whitespace-nowrap font-semibold">
        <span className={uploading ? "text-amber-600" : ""}>
          {fmtPrice(property.price)}
        </span>
      </td>

      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <Eye size={14} className={uploading ? "text-amber-400" : "text-stone-400"} />
          <span className={`text-sm font-bold ${uploading ? "text-amber-600" : "text-stone-600"}`}>
            {property.cached_views ?? property.views ?? 0}
          </span>
        </div>
      </td>

      <td className="px-4 py-4">
        {!uploading && (
          <PropertyStatus
            value={property.status}
            onChange={(status) => onStatusChange(property.id, status)}
          />
        )}
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
