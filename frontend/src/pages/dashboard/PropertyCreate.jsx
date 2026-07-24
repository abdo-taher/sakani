import React, { useEffect, useState } from "react";
import usePageTitle from "../../hooks/usePageTitle";
import PropertyForm from "../../components/properties/PropertyForm";
import { getProperties } from "../../services/propertyService";
import { errorToast } from "../../utils/toast";

function PropertyCreate() {
  usePageTitle("إضافة عقار — سكني");
  const [properties, setProperties] = useState([]);

  const loadProperties = async () => {
    try {
      const data = await getProperties();
      setProperties(data);
    } catch (error) {
      errorToast("تعذر تحميل العقارات");
    }
  };

  return (
    <PropertyForm
      pageMode
      property={null}
      loadProperties={loadProperties}
      onClose={() => {}}
    />
  );
}

export default PropertyCreate;
