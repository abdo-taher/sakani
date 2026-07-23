import React, { useState, useEffect } from "react";
import { X, FolderTree } from "lucide-react";
import { COFFEE } from "../../constants/constants";
import {
  createCategory,
  updateCategory,
} from "../../services/categoryService";
import {
  successToast,
  errorToast,
} from "../../utils/toast";
function CategoryForm({
  category,
  loadCategories,
  onClose,
}) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (category) {
      setName(category.name);
    } else {
      setName("");
    }
  }, [category]);

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {

    if (category) {

      await updateCategory(category.id, {
        name,
      });

      successToast("تم تعديل القسم بنجاح");

    } else {

      await createCategory({
        name,
      });

      successToast("تم إضافة القسم بنجاح");
    }

    await loadCategories();

    onClose();

  } catch (error) {

    errorToast(
      error.response?.data?.message ||
      "حدث خطأ أثناء حفظ القسم"
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
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <FolderTree size={28} />
            {category ? "تعديل القسم" : "إضافة قسم جديد"}
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
              اسم القسم
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: إيجار"
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
              {category ? "حفظ التعديلات" : "إضافة القسم"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoryForm;