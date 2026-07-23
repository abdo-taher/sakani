import React, { useEffect, useState } from "react";
import usePageTitle from "../../hooks/usePageTitle";
import {
  getLocations,
  deleteLocation,
} from "../../services/locationService";
import LocationHeader from "../../components/locations/LocationHeader";
import LocationToolbar from "../../components/locations/LocationToolbar";
import LocationTable from "../../components/locations/LocationTable";
import LocationForm from "../../components/locations/LocationForm";
import {
  successToast,
  errorToast,
} from "../../utils/toast";
import { confirmDelete } from "../../utils/confirm";
function Locations() {
  usePageTitle("إدارة الأماكن — سكني");
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // بيانات مؤقتة لحد الباك إند
  const [locations, setLocations] = useState([]);
const loadLocations = async () => {
  try {
    const data = await getLocations();
    setLocations(data);
  } catch (error) {

  errorToast("تعذر تحميل الأماكن");

  console.error(error);

}
};

useEffect(() => {
  loadLocations();
}, []);
  const filteredLocations = locations.filter((location) =>
    location.name.toLowerCase().includes(search.toLowerCase())
  );
   const handleDelete = async (id) => {

  const confirmed = await confirmDelete("المكان");

if (!confirmed) return;

  try {

    await deleteLocation(id);

    successToast("تم حذف المكان بنجاح");

    loadLocations();

  } catch (error) {

    errorToast(
      error.response?.data?.message ||
      "حدث خطأ أثناء حذف المكان"
    );

    console.error(error);

  }

};
  return (
    <div className="p-8">
      <LocationHeader
        onAdd={() => {
          setSelectedLocation(null);
          setOpenForm(true);
        }}
      />

      <LocationToolbar
        search={search}
        setSearch={setSearch}
      />

      <LocationTable
        locations={filteredLocations}
        onEdit={(location) => {
          setSelectedLocation(location);
          setOpenForm(true);
        }}
        onDelete={handleDelete}
      />

      {openForm && (
    <LocationForm
  location={selectedLocation}
  onClose={() => {
    setOpenForm(false);
    setSelectedLocation(null);
    loadLocations();
  }}
/>
      )}
    </div>
  );
}

export default Locations;