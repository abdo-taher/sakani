import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle";
import PropertyForm from "../../components/properties/PropertyForm";
import { getPropertyById, getProperties } from "../../services/propertyService";
import { errorToast } from "../../utils/toast";

function PropertyEdit() {
  usePageTitle("تعديل العقار — سكني");
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    try {
      const response = await getPropertyById(id);
      setProperty(response.data);
    } catch (error) {
      errorToast("تعذر تحميل بيانات العقار");
      navigate("/dashboard/properties");
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      await getProperties();
    } catch {}
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-stone-500">جاري تحميل بيانات العقار...</p>
        </div>
      </div>
    );
  }

  if (!property) return null;

  return (
    <PropertyForm
      pageMode
      property={property}
      loadProperties={loadProperties}
      onClose={() => {}}
    />
  );
}

export default PropertyEdit;
