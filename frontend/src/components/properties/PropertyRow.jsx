import React from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import PropertyStatus from "./PropertyStatus";
import { COFFEE } from "../../constants/constants";

function PropertyRow({
  property,
  onPreview,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  return (
    <tr className="border-t border-stone-100 hover:bg-stone-50 transition">
      <td className="px-4 py-4">
{property.images?.length ? (
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
        {property.title}
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
            onClick={() => onPreview(property)}
            className="w-9 h-9 rounded-lg hover:bg-stone-100 flex items-center justify-center transition"
          >
            <Eye size={18} color={COFFEE.dark} />
          </button>

          <button
            onClick={() => onEdit(property)}
            className="w-9 h-9 rounded-lg hover:bg-yellow-50 flex items-center justify-center transition"
          >
            <Pencil size={18} color={COFFEE.gold} />
          </button>

          <button
            onClick={() => onDelete(property.id)}
            className="w-9 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center transition"
          >
            <Trash2 size={18} color="#DC2626" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default PropertyRow;