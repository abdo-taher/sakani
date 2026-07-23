import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { COFFEE } from "../../constants/constants";
import React, { useState, useEffect } from "react";
import {
  getAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
} from "../../services/amenityService";

import Swal from "sweetalert2";

import {
  successToast,
  errorToast,
} from "../../utils/toast";
function FeatureManager({
  open,
  onClose,
}) {
  const [featureName, setFeatureName] = useState("");
const [editingFeature, setEditingFeature] = useState(null);
 const [features, setFeatures] = useState([]);
 const loadAmenities = async () => {
    try {
        const data = await getAmenities();
        setFeatures(data);
    } catch (error) {
        console.error(error);
    }
};
useEffect(() => {
    loadAmenities();
}, []);
  if (!open) return null;

 const handleAdd = async () => {
  if (!featureName.trim()) return;

  try {

    if (editingFeature) {

      await updateAmenity(editingFeature.id, {
        name: featureName,
      });

      successToast("تم تعديل الميزة بنجاح");

    } else {

      await createAmenity({
        name: featureName,
      });

      successToast("تم إضافة الميزة بنجاح");

    }

    await loadAmenities();

    setFeatureName("");

    setEditingFeature(null);

  } catch (error) {

    errorToast(
      error.response?.data?.message ||
      "حدث خطأ"
    );

  }
};
  const handleDelete = async (id) => {

  const result = await Swal.fire({

    title: "حذف الميزة؟",

    text: "لن تستطيع استرجاعها",

    icon: "warning",

    showCancelButton: true,

    confirmButtonText: "حذف",

    cancelButtonText: "إلغاء",

    confirmButtonColor: "#DC2626",

    cancelButtonColor: "#6B7280",

  });

  if (!result.isConfirmed) return;

  try {

    await deleteAmenity(id);

    successToast("تم حذف الميزة");

    loadAmenities();

  } catch (error) {

    errorToast(
      error.response?.data?.message ||
      "تعذر حذف الميزة"
    );

  }

};

  const handleEdit = (feature) => {

  setEditingFeature(feature);

  setFeatureName(feature.name);

};

  return (
    <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center p-6">

      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden">

        {/* Header */}

        <div
          className="flex justify-between items-center px-8 py-6"
          style={{
            backgroundColor: COFFEE.dark,
          }}
        >
          <h2 className="text-2xl font-bold text-white">
            إدارة المميزات
          </h2>

          <button
            onClick={onClose}
            className="text-white"
          >
            <X size={28} />
          </button>
        </div>

        {/* Body */}

        <div className="p-8">

          <div className="flex gap-3 mb-8">

            <input
              type="text"
              value={featureName}
              onChange={(e) =>
                setFeatureName(e.target.value)
              }
              placeholder="اسم الميزة..."
              className="flex-1 border rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-yellow-200"
            />

            <button
              onClick={handleAdd}
              className="px-6 rounded-xl flex items-center gap-2 font-bold"
              style={{
                backgroundColor: COFFEE.gold,
                color: COFFEE.dark,
              }}
            >
              <Plus size={20} />
            {editingFeature ? "حفظ" : "إضافة"}
            </button>

          </div>

          {/* الجدول */}

          <div className="border rounded-2xl overflow-hidden">

            <table className="w-full">

              <thead
                className="text-right"
                style={{
                  backgroundColor: "#F7F3EE",
                }}
              >
                <tr>

                  <th className="px-6 py-4">
                    الميزة
                  </th>

                  <th className="px-6 py-4 text-center w-40">
                    الإجراءات
                  </th>

                </tr>

              </thead>

              <tbody>

                {features.map((feature) => (

                  <tr
                   key={feature.id}
                    className="border-t"
                  >

                    <td className="px-6 py-4">
                      {feature.name}
                    </td>

                    <td className="px-6 py-4">

                      <div className="flex justify-center gap-2">

                        <button
                          onClick={() =>
                            handleEdit(feature)
                          }
                          className="w-10 h-10 rounded-lg hover:bg-stone-100 flex items-center justify-center"
                        >
                          <Pencil
                            size={18}
                            color={COFFEE.dark}
                          />
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(feature.id)
                          }
                          className="w-10 h-10 rounded-lg hover:bg-red-50 flex items-center justify-center"
                        >
                          <Trash2
                            size={18}
                            color="#DC2626"
                          />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  );
}

export default FeatureManager;