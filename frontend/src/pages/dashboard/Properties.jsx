import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle";

import PropertyHeader from "../../components/properties/PropertyHeader";
import PropertyToolbar from "../../components/properties/PropertyToolbar";
import PropertyTable from "../../components/properties/PropertyTable";
import {
  getProperties,
  deleteProperty,
  changePropertyStatus,
  markUploadComplete,
} from "../../services/propertyService";
import PropertyPreviewModal from "../../components/properties/PropertyPreviewModal";
import Swal from "sweetalert2";

import {
  successToast,
  errorToast,
} from "../../utils/toast";
import { getCategories } from "../../services/categoryService";
import { getLocations } from "../../services/locationService";
function Properties() {
  usePageTitle("إدارة العقارات — سكني");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
const [properties, setProperties] = useState([]);
const [categories, setCategories] = useState([]);
const [locations, setLocations] = useState([]);
const [previewProperty, setPreviewProperty] = useState(null);

const loadProperties = async () => {
  try {
    const data = await getProperties();
    setProperties(data);
  } catch (error) {
    errorToast("تعذر تحميل العقارات");
    console.error(error);
  }
};

const checkStuckUploads = async () => {
  try {
    const data = await getProperties();
    const stuck = data.filter((p) => {
      if (!p.is_uploading) return false;
      const createdAt = new Date(p.created_at);
      const minutesSince = (Date.now() - createdAt.getTime()) / 60000;
      return minutesSince > 10;
    });
    if (stuck.length > 0) {
      await Promise.all(stuck.map((p) => markUploadComplete(p.id)));
      const refreshed = await getProperties();
      setProperties(refreshed);
    }
  } catch { /* empty */ }
};

const loadCategories = async () => {
  try {
    const data = await getCategories();
    setCategories(data);
  } catch (error) {
    errorToast("تعذر تحميل الأقسام");
  }
};

const loadLocations = async () => {
  try {
    const data = await getLocations();
    setLocations(data);
  } catch (error) {
    errorToast("تعذر تحميل الأماكن");
  }
};

useEffect(() => {
  loadProperties();
  loadCategories();
  loadLocations();
  const interval = setInterval(checkStuckUploads, 30000);

  const onPropertyUploaded = () => loadProperties();
  window.addEventListener("property-uploaded", onPropertyUploaded);

  return () => {
    clearInterval(interval);
    window.removeEventListener("property-uploaded", onPropertyUploaded);
  };
}, []);
  

  const filteredProperties = properties.filter((property) => {
    const matchSearch = property.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchType = !type || property.category?.name === type;
    const matchStatus = !status || property.status === status;
    const matchLocation = !location || property.location?.name === location;

    return matchSearch && matchType && matchStatus && matchLocation;
  });

  return (
    <div className="space-y-6"> 
     <PropertyHeader
  onAdd={() => navigate("/dashboard/properties/create")}
/>

      <PropertyToolbar
    search={search}
    setSearch={setSearch}

    type={type}
    setType={setType}

    status={status}
    setStatus={setStatus}

    location={location}
    setLocation={setLocation}

    categories={categories}
    locations={locations}
/>

    <PropertyTable
  properties={filteredProperties}
  onPreview={(property) => {
    setPreviewProperty(property);
  }}
        onEdit={(property) => {
          navigate(`/dashboard/properties/${property.id}/edit`);
        }}
       onDelete={async (id) => {

  const result = await Swal.fire({

    title: "حذف العقار؟",

    text: "لن تستطيع استرجاعه بعد الحذف",

    icon: "warning",

    showCancelButton: true,

    confirmButtonText: "حذف",

    cancelButtonText: "إلغاء",

    confirmButtonColor: "#DC2626",

    cancelButtonColor: "#6B7280",

  });

  if (!result.isConfirmed) return;

  try {

    await deleteProperty(id);

    successToast("تم حذف العقار بنجاح");

    loadProperties();

  } catch (error) {

    errorToast(
      error.response?.data?.message ||
      "حدث خطأ أثناء حذف العقار"
    );

  }

}}
       onStatusChange={async (id, status) => {

  try {

    await changePropertyStatus(id, status);

    successToast("تم تحديث حالة العقار");

    loadProperties();

  } catch (error) {

    errorToast(
      error.response?.data?.message ||
      "تعذر تحديث الحالة"
    );

    console.error(error);

  }

}}
      onRefresh={loadProperties}
      />
      {previewProperty && (
  <PropertyPreviewModal
    property={previewProperty}
    onClose={() => setPreviewProperty(null)}
  />
)}
    </div>
  );
}

export default Properties;