import React, { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import PropertyGrid from "../components/PropertyGrid";
import { COFFEE } from "../constants/constants";
import { getPropertiesByCategory } from "../services/propertyService";
import PropertySectionByLocation from "../components/PropertySectionByLocation";
function Rent({ favorites, onToggleFav, onOpen }) {
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await getPropertiesByCategory("rent");
        setFiltered(data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  return (
    <div className="min-h-[70vh] pt-28 pb-14 px-4 sm:px-6 bg-white" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2 animate-heroFade">
          <div className="w-11 h-11 rounded-full flex items-center justify-center animate-float" style={{ backgroundColor: COFFEE.gold }}>
            <KeyRound className="w-5 h-5" style={{ color: COFFEE.darkest }} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: COFFEE.dark }}>شقق للإيجار</h1>
        </div>

        {loading ? (
          <div className="text-center py-20">جاري تحميل العقارات...</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white rounded-3xl border shadow-lg px-10 py-12 text-center w-full max-w-2xl" style={{ borderColor: "#eee" }}>
              <h2 className="text-3xl font-extrabold" style={{ color: COFFEE.dark }}>لا توجد عقارات للإيجار حالياً</h2>
              <p className="mt-4 text-gray-500">سيتم عرض العقارات هنا بمجرد أن يضيفها الأدمن.</p>
            </div>
          </div>
        ) : (
    <PropertySectionByLocation
  properties={filtered}
  favorites={favorites}
  onToggleFav={onToggleFav}
  onOpen={onOpen}
/>
        )}
      </div>
    </div>
  );
}

export default Rent;