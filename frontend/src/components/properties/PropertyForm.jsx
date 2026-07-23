import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Home,
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Check,
  Layers,
  Ruler,
  BedDouble,
  Bath,
  ArrowUpDown,
  Paintbrush,
  ImagePlus,
  Video,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import { getLocations } from "../../services/locationService";
import {
  createProperty,
  updateProperty,
} from "../../services/propertyService";
import { getCategories } from "../../services/categoryService";
import { getAmenities } from "../../services/amenityService";
import { getPropertyTypes } from "../../services/propertyTypeService";
import { uploadPropertyImage } from "../../services/propertyImageService";
import {
  successToast,
  errorToast,
} from "../../utils/toast";
import { uploadToCloudinary } from "../../services/cloudinaryService";

const COFFEE = {
  dark: "#3B2618",
  darker: "#2A1B11",
  gold: "#CC9A3A",
  goldLight: "#E4C878",
  cream: "#FAF6F0",
  stone: "#8C7B6B",
  line: "#EAE1D2",
};

const STEPS = [
  { id: 1, label: "التصنيف" },
  { id: 2, label: "البيانات" },
  { id: 3, label: "المميزات" },
  { id: 4, label: "الصور" },
  { id: 5, label: "المراجعة" },
];

function PropertyForm({
  onClose,
  property,
  loadProperties,
}) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState("next");
  const [propertyData, setPropertyData] = useState({
    category: "",
    section: "",
    location: "",
    title: "",
    description: "",
    price: "",
    area: "",
    rooms: "",
    bathrooms: "",
    floor: "",
    finishing: "",
    furnishing: "",
    status: "available",
    features: [],
    images: [],
    video: null,
  });

  useEffect(() => {
    if (property) {
      setPropertyData({
        category: property.category_id || property.category?.id || "",
        section: property.property_type_id || property.propertyType?.id || "",
        location: property.location_id || property.location?.id || "",

        title: property.title || "",
        description: property.description || "",
        price: property.price || "",

        area: property.area || "",
        rooms: property.rooms || "",
        bathrooms: property.bathrooms || "",
        floor: property.floor || "",

        finishing: property.finishing || "",
        furnishing: property.furnishing || "",
        status: property.status || "available",

        features: property.amenities
          ? property.amenities.map(item => item.id)
          : [],
        images: property.images || [],
        video: property.video || null,
      });
    }
  }, [property]);

  const handleChange = (e) => {
    setPropertyData({ ...propertyData, [e.target.name]: e.target.value });
  };

  const setField = (name, value) => {
    setPropertyData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFeatureChange = (feature) => {
    setPropertyData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((item) => item !== feature)
        : [...prev.features, feature],
    }));
  };

  const handleImages = (e) => {
    setPropertyData((prev) => ({ ...prev, images: Array.from(e.target.files) }));
  };

  const handleVideo = (e) => {
    setPropertyData((prev) => ({ ...prev, video: e.target.files[0] }));
  };

  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savingMessage, setSavingMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const locationsData = await getLocations();
        setLocations(locationsData);

        const categoriesData = await getCategories();
        setCategories(categoriesData);

        const amenitiesData = await getAmenities();
        setAmenities(amenitiesData);

        const propertyTypesData = await getPropertyTypes();
        setPropertyTypes(propertyTypesData);

      } catch (error) {
        console.log(error.response);
        console.log(error.response?.data);
      }
    };

    loadData();
  }, []);

  const finishingOptions = [
    { value: "super_lux", label: "سوبر لوكس" },
    { value: "lux", label: "لوكس" },
    { value: "semi_finished", label: "نصف تشطيب" },
    { value: "red_brick", label: "طوب أحمر" },
  ];

  const furnishingOptions = [
    { value: "furnished", label: "مؤثث" },
    { value: "unfurnished", label: "غير مؤثث" },
  ];

  const goNext = () => {
    if (step === 1) {
      if (!propertyData.category) {
        errorToast("لازم تختار نوع العملية (إيجار / شراء / بيع)");
        return;
      }
      if (!propertyData.section) {
        errorToast("لازم تختار القسم (نوع العقار)");
        return;
      }
      if (!propertyData.location) {
        errorToast("لازم تختار المكان");
        return;
      }
    }

    if (step < 5) {
      setDirection("next");
      setStep(step + 1);
    }
  };

  const goPrev = () => {
    if (step > 1) {
      setDirection("prev");
      setStep(step - 1);
    }
  };

  const handleSave = async () => {
    if (!propertyData.category || !propertyData.section || !propertyData.location) {
      errorToast("فيه بيانات تصنيف ناقصة (نوع العملية / القسم / المكان)، ارجع لخطوة التصنيف");
      setStep(1);
      return;
    }

    setSaving(true);
    try {

      let videoUrl = null;
      let videoPublicId = null;

      if (propertyData.video) {
        setSavingMessage("جاري رفع الفيديو، قد يستغرق ذلك بعض الوقت...");
        const uploadedVideo = await uploadToCloudinary(
          propertyData.video,
          "sakani/properties/videos"
        );
        videoUrl = uploadedVideo.secure_url;
        videoPublicId = uploadedVideo.public_id;
      }

      const data = {
  title: propertyData.title,
  description: propertyData.description,
  price: propertyData.price,
  category_id: propertyData.category,
  property_type_id: propertyData.section,
  location_id: propertyData.location,
  area: propertyData.area,
  rooms: propertyData.rooms,
  bathrooms: propertyData.bathrooms,
  floor: propertyData.floor,
  balconies: 0,
  finishing: propertyData.finishing || null,
  furnishing: propertyData.furnishing || null,
  status: "available",
  featured: false,

  amenities: propertyData.features,

  video_url: videoUrl,
  video_public_id: videoPublicId,
};;

      if (property) {

        setSavingMessage("جاري حفظ التعديلات...");
        await updateProperty(property.id, data);

        successToast("تم تعديل العقار بنجاح");

      } else {

        setSavingMessage("جاري حفظ بيانات العقار...");
        const response = await createProperty(data);

        const propertyId = response.data.property.id;

        if (propertyData.images.length > 0) {
          setSavingMessage(`جاري رفع الصور (0/${propertyData.images.length})...`);
        }

        let uploadedCount = 0;
        for (const image of propertyData.images) {

          const uploaded = await uploadToCloudinary(
            image,
            "sakani/properties/images"
          );

          await uploadPropertyImage(
            propertyId,
            uploaded.secure_url,
            uploaded.public_id
          );

          uploadedCount++;
          setSavingMessage(`جاري رفع الصور (${uploadedCount}/${propertyData.images.length})...`);
        }

        successToast("تم إضافة العقار بنجاح");

      }

      await loadProperties();

      onClose();

    } catch (error) {

      errorToast(
        error.response?.data?.message ||
        "حدث خطأ أثناء حفظ العقار"
      );

      console.error(error);

    } finally {
      setSaving(false);
      setSavingMessage("");
    }
  };

  const inputClass =
    "w-full border border-stone-200 rounded-2xl px-4 py-3 outline-none transition focus:border-[var(--gold)] focus:ring-4 focus:ring-[var(--goldRing)] bg-white";

  const labelClass = "flex items-center gap-2 mb-2 font-bold text-sm";

  const finishingLabel = finishingOptions.find(
    (f) => f.value === propertyData.finishing
  )?.label;

  const furnishingLabel = furnishingOptions.find(
    (f) => f.value === propertyData.furnishing
  )?.label;

  const selectedCategory = categories.find(
    (c) => c.id === propertyData.category
  );

  const selectedPropertyType = propertyTypes.find(
    (t) => t.id === propertyData.section
  );

  const selectedLocation = locations.find(
    (l) => l.id === propertyData.location
  );

  const selectedAmenities = amenities.filter((a) =>
    propertyData.features.includes(a.id)
  );

  const modalContent = (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: "rgba(20,14,9,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeSlideNext {
          from { opacity: 0; transform: translateX(14px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeSlidePrev {
          from { opacity: 0; transform: translateX(-14px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes ringPulse {
          0% { box-shadow: 0 0 0 0 rgba(204,154,58,0.45); }
          70% { box-shadow: 0 0 0 8px rgba(204,154,58,0); }
          100% { box-shadow: 0 0 0 0 rgba(204,154,58,0); }
        }
        .step-anim-next { animation: fadeSlideNext 0.32s ease both; }
        .step-anim-prev { animation: fadeSlidePrev 0.32s ease both; }
        .pop-in { animation: popIn 0.35s cubic-bezier(.34,1.56,.64,1) both; }
        .active-ring { animation: ringPulse 1.8s ease-out infinite; }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        className="w-full max-w-5xl h-[92vh] max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: COFFEE.cream,
          "--gold": COFFEE.gold,
          "--goldRing": "rgba(204,154,58,0.18)",
        }}
      >
        {/* Header */}
        <div
          className="shrink-0 px-8 py-6 flex items-center justify-between"
          style={{ background: COFFEE.dark }}
        >
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <span
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: COFFEE.gold }}
              >
                <Home size={20} color={COFFEE.dark} />
              </span>
              {property ? "تعديل العقار" : "إضافة عقار جديد"}
            </h2>
            <p className="mt-2 text-sm" style={{ color: COFFEE.goldLight }}>
              الخطوة {step} من 5 — {STEPS[step - 1].label}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center transition hover:bg-white/10"
          >
            <X color="white" />
          </button>
        </div>

        {/* Stepper */}
        <div className="shrink-0 px-8 py-5 bg-white/60 border-b" style={{ borderColor: COFFEE.line }}>
          <div className="flex items-center">
            {STEPS.map((s, idx) => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        active ? "active-ring" : ""
                      }`}
                      style={{
                        background: done || active ? COFFEE.gold : "white",
                        color: done || active ? COFFEE.dark : COFFEE.stone,
                        border: `2px solid ${done || active ? COFFEE.gold : COFFEE.line}`,
                      }}
                    >
                      {done ? <Check size={16} /> : s.id}
                    </div>
                    <span
                      className="text-[11px] font-bold hidden md:block"
                      style={{ color: active ? COFFEE.dark : COFFEE.stone }}
                    >
                      {s.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className="flex-1 h-[2px] mx-2 rounded-full overflow-hidden bg-stone-200">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: step > s.id ? "100%" : "0%",
                          background: COFFEE.gold,
                        }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 min-h-0">
          <div key={step} className={direction === "next" ? "step-anim-next" : "step-anim-prev"}>
            {step === 1 && (
              <div>
                <SectionTitle icon={Layers}>تصنيف العقار</SectionTitle>

                <div className={labelClass} style={{ color: COFFEE.dark }}>
                  <Home size={16} /> نوع العملية
                </div>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {categories.map((item) => {
                    const selected = propertyData.category === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setField("category", item.id);
                          setField("section", "");
                        }}
                        className="rounded-2xl p-5 text-center font-bold transition-all duration-200 border-2"
                        style={{
                          borderColor: selected ? COFFEE.gold : COFFEE.line,
                          background: selected ? "rgba(204,154,58,0.10)" : "white",
                          color: selected ? COFFEE.dark : COFFEE.stone,
                          transform: selected ? "translateY(-2px)" : "none",
                        }}
                      >
                        {item.name}
                      </button>
                    );
                  })}
                </div>

                <div className={labelClass} style={{ color: COFFEE.dark }}>
                  <Building2 size={16} /> القسم
                </div>
                <div className="flex flex-wrap gap-3 mb-8">
                  {propertyTypes
                    .filter(item => item.category_id == propertyData.category)
                    .map((item) => {
                      const selected = propertyData.section === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setField("section", item.id)}
                          className="px-5 py-2.5 rounded-full font-bold text-sm transition-all border-2"
                          style={{
                            borderColor: selected ? COFFEE.gold : COFFEE.line,
                            background: selected ? COFFEE.gold : "white",
                            color: selected ? COFFEE.dark : COFFEE.stone,
                          }}
                        >
                          {item.name}
                        </button>
                      );
                    })}
                  {!propertyData.category && (
                    <span className="text-sm text-stone-400">اختر نوع العملية الأول</span>
                  )}
                </div>

                <div className={labelClass} style={{ color: COFFEE.dark }}>
                  <MapPin size={16} /> المكان
                </div>
                <div className="flex flex-wrap gap-3">
                  {locations.map((item) => {
                    const selected = propertyData.location === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setField("location", item.id)}
                        className="px-5 py-2.5 rounded-full font-bold text-sm transition-all border-2"
                        style={{
                          borderColor: selected ? COFFEE.gold : COFFEE.line,
                          background: selected ? COFFEE.gold : "white",
                          color: selected ? COFFEE.dark : COFFEE.stone,
                        }}
                      >
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <SectionTitle icon={FileCheck2}>بيانات العقار</SectionTitle>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass} style={{ color: COFFEE.dark }}>
                      اسم العقار
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={propertyData.title}
                      onChange={handleChange}
                      placeholder="مثال: شقة سوبر لوكس بدار مصر"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} style={{ color: COFFEE.dark }}>
                      السعر (جنيه)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={propertyData.price}
                      onChange={handleChange}
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <label className={labelClass} style={{ color: COFFEE.dark }}>
                    الوصف
                  </label>
                  <textarea
                    rows={4}
                    name="description"
                    value={propertyData.description}
                    onChange={handleChange}
                    placeholder="اكتب وصف مختصر عن العقار..."
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-5">
                  <NumberField
                    icon={Ruler}
                    label="المساحة م²"
                    name="area"
                    value={propertyData.area}
                    onChange={handleChange}
                    inputClass={inputClass}
                    labelClass={labelClass}
                    color={COFFEE.dark}
                  />
                  <NumberField
                    icon={BedDouble}
                    label="الغرف"
                    name="rooms"
                    value={propertyData.rooms}
                    onChange={handleChange}
                    inputClass={inputClass}
                    labelClass={labelClass}
                    color={COFFEE.dark}
                  />
                  <NumberField
                    icon={Bath}
                    label="الحمامات"
                    name="bathrooms"
                    value={propertyData.bathrooms}
                    onChange={handleChange}
                    inputClass={inputClass}
                    labelClass={labelClass}
                    color={COFFEE.dark}
                  />
                  <NumberField
                    icon={ArrowUpDown}
                    label="الدور"
                    name="floor"
                    value={propertyData.floor}
                    onChange={handleChange}
                    inputClass={inputClass}
                    labelClass={labelClass}
                    color={COFFEE.dark}
                  />
                </div>

                <div className="mt-6">
                  <div className={labelClass} style={{ color: COFFEE.dark }}>
                    <Paintbrush size={16} /> التشطيب
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {finishingOptions.map((opt) => {
                      const selected = propertyData.finishing === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setField("finishing", opt.value)}
                          className="px-5 py-2.5 rounded-full font-bold text-sm transition-all border-2"
                          style={{
                            borderColor: selected ? COFFEE.gold : COFFEE.line,
                            background: selected ? COFFEE.gold : "white",
                            color: selected ? COFFEE.dark : COFFEE.stone,
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6">
                  <div className={labelClass} style={{ color: COFFEE.dark }}>
                    <Paintbrush size={16} /> التأثيث
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {furnishingOptions.map((opt) => {
                      const selected = propertyData.furnishing === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setField("furnishing", opt.value)}
                          className="px-5 py-2.5 rounded-full font-bold text-sm transition-all border-2"
                          style={{
                            borderColor: selected ? COFFEE.gold : COFFEE.line,
                            background: selected ? COFFEE.gold : "white",
                            color: selected ? COFFEE.dark : COFFEE.stone,
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <SectionTitle icon={Sparkles}>مميزات العقار</SectionTitle>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {amenities.map((feature) => {
                    const Icon = Sparkles;
                    const selected = propertyData.features.includes(feature.id);
                    return (
                      <button
                        type="button"
                        key={feature.id}
                        onClick={() => handleFeatureChange(feature.id)}
                        className="flex items-center gap-3 rounded-2xl p-4 transition-all duration-200 border-2 text-right"
                        style={{
                          borderColor: selected ? COFFEE.gold : COFFEE.line,
                          background: selected ? "rgba(204,154,58,0.10)" : "white",
                          transform: selected ? "translateY(-2px)" : "none",
                        }}
                      >
                        <span
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                          style={{
                            background: selected ? COFFEE.gold : COFFEE.cream,
                            color: COFFEE.dark,
                          }}
                        >
                          <Icon size={17} />
                        </span>
                        <span className="font-bold text-sm" style={{ color: COFFEE.dark }}>
                          {feature.name}
                        </span>
                        {selected && (
                          <Check size={16} className="mr-auto pop-in" color={COFFEE.gold} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <SectionTitle icon={ImagePlus}>الصور والفيديو</SectionTitle>

                <UploadBox
                  icon={ImagePlus}
                  title="صور العقار"
                  hint="اسحب الصور هنا أو اضغط للاختيار (يمكن اختيار أكثر من صورة)"
                  accept="image/*"
                  multiple
                  onChange={handleImages}
                  info={
                    propertyData.images.length > 0
                      ? `تم اختيار ${propertyData.images.length} صورة`
                      : null
                  }
                  color={COFFEE}
                />

                <div className="mt-8">
                  <UploadBox
                    icon={Video}
                    title="فيديو العقار (اختياري)"
                    hint="اضغط لاختيار فيديو للعقار"
                    accept="video/*"
                    onChange={handleVideo}
                    info={propertyData.video ? propertyData.video.name : null}
                    color={COFFEE}
                  />
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <SectionTitle icon={FileCheck2}>مراجعة البيانات</SectionTitle>
                <p className="text-sm mb-6" style={{ color: COFFEE.stone }}>
                  راجع بيانات العقار قبل الحفظ، تقدر ترجع لأي خطوة تعدّل فيها.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ReviewCard title="نوع العملية" value={selectedCategory?.name || "—"} color={COFFEE} />
                  <ReviewCard title="القسم" value={selectedPropertyType?.name || "—"} color={COFFEE} />
                  <ReviewCard title="المكان" value={selectedLocation?.name || "—"} color={COFFEE} />
                  <ReviewCard title="اسم العقار" value={propertyData.title || "—"} color={COFFEE} />
                  <ReviewCard title="السعر" value={propertyData.price ? `${propertyData.price} جنيه` : "—"} color={COFFEE} />
                  <ReviewCard title="المساحة" value={propertyData.area ? `${propertyData.area} م²` : "—"} color={COFFEE} />
                  <ReviewCard title="الغرف / الحمامات" value={`${propertyData.rooms || "—"} / ${propertyData.bathrooms || "—"}`} color={COFFEE} />
                  <ReviewCard title="الدور" value={propertyData.floor || "—"} color={COFFEE} />
                  <ReviewCard title="التشطيب" value={finishingLabel || "—"} color={COFFEE} />
                  <ReviewCard title="التأثيث" value={furnishingLabel || "—"} color={COFFEE} />
                  <ReviewCard title="الصور / الفيديو" value={`${propertyData.images.length} صورة${propertyData.video ? " + فيديو" : ""}`} color={COFFEE} />
                </div>

                <div className="mt-5">
                  <div className="text-xs font-bold mb-2" style={{ color: COFFEE.stone }}>
                    المميزات المختارة
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {propertyData.features.length > 0 ? (
                      selectedAmenities.map((feature) => (
                        <span
                          key={feature.id}
                          className="px-3 py-1.5 rounded-full text-xs font-bold pop-in"
                          style={{
                            background: "rgba(204,154,58,0.15)",
                            color: COFFEE.dark,
                          }}
                        >
                          {feature.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-stone-400">لم يتم اختيار مميزات</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="shrink-0 p-6 flex justify-between items-center relative"
          style={{ background: "white", borderTop: `1px solid ${COFFEE.line}` }}
        >
          {saving && savingMessage && (
            <div
              className="absolute -top-14 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-sm font-bold shadow-lg whitespace-nowrap"
              style={{ background: COFFEE.dark, color: "white" }}
            >
              {savingMessage}
            </div>
          )}

          <button
            disabled={step === 1}
            onClick={goPrev}
            className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 border-2 transition disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ borderColor: COFFEE.line, color: COFFEE.stone }}
          >
            <ChevronRight size={18} />
            السابق
          </button>

          {step < 5 ? (
            <button
              onClick={goNext}
              className="px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition hover:brightness-105"
              style={{ background: COFFEE.gold, color: COFFEE.dark }}
            >
              التالي
              <ChevronLeft size={18} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition hover:brightness-110 pop-in disabled:opacity-60 disabled:cursor-wait"
              style={{ background: "#2F7A4D", color: "white" }}
            >
              <Check size={18} />
              {saving ? "جاري الحفظ..." : (property ? "حفظ التعديلات" : "حفظ العقار")}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <h3
      className="text-xl md:text-2xl font-bold mb-7 flex items-center gap-3"
      style={{ color: COFFEE.dark }}
    >
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: COFFEE.gold }}
      >
        <Icon size={16} color={COFFEE.dark} />
      </span>
      {children}
    </h3>
  );
}

function NumberField({ icon: Icon, label, name, value, onChange, inputClass, labelClass, color }) {
  return (
    <div>
      <div className={labelClass} style={{ color }}>
        <Icon size={15} /> {label}
      </div>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        placeholder="0"
        className={inputClass}
      />
    </div>
  );
}

function UploadBox({ icon: Icon, title, hint, accept, multiple, onChange, info, color }) {
  return (
    <label
      className="block rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition hover:bg-white"
      style={{ borderColor: color.line, background: "rgba(204,154,58,0.04)" }}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
        className="hidden"
      />
      <div
        className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
        style={{ background: color.gold }}
      >
        <Icon size={22} color={color.dark} />
      </div>
      <div className="font-bold" style={{ color: color.dark }}>
        {title}
      </div>
      <div className="text-sm mt-1" style={{ color: color.stone }}>
        {hint}
      </div>
      {info && (
        <div
          className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold pop-in"
          style={{ background: "rgba(204,154,58,0.15)", color: color.dark }}
        >
          {info}
        </div>
      )}
    </label>
  );
}

function ReviewCard({ title, value, color }) {
  return (
    <div className="rounded-2xl p-4 border" style={{ borderColor: color.line, background: "white" }}>
      <div className="text-xs font-bold mb-1" style={{ color: color.stone }}>
        {title}
      </div>
      <div className="font-bold" style={{ color: color.dark }}>
        {value}
      </div>
    </div>
  );
}

export default PropertyForm;