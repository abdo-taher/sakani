import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  X,
  ArrowRight,
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
  markUploadComplete,
} from "../../services/propertyService";
import { getCategories } from "../../services/categoryService";
import { getAmenities } from "../../services/amenityService";
import { getPropertyTypes } from "../../services/propertyTypeService";
import { getTags } from "../../services/tagService";
import { uploadPropertyImage } from "../../services/propertyImageService";
import {
  successToast,
  errorToast,
} from "../../utils/toast";
import { uploadToCloudinary } from "../../services/cloudinaryService";
import { numbersOnly } from "../../utils/numbersOnly";
import { fmtPrice, SAMPLE_IMG } from "../../utils/helpers";
import { extractVideoThumbnail, blobToFile } from "../../utils/videoThumbnail";

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
  pageMode = false,
}) {
  const navigate = useNavigate();
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
    tags: [],
    images: [],
    videos: [],
    existingImages: [],
    removedImageIds: [],
    removeVideo: false,
    existingVideoUrl: null,
    existingVideoPublicId: null,
    videoThumbnails: [],
    has_detailed_rooms: false,
    roomsData: [],
  });

  useEffect(() => {
    if (property && property.id) { // Only run when we have a property with an ID
      const existingImages = (property.images || []).filter(img => (img.media_type || 'image') === 'image');
      const existingVideos = (property.images || []).filter(img => img.media_type === 'video');
      const firstVideo = existingVideos.length > 0 ? existingVideos[0] : null;

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
        tags: property.tags
          ? property.tags.map(item => item.id)
          : [],
        images: [],
        videos: [],
        existingImages,
        removedImageIds: [],
        removeVideo: false,
        existingVideoUrl: firstVideo?.image_url || property.video_url || null,
        existingVideoPublicId: firstVideo?.image_public_id || property.video_public_id || null,
        videoThumbnails: [],
        has_detailed_rooms: property.has_detailed_rooms || false,
        roomsData: (property.detailed_rooms || []).map(r => ({
          id: r.id, // Keep the ID to prevent duplication
          name: r.name || "",
          description: r.description || "",
          price: r.price || "",
          area: r.area || "",
        })),
      });
    }
  }, [property?.id]); // Only depend on property.id, not the entire property object

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

  const handleTagChange = (tagId) => {
    setPropertyData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((id) => id !== tagId)
        : [...prev.tags, tagId],
    }));
  };

  const addRoom = () => {
    setPropertyData((prev) => ({
      ...prev,
      roomsData: [...prev.roomsData, { name: "", description: "", price: "", area: "" }],
    }));
  };

  const removeRoom = (index) => {
    setPropertyData((prev) => ({
      ...prev,
      roomsData: prev.roomsData.filter((_, i) => i !== index),
    }));
  };

  const updateRoom = (index, field, value) => {
    setPropertyData((prev) => ({
      ...prev,
      roomsData: prev.roomsData.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    }));
  };

  const handleImages = (e) => {
    const newFiles = Array.from(e.target.files);
    setPropertyData((prev) => ({ ...prev, images: [...prev.images, ...newFiles] }));
  };

  const handleVideo = async (e) => {
    const newFiles = Array.from(e.target.files);
    setPropertyData((prev) => ({ ...prev, videos: [...prev.videos, ...newFiles] }));

    for (const file of newFiles) {
      try {
        const thumbBlob = await extractVideoThumbnail(file);
        const thumbUrl = URL.createObjectURL(thumbBlob);
        setPropertyData((prev) => ({
          ...prev,
          videoThumbnails: [...prev.videoThumbnails, { file, thumbUrl, thumbBlob }],
        }));
      } catch {
        setPropertyData((prev) => ({
          ...prev,
          videoThumbnails: [...prev.videoThumbnails, { file, thumbUrl: null, thumbBlob: null }],
        }));
      }
    }
  };

  const removeNewVideo = (index) => {
    setPropertyData((prev) => {
      const thumb = prev.videoThumbnails[index];
      if (thumb?.thumbUrl) URL.revokeObjectURL(thumb.thumbUrl);
      return {
        ...prev,
        videos: prev.videos.filter((_, i) => i !== index),
        videoThumbnails: prev.videoThumbnails.filter((_, i) => i !== index),
      };
    });
  };

  const removeNewImage = (index) => {
    setPropertyData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeExistingImage = (id) => {
    setPropertyData((prev) => ({
      ...prev,
      existingImages: prev.existingImages.filter((img) => img.id !== id),
      removedImageIds: [...prev.removedImageIds, id],
    }));
  };

  const removeExistingVideo = () => {
    setPropertyData((prev) => ({
      ...prev,
      existingVideoUrl: null,
      existingVideoPublicId: null,
      removeVideo: true,
    }));
  };

  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [allTags, setAllTags] = useState([]);
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

        const tagsData = await getTags();
        setAllTags(tagsData);

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

  const bodyRef = React.useRef(null);
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [step]);

  const handleSave = async () => {
    if (!propertyData.category || !propertyData.section || !propertyData.location) {
      errorToast("فيه بيانات تصنيف ناقصة (نوع العملية / القسم / المكان)، ارجع لخطوة التصنيف");
      setStep(1);
      return;
    }

    setSaving(true);
    try {

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
        tags: propertyData.tags,
        has_detailed_rooms: propertyData.has_detailed_rooms,
      };

      if (propertyData.has_detailed_rooms && propertyData.roomsData.length > 0) {
        data.rooms_data = propertyData.roomsData.filter(r => r.name && r.price);
      }

      if (property) {
        data.remove_images = propertyData.removedImageIds;
        data.remove_video = propertyData.removeVideo;

        if (propertyData.removeVideo) {
          data.video_url = null;
          data.video_public_id = null;
        }

        setSavingMessage("جاري حفظ التعديلات...");
        await updateProperty(property.id, data);

        let uploadedCount = 0;
        const totalNew = propertyData.images.filter(i => i instanceof File).length + propertyData.videos.length;

        const newImages = propertyData.images.filter(i => i instanceof File);
        for (const image of newImages) {
          setSavingMessage(`جاري رفع الصور (${uploadedCount + 1}/${totalNew})...`);
          const uploaded = await uploadToCloudinary(image, "sakani/properties/images");
          await uploadPropertyImage(
            property.id,
            uploaded.secure_url,
            uploaded.public_id,
            propertyData.existingImages.length === 0 && uploadedCount === 0,
            "image"
          );
          uploadedCount++;
        }

        for (const video of propertyData.videos) {
          setSavingMessage(`جاري رفع الفيديوهات (${uploadedCount + 1}/${totalNew})...`);
          const uploaded = await uploadToCloudinary(video, "sakani/properties/videos");
          await uploadPropertyImage(
            property.id,
            uploaded.secure_url,
            uploaded.public_id,
            false,
            "video"
          );

          const thumbEntry = propertyData.videoThumbnails.find(
            (t) => t.file === video
          );
          if (thumbEntry?.thumbBlob) {
            const thumbFile = blobToFile(thumbEntry.thumbBlob, `${video.name.replace(/\.[^.]+$/, "")}_thumb.jpg`);
            const uploadedThumb = await uploadToCloudinary(thumbFile, "sakani/properties/thumbnails");
            await uploadPropertyImage(
              property.id,
              uploadedThumb.secure_url,
              uploadedThumb.public_id,
              false,
              "image",
              "property",
              uploaded.public_id
            );
          }

          uploadedCount++;
        }

        successToast("تم تعديل العقار بنجاح");
        await loadProperties();
        pageMode ? navigate("/dashboard/properties") : onClose();

      } else {

        setSavingMessage("جاري حفظ بيانات العقار...");
        const response = await createProperty(data);

        const propertyId = response.data.property.id;

        const totalMedia = propertyData.images.length + propertyData.videos.length;

        if (totalMedia === 0) {
          await markUploadComplete(propertyId);
          await loadProperties();
          successToast("تم إضافة العقار بنجاح");
          pageMode ? navigate("/dashboard/properties") : onClose();
        } else {
          successToast("تم إضافة العقار — جاري رفع الوسائط في الخلفية...");
          pageMode ? navigate("/dashboard/properties") : onClose();

          (async () => {
            let uploadedCount = 0;
            try {
              for (const image of propertyData.images) {
                const uploaded = await uploadToCloudinary(image, "sakani/properties/images");
                await uploadPropertyImage(
                  propertyId,
                  uploaded.secure_url,
                  uploaded.public_id,
                  uploadedCount === 0,
                  "image"
                );
                uploadedCount++;
              }

              for (const video of propertyData.videos) {
                const uploaded = await uploadToCloudinary(video, "sakani/properties/videos");
                await uploadPropertyImage(
                  propertyId,
                  uploaded.secure_url,
                  uploaded.public_id,
                  false,
                  "video"
                );

                const thumbEntry = propertyData.videoThumbnails.find(
                  (t) => t.file === video
                );
                if (thumbEntry?.thumbBlob) {
                  const thumbFile = blobToFile(thumbEntry.thumbBlob, `${video.name.replace(/\.[^.]+$/, "")}_thumb.jpg`);
                  const uploadedThumb = await uploadToCloudinary(thumbFile, "sakani/properties/thumbnails");
                  await uploadPropertyImage(
                    propertyId,
                    uploadedThumb.secure_url,
                    uploadedThumb.public_id,
                    false,
                    "image",
                    "property",
                    uploaded.public_id
                  );
                }

                uploadedCount++;
              }

              await markUploadComplete(propertyId);
              window.dispatchEvent(new Event("property-uploaded"));
              successToast("تم رفع جميع الوسائط بنجاح");
            } catch (err) {
              console.error("Background upload failed:", err);
              await markUploadComplete(propertyId);
              window.dispatchEvent(new Event("property-uploaded"));
              errorToast("حدث خطأ أثناء رفع بعض الوسائط");
            }
          })();
        }

      }

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

  const formContent = (
    <>
      {/* Header */}
      <div
        className="shrink-0 px-4 md:px-8 py-4 md:py-6 flex items-center justify-between"
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
          onClick={pageMode ? () => navigate("/dashboard/properties") : onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center transition hover:bg-white/10"
        >
          {pageMode ? <ArrowRight color="white" /> : <X color="white" />}
        </button>
      </div>

      {/* Stepper */}
      <div className="shrink-0 px-4 md:px-8 py-3 md:py-5 bg-white/60 border-b" style={{ borderColor: COFFEE.line }}>
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
      <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 md:p-8 min-h-0" style={{ scrollBehavior: "auto" }}>
          <div key={step} className={direction === "next" ? "step-anim-next" : "step-anim-prev"}>
            {step === 1 && (
              <div>
                <SectionTitle icon={Layers}>تصنيف العقار</SectionTitle>

                <div className={labelClass} style={{ color: COFFEE.dark }}>
                  <Home size={16} /> نوع العملية
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
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
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="price"
                      value={propertyData.price}
                      onChange={handleChange}
                      onKeyDown={numbersOnly.onKeyDown}
                      onPaste={numbersOnly.onPaste}
                      min="0"
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
                  {selectedCategory?.slug !== "rent" && (
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
                  )}
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

                {selectedCategory?.slug === "rent" && (
                  <div className="mt-6">
                    <div className={labelClass} style={{ color: COFFEE.dark }}>
                      <BedDouble size={16} /> طريقة التأجير
                    </div>
                    <div className="flex gap-3 mb-4">
                      <button
                        type="button"
                        onClick={() => setField("has_detailed_rooms", false)}
                        className="px-5 py-3 rounded-xl font-bold text-sm transition-all border-2 flex-1"
                        style={{
                          borderColor: !propertyData.has_detailed_rooms ? COFFEE.gold : COFFEE.line,
                          background: !propertyData.has_detailed_rooms ? "rgba(204,154,58,0.10)" : "white",
                          color: !propertyData.has_detailed_rooms ? COFFEE.dark : COFFEE.stone,
                        }}
                      >
                        إيجار شامل (عقار كامل)
                      </button>
                      <button
                        type="button"
                        onClick={() => setField("has_detailed_rooms", true)}
                        className="px-5 py-3 rounded-xl font-bold text-sm transition-all border-2 flex-1"
                        style={{
                          borderColor: propertyData.has_detailed_rooms ? COFFEE.gold : COFFEE.line,
                          background: propertyData.has_detailed_rooms ? "rgba(204,154,58,0.10)" : "white",
                          color: propertyData.has_detailed_rooms ? COFFEE.dark : COFFEE.stone,
                        }}
                      >
                        إيجار بالغرف (غرف منفصلة)
                      </button>
                    </div>

                    {propertyData.has_detailed_rooms && (
                      <div>
                        <p className="text-xs mb-4" style={{ color: COFFEE.stone }}>
                          أضف كل غرفة بالتفصيل — اسم وسعر ومساحة. الصور تتم إضافتها بعد حفظ العقار.
                        </p>
                        {propertyData.roomsData.map((room, idx) => (
                          <div
                            key={idx}
                            className="rounded-2xl border-2 p-4 mb-3 relative"
                            style={{ borderColor: COFFEE.line, background: "white" }}
                          >
                            <button
                              type="button"
                              onClick={() => removeRoom(idx)}
                              className="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition hover:bg-red-50"
                              style={{ color: "#DC2626" }}
                            >
                              ✕
                            </button>
                            <div className="text-xs font-bold mb-3" style={{ color: COFFEE.gold }}>
                              غرفة {idx + 1}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="اسم الغرفة *"
                                value={room.name}
                                onChange={(e) => updateRoom(idx, "name", e.target.value)}
                                className={inputClass}
                              />
                              <input
                                type="number"
                                placeholder="السعر (ج.م/شهر) *"
                                value={room.price}
                                onChange={(e) => updateRoom(idx, "price", e.target.value)}
                                className={inputClass}
                              />
                              <input
                                type="number"
                                placeholder="المساحة (م²)"
                                value={room.area}
                                onChange={(e) => updateRoom(idx, "area", e.target.value)}
                                className={inputClass}
                              />
                              <input
                                type="text"
                                placeholder="وصف اختياري"
                                value={room.description}
                                onChange={(e) => updateRoom(idx, "description", e.target.value)}
                                className={inputClass}
                              />
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addRoom}
                          className="w-full py-3 rounded-xl font-bold text-sm border-2 border-dashed transition hover:bg-stone-50"
                          style={{ borderColor: COFFEE.gold, color: COFFEE.dark }}
                        >
                          + إضافة غرفة
                        </button>
                      </div>
                    )}
                  </div>
                )}
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

                {allTags.length > 0 && (
                  <div className="mt-6">
                    <SectionTitle icon={Sparkles}>التاغات (للعقارات المشابهة)</SectionTitle>
                    <p className="text-xs mb-3" style={{ color: COFFEE.stone }}>
                      اختر التاغات لتسهيل العثور على عقارات مشابهة
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => {
                        const selected = propertyData.tags.includes(tag.id);
                        return (
                          <button
                            type="button"
                            key={tag.id}
                            onClick={() => handleTagChange(tag.id)}
                            className="px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border-2"
                            style={{
                              borderColor: selected ? COFFEE.gold : COFFEE.line,
                              background: selected ? COFFEE.gold : "white",
                              color: selected ? "white" : COFFEE.dark,
                            }}
                          >
                            {selected && <Check size={14} className="inline ml-1" />}
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div>
                <SectionTitle icon={ImagePlus}>الصور والفيديو</SectionTitle>

                {/* Existing Images in edit mode */}
                {property && propertyData.existingImages.length > 0 && (
                  <div className="mb-6">
                    <div className="text-xs font-bold mb-3" style={{ color: COFFEE.stone }}>
                      الصور الحالية ({propertyData.existingImages.length})
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {propertyData.existingImages.map((img) => (
                        <div key={img.id} className="relative group">
                          <img
                            src={img.image_url}
                            alt=""
                            className="w-24 h-24 rounded-xl object-cover border-2"
                            style={{ borderColor: img.is_primary ? COFFEE.gold : COFFEE.line }}
                            onError={(e) => { e.target.onerror = null; e.target.src = SAMPLE_IMG(img.id || 'property'); }}
                          />
                          {img.is_primary && (
                            <span className="absolute -top-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white pop-in" style={{ background: COFFEE.gold }}>
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

                {/* Existing Video in edit mode */}
                {property && propertyData.existingVideoUrl && !propertyData.removeVideo && (
                  <div className="mb-6">
                    <div className="text-xs font-bold mb-3" style={{ color: COFFEE.stone }}>
                      فيديو العقار الحالي
                    </div>
                    <div className="relative inline-block group">
                      <video
                        src={propertyData.existingVideoUrl}
                        className="w-64 h-36 rounded-xl object-cover border-2"
                        style={{ borderColor: COFFEE.line }}
                      />
                      <button
                        type="button"
                        onClick={removeExistingVideo}
                        className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* New Images Upload */}
                <UploadBox
                  icon={ImagePlus}
                  title="صور العقار"
                  hint="اسحب الصور هنا أو اضغط للاختيار (يمكن اختيار أكثر من صورة)"
                  accept="image/*"
                  multiple
                  onChange={handleImages}
                  info={
                    propertyData.images.length > 0
                      ? `تم اختيار ${propertyData.images.length} صورة جديدة`
                      : null
                  }
                  color={COFFEE}
                />

                {/* New Images Preview */}
                {propertyData.images.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {propertyData.images.map((file, idx) => (
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

                {/* Video Upload */}
                <div className="mt-8">
                  <UploadBox
                    icon={Video}
                    title="فيديوهات العقار (اختياري)"
                    hint="اضغط لاختيار فيديوهات للعقار (يمكن اختيار أكثر من فيديو)"
                    accept="video/*"
                    multiple
                    onChange={handleVideo}
                    info={propertyData.videos.length > 0 ? `تم اختيار ${propertyData.videos.length} فيديو` : null}
                    color={COFFEE}
                  />
                  {propertyData.videos.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-4">
                      {propertyData.videos.map((file, idx) => {
                        const thumb = propertyData.videoThumbnails[idx];
                        return (
                          <div key={idx} className="relative group w-24 h-24">
                            <div className="w-full h-full rounded-xl overflow-hidden border-2" style={{ borderColor: COFFEE.gold }}>
                              {thumb?.thumbUrl ? (
                                <img
                                  src={thumb.thumbUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-stone-100 flex items-center justify-center animate-pulse">
                                  <Video className="w-6 h-6 text-stone-400" />
                                </div>
                              )}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-xl">
                              <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                                <Video className="w-4 h-4 text-white" />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeNewVideo(idx)}
                              className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold hover:bg-red-600"
                            >
                              ✕
                            </button>
                            <div className="text-[10px] mt-1 text-stone-400 truncate max-w-[96px]">{file.name}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Total count */}
                <div className="mt-4 text-sm font-bold" style={{ color: COFFEE.stone }}>
                  الإجمالي: {propertyData.existingImages.length + propertyData.images.length} صورة
                  {propertyData.existingVideoUrl && !propertyData.removeVideo ? " + فيديو" : ""}
                  {propertyData.videos.length > 0 ? ` + ${propertyData.videos.length} فيديو جديد` : ""}
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
                  {selectedCategory?.slug !== "rent" && (
                    <ReviewCard title="المساحة" value={propertyData.area ? `${propertyData.area} م²` : "—"} color={COFFEE} />
                  )}
                  <ReviewCard title="الغرف / الحمامات" value={`${propertyData.rooms || "—"} / ${propertyData.bathrooms || "—"}`} color={COFFEE} />
                  <ReviewCard title="الدور" value={propertyData.floor || "—"} color={COFFEE} />
                  <ReviewCard title="التشطيب" value={finishingLabel || "—"} color={COFFEE} />
                  <ReviewCard title="التأثيث" value={furnishingLabel || "—"} color={COFFEE} />
                  <ReviewCard title="الصور / الفيديو" value={`${(propertyData.existingImages?.length || 0) + propertyData.images.length} صورة${((propertyData.existingVideoUrl && !propertyData.removeVideo) || propertyData.videos.length > 0) ? " + فيديو" : ""}`} color={COFFEE} />
                </div>

                {propertyData.has_detailed_rooms && propertyData.roomsData.length > 0 && (
                  <div className="mt-5">
                    <div className="text-xs font-bold mb-2" style={{ color: COFFEE.stone }}>
                      الغرف بالتفصيل ({propertyData.roomsData.length} غرف)
                    </div>
                    <div className="space-y-2">
                      {propertyData.roomsData.map((room, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl border"
                          style={{ borderColor: COFFEE.line, background: "white" }}
                        >
                          <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: COFFEE.gold, color: "white" }}>{idx + 1}</span>
                          <span className="font-bold text-sm" style={{ color: COFFEE.dark }}>{room.name}</span>
                          <span className="text-xs" style={{ color: COFFEE.stone }}>{room.price ? `${fmtPrice(room.price)}/شهر` : ""}</span>
                          {room.area > 0 && <span className="text-xs" style={{ color: COFFEE.stone }}>{room.area} م²</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

                {propertyData.tags.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs font-bold mb-2" style={{ color: COFFEE.stone }}>
                      التاغات
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {allTags.filter(t => propertyData.tags.includes(t.id)).map((tag) => (
                        <span
                          key={tag.id}
                          className="px-3 py-1.5 rounded-full text-xs font-bold pop-in"
                          style={{
                            background: COFFEE.gold,
                            color: "white",
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
    </>
  );

  if (pageMode) {
    return (
      <div dir="rtl" style={{ background: COFFEE.cream, "--gold": COFFEE.gold, "--goldRing": "rgba(204,154,58,0.18)" }}>
        <style>{`
          @keyframes fadeSlideNext { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes fadeSlidePrev { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes popIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
          @keyframes ringPulse { 0% { box-shadow: 0 0 0 0 rgba(204,154,58,0.45); } 70% { box-shadow: 0 0 0 8px rgba(204,154,58,0); } 100% { box-shadow: 0 0 0 0 rgba(204,154,58,0); } }
          .step-anim-next { animation: fadeSlideNext 0.32s ease both; }
          .step-anim-prev { animation: fadeSlidePrev 0.32s ease both; }
          .pop-in { animation: popIn 0.35s cubic-bezier(.34,1.56,.64,1) both; }
          .active-ring { animation: ringPulse 1.8s ease-out infinite; }
        `}</style>
        <div className="w-full min-h-[80vh] flex flex-col rounded-3xl overflow-hidden shadow-sm my-4">
          {formContent}
        </div>
      </div>
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: "rgba(20,14,9,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeSlideNext { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeSlidePrev { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        @keyframes ringPulse { 0% { box-shadow: 0 0 0 0 rgba(204,154,58,0.45); } 70% { box-shadow: 0 0 0 8px rgba(204,154,58,0); } 100% { box-shadow: 0 0 0 0 rgba(204,154,58,0); } }
        .step-anim-next { animation: fadeSlideNext 0.32s ease both; }
        .step-anim-prev { animation: fadeSlidePrev 0.32s ease both; }
        .pop-in { animation: popIn 0.35s cubic-bezier(.34,1.56,.64,1) both; }
        .active-ring { animation: ringPulse 1.8s ease-out infinite; }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        className="w-full max-w-5xl h-[92vh] max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: COFFEE.cream, "--gold": COFFEE.gold, "--goldRing": "rgba(204,154,58,0.18)" }}
      >
        {formContent}
      </div>
    </div>,
    document.body
  );
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
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        name={name}
        value={value}
        onChange={onChange}
        onKeyDown={numbersOnly.onKeyDown}
        onPaste={numbersOnly.onPaste}
        min="0"
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