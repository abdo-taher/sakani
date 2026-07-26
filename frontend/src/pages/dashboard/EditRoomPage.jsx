import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Trash2,
  Loader2,
  ImagePlus,
  Check,
} from "lucide-react";
import usePageTitle from "../../hooks/usePageTitle";
import { getPropertyById } from "../../services/propertyService";
import { updateRoom, uploadRoomImage, deleteRoomImage, markRoomUploadComplete } from "../../services/roomService";
import { uploadToCloudinary } from "../../services/cloudinaryService";
import { COFFEE } from "../../constants/constants";
import { successToast, errorToast } from "../../utils/toast";
import { numbersOnly } from "../../utils/numbersOnly";
import api from "../../services/api";

function EditRoomPage() {
  usePageTitle("تعديل الغرفة — سكني");
  const { id, roomId } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingMsg, setSavingMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    area: "",
  });

  const [existingImages, setExistingImages] = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [newImages, setNewImages] = useState([]);

  useEffect(() => {
    loadData();
  }, [id, roomId]);

  const loadData = async () => {
    try {
      const [propRes] = await Promise.all([
        getPropertyById(id),
      ]);
      setProperty(propRes.data);

      const roomRes = await api.get(`/rooms/${roomId}`);
      const roomData = roomRes.data.data || roomRes.data;
      setRoom(roomData);
      setForm({
        name: roomData.name || "",
        description: roomData.description || "",
        price: roomData.price || "",
        area: roomData.area || "",
      });
      setExistingImages(roomData.room_images || roomData.roomImages || []);
    } catch {
      errorToast("تعذر تحميل بيانات الغرفة");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setNewImages((prev) => [...prev, ...files]);
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageId) => {
    try {
      await deleteRoomImage(imageId);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      setRemovedImageIds((prev) => [...prev, imageId]);
    } catch {
      errorToast("تعذر حذف الصورة");
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { errorToast("اسم الغرفة مطلوب"); return; }
    if (!form.price) { errorToast("سعر الغرفة مطلوب"); return; }

    setSaving(true);
    setSavingMsg("جاري حفظ التعديلات...");

    try {
      await updateRoom(roomId, {
        name: form.name,
        description: form.description,
        price: form.price,
        area: form.area || null,
      });

      if (newImages.length > 0) {
        for (let i = 0; i < newImages.length; i++) {
          setSavingMsg(`جاري رفع الصور (${i + 1}/${newImages.length})...`);
          const uploaded = await uploadToCloudinary(newImages[i], "sakani/rooms/images");
          await uploadRoomImage(roomId, {
            image_url: uploaded.secure_url,
            image_public_id: uploaded.public_id,
            media_type: "image",
            is_primary: existingImages.length === 0 && i === 0,
          });
        }
      }

      successToast("تم تعديل الغرفة بنجاح");
      navigate(`/dashboard/properties/${id}`);
    } catch (err) {
      errorToast(err.response?.data?.message || "حدث خطأ أثناء التعديل");
    } finally {
      setSaving(false);
      setSavingMsg("");
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold" style={{ color: COFFEE.stone }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(`/dashboard/properties/${id}`)}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-stone-100 transition"
        >
          <ArrowRight size={22} color={COFFEE.dark} />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: COFFEE.dark }}>
            تعديل الغرفة
          </h1>
          <p className="text-sm" style={{ color: COFFEE.stone }}>
            {property?.title}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: COFFEE.line, background: "white" }}
        >
          <h3 className="font-bold mb-4" style={{ color: COFFEE.dark }}>
            بيانات الغرفة
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: COFFEE.dark }}>
                اسم الغرفة *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="مثال: غرفة 1 / جناح رئيسي"
                className="w-full border border-stone-200 rounded-xl px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: COFFEE.dark }}>
                  السعر الشهري (جنيه) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  onKeyDown={numbersOnly.onKeyDown}
                  onPaste={numbersOnly.onPaste}
                  placeholder="0"
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: COFFEE.dark }}>
                  المساحة (م²) — اختياري
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  onKeyDown={numbersOnly.onKeyDown}
                  onPaste={numbersOnly.onPaste}
                  placeholder="0"
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: COFFEE.dark }}>
                وصف الغرفة — اختياري
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="وصف مختصر عن الغرفة..."
                className="w-full border border-stone-200 rounded-xl px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: COFFEE.line, background: "white" }}
          >
            <h3 className="font-bold mb-4" style={{ color: COFFEE.dark }}>
              الصور الحالية ({existingImages.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {existingImages.map((img) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.image_url}
                    alt=""
                    className="w-24 h-24 rounded-xl object-cover border-2"
                    style={{ borderColor: img.is_primary ? COFFEE.gold : COFFEE.line }}
                  />
                  {img.is_primary && (
                    <span
                      className="absolute -top-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ background: COFFEE.gold }}
                    >
                      رئيسية
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeExistingImage(img.id)}
                    className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Images */}
        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: COFFEE.line, background: "white" }}
        >
          <h3 className="font-bold mb-4" style={{ color: COFFEE.dark }}>
            إضافة صور جديدة
          </h3>

          <label
            className="block rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition hover:bg-stone-50"
            style={{ borderColor: COFFEE.line }}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImages}
              className="hidden"
            />
            <ImagePlus size={28} className="mx-auto mb-2" color={COFFEE.gold} />
            <p className="font-bold text-sm" style={{ color: COFFEE.dark }}>
              اضغط لاختيار الصور
            </p>
            <p className="text-xs mt-1" style={{ color: COFFEE.stone }}>
              يمكن اختيار أكثر من صورة
            </p>
          </label>

          {newImages.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              {newImages.map((file, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="w-24 h-24 rounded-xl object-cover border-2"
                    style={{ borderColor: COFFEE.gold }}
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end flex-wrap">
          <button
            onClick={() => navigate(`/dashboard/properties/${id}`)}
            className="px-6 py-3 rounded-xl font-bold border-2 transition hover:bg-stone-50"
            style={{ borderColor: COFFEE.line, color: COFFEE.stone }}
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition hover:brightness-110 disabled:opacity-60"
            style={{ background: "#2F7A4D", color: "white" }}
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {savingMsg || "جاري الحفظ..."}
              </>
            ) : (
              <>
                <Check size={18} />
                حفظ التعديلات
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditRoomPage;
