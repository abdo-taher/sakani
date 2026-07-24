import { Plus, Pencil, Trash2, Sparkles, ArrowRight } from "lucide-react";
import { COFFEE } from "../../constants/constants";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
} from "../../services/amenityService";
import usePageTitle from "../../hooks/usePageTitle";

import Swal from "sweetalert2";

import {
  successToast,
  errorToast,
} from "../../utils/toast";

function FeatureManager() {
  usePageTitle("إدارة المميزات — سكني");
  const navigate = useNavigate();
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

  const handleAdd = async () => {
    if (!featureName.trim()) return;

    try {
      if (editingFeature) {
        await updateAmenity(editingFeature.id, { name: featureName });
        successToast("تم تعديل الميزة بنجاح");
      } else {
        await createAmenity({ name: featureName });
        successToast("تم إضافة الميزة بنجاح");
      }

      await loadAmenities();
      setFeatureName("");
      setEditingFeature(null);
    } catch (error) {
      errorToast(error.response?.data?.message || "حدث خطأ");
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
      errorToast(error.response?.data?.message || "تعذر حذف الميزة");
    }
  };

  const handleEdit = (feature) => {
    setEditingFeature(feature);
    setFeatureName(feature.name);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate("/dashboard/properties")}
          className="w-10 h-10 rounded-xl flex items-center justify-center border border-stone-200 hover:bg-stone-100 transition"
        >
          <ArrowRight size={20} color={COFFEE.dark} />
        </button>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: COFFEE.gold }}>
          <Sparkles size={22} color={COFFEE.dark} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: COFFEE.dark }}>إدارة المميزات</h1>
          <p className="text-sm" style={{ color: COFFEE.stone }}>إضافة وتعديل وحذف مميزات العقارات</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-8">
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            value={featureName}
            onChange={(e) => setFeatureName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="اسم الميزة..."
            className="flex-1 border-2 rounded-xl px-5 py-3.5 outline-none transition focus:border-[var(--gold)] focus:ring-4 focus:ring-[var(--goldRing)]"
            style={{ borderColor: "#EADFD0" }}
          />
          <button
            onClick={handleAdd}
            className="px-6 rounded-xl flex items-center gap-2 font-bold transition hover:opacity-90"
            style={{
              backgroundColor: COFFEE.gold,
              color: COFFEE.dark,
            }}
          >
            <Plus size={20} />
            {editingFeature ? "حفظ" : "إضافة"}
          </button>
        </div>

        <div className="border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="text-right" style={{ backgroundColor: "#F7F3EE" }}>
              <tr>
                <th className="px-6 py-4 font-bold text-stone-600">الميزة</th>
                <th className="px-6 py-4 text-center w-40 font-bold text-stone-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {features.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-16 text-center text-stone-400 font-semibold text-lg">
                    لا توجد مميزات حالياً
                  </td>
                </tr>
              ) : (
                features.map((feature) => (
                  <tr key={feature.id} className="border-t">
                    <td className="px-6 py-4 font-bold" style={{ color: COFFEE.dark }}>
                      {feature.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(feature)}
                          className="w-10 h-10 rounded-lg hover:bg-stone-100 flex items-center justify-center transition"
                          title="تعديل"
                        >
                          <Pencil size={18} color={COFFEE.dark} />
                        </button>
                        <button
                          onClick={() => handleDelete(feature.id)}
                          className="w-10 h-10 rounded-lg hover:bg-red-50 flex items-center justify-center transition"
                          title="حذف"
                        >
                          <Trash2 size={18} color="#DC2626" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FeatureManager;
