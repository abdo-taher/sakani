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
  markUploadComplete,
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
import MapPicker from "../common/MapPicker";

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
  { id: 1, label: "التصنيف والموقع" },
  { id: 2, label: "البيانات الأساسية" },
  { id: 3, label: "المميزات والتشطيب" },
  { id: 4, label: "الصور والفيديو" },
  { id: 5, label: "المراجعة النهائية" },
];

function PropertyFormWithMap({
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
    coordinates: { latitude: null, longitude: null },
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
    videos: [],
    existingImages: [],
    removedImageIds: [],
    removeVideo: false,
    existingVideoUrl: null,
    existingVideoPublicId: null,
  });

  useEffect(() => {
    if (property) {
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
        images: [],
        videos: [],
        existingImages,
        removedImageIds: [],
        removeVideo: false,
        existingVideoUrl: firstVideo?.image_url || property.video_url || null,
        existingVideoPublicId: firstVideo?.image_public_id || property.video_public_id || null,
      });
    }
  }, [property]);

  const handleChange = (e) => {
    setPropertyData({ ...propertyData, [e.target.name]: e.target.value });
  };

  const setField = (name, value) => {
    setPropertyData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (coordinates) => {
    setPropertyData(prev => ({
      ...prev,
      coordinates
    }));
  };

  const handleLocationSelect = (locationId) => {
    setPropertyData(prev => ({ ...prev, location: locationId }));
    
    // Find selected location and set its coordinates
    const selectedLocation = locations.find(loc => loc.id === parseInt(locationId));
    if (selectedLocation && selectedLocation.latitude && selectedLocation.longitude) {
      setPropertyData(prev => ({
        ...prev,
        coordinates: {
          latitude: parseFloat(selectedLocation.latitude),
          longitude: parseFloat(selectedLocation.longitude)
        }
      }));
    }
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
    const newFiles = Array.from(e.target.files);
    setPropertyData((prev) => ({ ...prev, images: [...prev.images, ...newFiles] }));
  };

  const handleVideo = (e) => {
    const newFiles = Array.from(e.target.files);
    setPropertyData((prev) => ({ ...prev, videos: [...prev.videos, ...newFiles] }));
  };

  const removeNewImage = (index) => {
    setPropertyData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeNewVideo = (index) => {
    setPropertyData((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
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
        console.error("Error loading data:", error);
        errorToast("خطأ في تحميل البيانات");
      }
    };

    loadData();
  }, []);

  const validateStep = () => {
    switch (step) {
      case 1:
        return propertyData.category && propertyData.section && propertyData.location;
      case 2:
        return (
          propertyData.title &&
          propertyData.description &&
          propertyData.price &&
          propertyData.area &&
          propertyData.rooms &&
          propertyData.bathrooms
        );
      case 3:
        return true; // Optional step
      case 4:
        return true; // Optional step  
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep() && step < 5) {
      setDirection("next");
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setDirection("prev");
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setSavingMessage("جاري حفظ البيانات الأساسية...");

    try {
      const formData = {
        title: propertyData.title,
        description: propertyData.description,
        price: parseFloat(propertyData.price),
        property_type_id: parseInt(propertyData.section),
        category_id: parseInt(propertyData.category),
        location_id: parseInt(propertyData.location),
        area: parseInt(propertyData.area),
        rooms: parseInt(propertyData.rooms),
        bathrooms: parseInt(propertyData.bathrooms),
        floor: propertyData.floor ? parseInt(propertyData.floor) : null,
        finishing: propertyData.finishing || null,
        furnishing: propertyData.furnishing || null,
        status: propertyData.status,
        featured: false,
        amenities: propertyData.features,
      };

      if (property) {
        formData.remove_images = propertyData.removedImageIds;
        formData.remove_video = propertyData.removeVideo;

        if (propertyData.removeVideo) {
          formData.video_url = null;
          formData.video_public_id = null;
        }
      }

      let savedProperty;
      if (property) {
        savedProperty = await updateProperty(property.id, formData);
      } else {
        savedProperty = await createProperty(formData);
      }

      const newPropertyId = savedProperty.data?.property?.id || savedProperty.data?.id;

      const totalMedia = propertyData.images.length + propertyData.videos.length;
      let uploadedCount = 0;

      if (propertyData.images.length > 0 || propertyData.videos.length > 0) {
        setSavingMessage("جاري رفع الملفات...");
      }

      for (const image of propertyData.images) {
        try {
          const uploadResult = await uploadToCloudinary(image, "sakani/properties/images");
          await uploadPropertyImage(
            newPropertyId,
            uploadResult.secure_url,
            uploadResult.public_id,
            uploadedCount === 0,
            "image"
          );
          uploadedCount++;
          setSavingMessage(`جاري الرفع (${uploadedCount}/${totalMedia})...`);
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          errorToast(`خطأ في رفع الصورة ${uploadedCount + 1}`);
        }
      }

      for (const video of propertyData.videos) {
        try {
          const uploadResult = await uploadToCloudinary(video, "sakani/properties/videos");
          await uploadPropertyImage(
            newPropertyId,
            uploadResult.secure_url,
            uploadResult.public_id,
            false,
            "video"
          );
          uploadedCount++;
          setSavingMessage(`جاري الرفع (${uploadedCount}/${totalMedia})...`);
        } catch (videoError) {
          console.error("Error uploading video:", videoError);
          errorToast(`خطأ في رفع الفيديو`);
        }
      }

      setSavingMessage("تم الحفظ بنجاح!");

      if (!property) {
        try { await markUploadComplete(newPropertyId); } catch { /* empty */ }
      }

      setTimeout(() => {
        setSaving(false);
        successToast(property ? "تم تحديث العقار بنجاح" : "تم إنشاء العقار بنجاح");
        loadProperties();
        onClose();
      }, 1000);
      
    } catch (error) {
      setSaving(false);
      console.error("Error saving property:", error);
      
      let errorMessage = "حدث خطأ أثناء الحفظ";
      if (error.response?.data?.errors) {
        const errors = Object.values(error.response.data.errors).flat();
        errorMessage = errors.join(", ");
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      errorToast(errorMessage);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">اختر نوع وموقع العقار</h3>
              <p className="text-gray-600">حدد التصنيف ونوع العقار والموقع الجغرافي</p>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Home className="inline w-4 h-4 ml-2" />
                نوع العقار
              </label>
              <select
                name="category"
                value={propertyData.category}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">اختر نوع العقار</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Property Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="inline w-4 h-4 ml-2" />
                القسم
              </label>
              <select
                name="section"
                value={propertyData.section}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">اختر القسم</option>
                {propertyTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline w-4 h-4 ml-2" />
                المحافظة
              </label>
              <select
                name="location"
                value={propertyData.location}
                onChange={(e) => handleLocationSelect(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">اختر المحافظة</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Map Display */}
            {propertyData.coordinates.latitude && propertyData.coordinates.longitude && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  موقع العقار على الخريطة
                </label>
                <MapPicker
                  latitude={propertyData.coordinates.latitude}
                  longitude={propertyData.coordinates.longitude}
                  onLocationChange={handleLocationChange}
                  height="300px"
                />
                <p className="text-sm text-gray-500 mt-2">
                  يمكنك النقر على الخريطة لتحديد الموقع الدقيق للعقار
                </p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">البيانات الأساسية</h3>
              <p className="text-gray-600">أدخل تفاصيل العقار الأساسية</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                <input
                  type="text"
                  name="title"
                  value={propertyData.title}
                  onChange={handleChange}
                  placeholder="مثال: شقة للبيع في المعادي"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                <textarea
                  name="description"
                  value={propertyData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="وصف تفصيلي للعقار..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">السعر (جنيه مصري)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="price"
                  value={propertyData.price}
                  onChange={handleChange}
                  onKeyDown={(e) => { if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault(); }}
                  onPaste={(e) => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text").replace(/[^0-9]/g, "")); }}
                  min="0"
                  placeholder="0"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المساحة (متر مربع)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="area"
                  value={propertyData.area}
                  onChange={handleChange}
                  onKeyDown={(e) => { if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault(); }}
                  onPaste={(e) => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text").replace(/[^0-9]/g, "")); }}
                  min="0"
                  placeholder="0"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عدد الغرف</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="rooms"
                  value={propertyData.rooms}
                  onChange={handleChange}
                  onKeyDown={(e) => { if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault(); }}
                  onPaste={(e) => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text").replace(/[^0-9]/g, "")); }}
                  min="0"
                  placeholder="0"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عدد الحمامات</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="bathrooms"
                  value={propertyData.bathrooms}
                  onChange={handleChange}
                  onKeyDown={(e) => { if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault(); }}
                  onPaste={(e) => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text").replace(/[^0-9]/g, "")); }}
                  min="0"
                  placeholder="0"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الطابق (اختياري)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="floor"
                  value={propertyData.floor}
                  onChange={handleChange}
                  onKeyDown={(e) => { if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault(); }}
                  onPaste={(e) => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text").replace(/[^0-9]/g, "")); }}
                  min="0"
                  placeholder="الطابق"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">المميزات والتشطيب</h3>
              <p className="text-gray-600">اختر مستوى التشطيب ومميزات العقار</p>
            </div>

            {/* Finishing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">مستوى التشطيب</label>
              <select
                name="finishing"
                value={propertyData.finishing}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">اختر مستوى التشطيب</option>
                <option value="super_lux">سوبر لوكس</option>
                <option value="lux">لوكس</option>
                <option value="semi_finished">نصف تشطيب</option>
                <option value="red_brick">على الطوب الأحمر</option>
              </select>
            </div>

            {/* Furnishing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">التأثيث</label>
              <select
                name="furnishing"
                value={propertyData.furnishing}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">اختر حالة التأثيث</option>
                <option value="furnished">مؤثث</option>
                <option value="unfurnished">غير مؤثث</option>
              </select>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">المميزات المتاحة</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {amenities.map((amenity) => (
                  <label
                    key={amenity.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      propertyData.features.includes(amenity.id)
                        ? "border-amber-500 bg-amber-50"
                        : "border-gray-300 hover:border-amber-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={propertyData.features.includes(amenity.id)}
                      onChange={() => handleFeatureChange(amenity.id)}
                      className="sr-only"
                    />
                    <span className="text-sm">{amenity.name}</span>
                    {propertyData.features.includes(amenity.id) && (
                      <Check className="w-4 h-4 text-amber-600 mr-auto" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">الصور والفيديو</h3>
              <p className="text-gray-600">أضف صور ومقطع فيديو للعقار</p>
            </div>

            {/* Existing Images in edit mode */}
            {property && propertyData.existingImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الصور الحالية ({propertyData.existingImages.length})
                </label>
                <div className="flex flex-wrap gap-3">
                  {propertyData.existingImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.image_url}
                        alt=""
                        className="w-24 h-24 rounded-xl object-cover border-2"
                        style={{ borderColor: img.is_primary ? '#d97706' : '#e5e7eb' }}
                      />
                      {img.is_primary && (
                        <span className="absolute -top-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#d97706' }}>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  فيديو العقار الحالي
                </label>
                <div className="relative inline-block group">
                  <video
                    src={propertyData.existingVideoUrl}
                    className="w-64 h-36 rounded-xl object-cover border-2 border-gray-300"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ImagePlus className="inline w-4 h-4 ml-2" />
                صور العقار
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImages}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">يمكنك اختيار عدة صور</p>
              {propertyData.images.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {propertyData.images.map((file, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        className="w-24 h-24 rounded-xl object-cover border-2 border-amber-500"
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

            {/* Video Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Video className="inline w-4 h-4 ml-2" />
                فيديوهات العقار (اختياري)
              </label>
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={handleVideo}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              {propertyData.videos.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {propertyData.videos.map((file, idx) => (
                    <div key={idx} className="relative group">
                      <video
                        src={URL.createObjectURL(file)}
                        className="w-32 h-20 rounded-xl object-cover border-2 border-amber-600"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewVideo(idx)}
                        className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                      >
                        ✕
                      </button>
                      <div className="text-[10px] mt-1 text-gray-400 truncate max-w-[128px]">{file.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">مراجعة البيانات</h3>
              <p className="text-gray-600">تأكد من صحة جميع البيانات قبل الحفظ</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div><strong>نوع العقار:</strong> {categories.find(c => c.id == propertyData.category)?.name}</div>
              <div><strong>القسم:</strong> {propertyTypes.find(t => t.id == propertyData.section)?.name}</div>
              <div><strong>الموقع:</strong> {locations.find(l => l.id == propertyData.location)?.name}</div>
              <div><strong>العنوان:</strong> {propertyData.title}</div>
              <div><strong>السعر:</strong> {propertyData.price} جنيه مصري</div>
              <div><strong>المساحة:</strong> {propertyData.area} متر مربع</div>
              <div><strong>الغرف:</strong> {propertyData.rooms} | <strong>الحمامات:</strong> {propertyData.bathrooms}</div>
              {propertyData.finishing && <div><strong>التشطيب:</strong> {propertyData.finishing}</div>}
              {propertyData.furnishing && <div><strong>التأثيث:</strong> {propertyData.furnishing === "furnished" ? "مؤثث" : "غير مؤثث"}</div>}
              <div><strong>عدد المميزات:</strong> {propertyData.features.length}</div>
              <div><strong>عدد الصور:</strong> {(propertyData.existingImages?.length || 0) + propertyData.images.length}</div>
              {((propertyData.existingVideoUrl && !propertyData.removeVideo) || propertyData.videos.length > 0) && <div><strong>فيديو:</strong> تم إرفاق فيديو</div>}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (saving) {
    return createPortal(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">جاري الحفظ...</h3>
          <p className="text-gray-600">{savingMessage}</p>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <h2 className="text-xl font-bold">
            {property ? "تعديل العقار" : "إضافة عقار جديد"}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((stepItem, index) => (
              <div key={stepItem.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepItem.id
                      ? "bg-amber-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step > stepItem.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    stepItem.id
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step > stepItem.id ? "bg-amber-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <span className="text-sm text-gray-600">
              الخطوة {step} من {STEPS.length}: {STEPS.find(s => s.id === step)?.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: "60vh" }}>
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className={`flex items-center px-4 py-2 rounded-lg font-medium ${
              step === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <ChevronRight className="w-4 h-4 ml-2" />
            السابق
          </button>

          <div className="text-sm text-gray-500">
            {step} / {STEPS.length}
          </div>

          {step < 5 ? (
            <button
              onClick={nextStep}
              disabled={!validateStep()}
              className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                !validateStep()
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-amber-500 text-white hover:bg-amber-600"
              }`}
            >
              التالي
              <ChevronLeft className="w-4 h-4 mr-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
            >
              <FileCheck2 className="w-4 h-4 ml-2" />
              حفظ العقار
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default PropertyFormWithMap;