import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { COFFEE } from "../../constants/constants";

function LocationRow({
  location,
  onEdit,
  onDelete,
}) {
  return (
    <tr className="border-t border-stone-100 hover:bg-stone-50 transition">
      {/* اسم المكان */}
      <td className="px-6 py-5 font-semibold text-stone-800">
        {location.name}
      </td>

      {/* الإجراءات */}
      <td className="px-6 py-5">
        <div className="flex justify-center gap-2">
          <button
            onClick={() => onEdit(location)}
            className="w-10 h-10 rounded-lg hover:bg-yellow-50 flex items-center justify-center transition"
          >
            <Pencil size={18} color={COFFEE.gold} />
          </button>

          <button
            onClick={() => onDelete(location.id)}
            className="w-10 h-10 rounded-lg hover:bg-red-50 flex items-center justify-center transition"
          >
            <Trash2 size={18} color="#DC2626" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default LocationRow;