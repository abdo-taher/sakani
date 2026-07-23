import React from "react";
import LocationRow from "./LocationRow";

function LocationTable({
  locations = [],
  onEdit,
  onDelete,
}) {
  return (
    <div
      className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden"
      dir="rtl"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead className="bg-stone-100">
            <tr>
              <th className="px-6 py-5 text-right font-bold text-stone-600">
                اسم المكان
              </th>

              <th className="px-6 py-5 text-center font-bold text-stone-600 w-40">
                الإجراءات
              </th>
            </tr>
          </thead>

          <tbody>
            {locations.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="py-20 text-center text-stone-400 font-semibold text-lg"
                >
                  لا توجد أماكن حالياً
                </td>
              </tr>
            ) : (
              locations.map((location) => (
                <LocationRow
                  key={location.id}
                  location={location}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LocationTable;