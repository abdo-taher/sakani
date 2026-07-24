import React, { useState, useEffect } from "react";
import { X, MapPinned, Image as ImageIcon, Upload } from "lucide-react";
import { COFFEE } from "../../constants/constants";
import { createLocation, updateLocation } from "../../services/locationService";
import { uploadToCloudinary } from "../../services/cloudinaryService";
import { successToast, errorToast } from "../../utils/toast";

function LocationForm({ location, onClose }) {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [imagePublicId, setImagePublicId] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (location) {
      setName(location.name || "");
      setExistingImage(location.image_url || null);
      setImagePublicId(location.image_public_id || null);
      setImageUrl(location.image_url || null);
    } else {
      setName("");
      setExistingImage(null);
      setImagePublicId(null);
      setImageUrl(null);
    }
    setImageFile(null);
  }, [location]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImageUrl(null);
    setImagePublicId(null);
    setExistingImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let finalUrl = existingImage ? imageUrl : null;
      let finalPublicId = imagePublicId || null;

      if (imageFile) {
        const uploaded = await uploadToCloudinary(imageFile, "sakani/locations");
        finalUrl = uploaded.secure_url;
        finalPublicId = uploaded.public_id;
      }

      const data = {
        name,
        image_url: finalUrl,
        image_public_id: finalPublicId,
      };

      if (location) {
        await updateLocation(location.id, data);
        successToast("تم تعديل المكان بنجاح");
      } else {
        await createLocation(data);
        successToast("تم إضافة المكان بنجاح");
      }
      onClose();
    } catch (error) {
      errorToast(error.response?.data?.message || "حدث خطأ أثناء حفظ المكان");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
        <div
          className="flex items-center justify-between px-8 py-6"
          style={{ backgroundColor: COFFEE.dark }}
        >
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <MapPinned size={28} />
            {location ? "تعديل المكان" : "إضافة مكان جديد"}
          </h2>
          <button onClick={onClose} className="text-white hover:rotate-90 transition">
            <X size={28} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block mb-3 font-bold text-stone-700">اسم المكان</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: حي الجامعة"
              className="w-full border rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-yellow-200"
              required
            />
          </div>

          <div>
            <label className="block mb-3 font-bold text-stone-700">صورة المكان (اختياري)</label>

            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={name}
                  className="w-full h-48 rounded-xl object-cover border"
                  style={{ borderColor: COFFEE.line }}
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 left-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label
                className="flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed cursor-pointer hover:bg-stone-50 transition"
                style={{ borderColor: COFFEE.gold }}
              >
                <Upload size={32} color={COFFEE.gold} className="mb-2" />
                <span className="text-sm font-bold" style={{ color: COFFEE.stone }}>
                  اضغط لاختيار صورة
                </span>
                <span className="text-xs text-stone-400 mt-1">JPG, PNG — حد أقصى 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl border">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-xl font-bold disabled:opacity-50"
              style={{ backgroundColor: COFFEE.gold, color: COFFEE.dark }}
            >
              {saving ? "جاري الحفظ..." : location ? "حفظ التعديلات" : "إضافة المكان"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LocationForm;
