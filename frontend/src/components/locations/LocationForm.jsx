import React, { useState, useEffect } from "react";
import { X, MapPinned } from "lucide-react";
import { COFFEE } from "../../constants/constants";
import {
  createLocation,
  updateLocation,
} from "../../services/locationService";
import {
  successToast,
  errorToast,
} from "../../utils/toast";
function LocationForm({
  location,
  locations,
  setLocations,
  onClose,
}) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (location) {
      setName(location.name);
    } else {
      setName("");
    }
  }, [location]);

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    if (location) {
      await updateLocation(location.id, {
        name,
      });

      successToast("تم تعديل المكان بنجاح");
    } else {
      await createLocation({
        name,
      });

      successToast("تم إضافة المكان بنجاح");
    }

    onClose();

  } catch (error) {

    errorToast(
      error.response?.data?.message ||
      "حدث خطأ أثناء حفظ المكان"
    );

    console.error(error);
  }
};

  return (
    <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div
          className="flex items-center justify-between px-8 py-6"
          style={{ backgroundColor: COFFEE.dark }}
        >
          <h2
            className="text-2xl font-extrabold text-white flex items-center gap-3"
          >
            <MapPinned size={28} />
            {location ? "تعديل المكان" : "إضافة مكان جديد"}
          </h2>

          <button
            onClick={onClose}
            className="text-white hover:rotate-90 transition"
          >
            <X size={28} />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-6"
        >
          <div>
            <label className="block mb-3 font-bold text-stone-700">
              اسم المكان
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: حي الجامعة"
              className="w-full border rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-yellow-200"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border"
            >
              إلغاء
            </button>

            <button
              type="submit"
              className="px-8 py-3 rounded-xl font-bold"
              style={{
                backgroundColor: COFFEE.gold,
                color: COFFEE.dark,
              }}
            >
              {location ? "حفظ التعديلات" : "إضافة المكان"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}

export default LocationForm;