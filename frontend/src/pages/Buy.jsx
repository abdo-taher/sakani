import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Home, ChevronLeft } from "lucide-react";
import { COFFEE } from "../constants/constants";
import usePageTitle from "../hooks/usePageTitle";
import { getPropertiesByCategory } from "../services/propertyService";
import PropertySectionByLocation from "../components/PropertySectionByLocation";

function Buy({ favorites, onToggleFav, onOpen }) {
  usePageTitle("شراء عقارات — سكني");
  const navigate = useNavigate();
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await getPropertiesByCategory("buy");
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
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs sm:text-sm mb-4" style={{ color: COFFEE.stone }}>
          <button onClick={() => navigate("/")} className="flex items-center gap-1 hover:underline hover:opacity-80 transition" style={{ color: COFFEE.dark }}>
            <Home className="w-3.5 h-3.5" /> الرئيسية
          </button>
          <ChevronLeft className="w-2.5 h-2.5" />
          <span className="font-bold" style={{ color: COFFEE.gold }}>البيع</span>
        </nav>

        <div className="flex items-center gap-3 mb-2 animate-heroFade">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center animate-float"
            style={{ backgroundColor: COFFEE.gold }}
          >
            <ShoppingBag className="w-5 h-5" style={{ color: COFFEE.darkest }} />
          </div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold"
            style={{ color: COFFEE.dark }}
          >
            شقق للشراء
          </h1>
        </div>

        {loading ? (
          <div className="text-center py-20">جاري تحميل العقارات...</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div
              className="bg-white rounded-3xl border shadow-lg px-10 py-12 text-center w-full max-w-2xl"
              style={{ borderColor: "#eee" }}
            >
              <h2
                className="text-3xl font-extrabold"
                style={{ color: COFFEE.dark }}
              >
                لا توجد عقارات للشراء حالياً
              </h2>
              <p className="mt-4 text-gray-500">
                سيتم عرض العقارات هنا بمجرد أن يضيفها الأدمن.
              </p>
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

export default Buy;