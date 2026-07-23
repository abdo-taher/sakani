import React, { useState, useEffect } from "react";
import { X, FolderTree } from "lucide-react";
import { COFFEE } from "../../constants/constants";
import {
  createPropertyType,
  updatePropertyType,
} from "../../services/propertyTypeService";
import {
  successToast,
  errorToast,
} from "../../utils/toast";
function CategoryItemForm({
  item,
  categoryId,
  loadItems,
  onClose,
}) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (item) {
      setName(item.name);
    } else {
      setName("");
    }
  }, [item]);

 const handleSubmit = async (e) => {
  e.preventDefault();

  try {

    const data = {
      category_id: categoryId,
      name,
    };

    if (item) {

      await updatePropertyType(item.id, data);

      successToast("تم تعديل النوع بنجاح");

    } else {

      await createPropertyType(data);

      successToast("تم إضافة النوع بنجاح");

    }

    await loadItems();

    onClose();

  } catch (error) {

    errorToast(
      error.response?.data?.message ||
      "حدث خطأ أثناء حفظ النوع"
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
            {item ? "تعديل النوع" : "إضافة نوع جديد"}
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
              اسم النوع
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: مفروش"
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
              {item ? "حفظ التعديلات" : "إضافة النوع"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoryItemForm;