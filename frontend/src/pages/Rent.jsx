import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, MapPin, Building2, ChevronLeft, Search, Home, ChevronLeft as Sep } from "lucide-react";
import { COFFEE } from "../constants/constants";
import usePageTitle from "../hooks/usePageTitle";
import { getPropertiesByCategory } from "../services/propertyService";
import Reveal from "../components/Reveal";
import { SAMPLE_IMG } from "../utils/helpers";

function Rent({ favorites, onToggleFav, onOpen }) {
  usePageTitle("إيجار عقارات — سكني");
  const navigate = useNavigate();
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await getPropertiesByCategory("rent");
        setAllProperties(data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const grouped = allProperties.reduce((acc, property) => {
    const location = property.location?.name || "أماكن أخرى";
    if (!acc[location]) {
      acc[location] = { name: location, properties: [], locationObj: property.location };
    }
    acc[location].properties.push(property);
    return acc;
  }, {});

  const allLocations = Object.values(grouped);

  const locations = search.trim()
    ? allLocations.filter((loc) =>
        loc.name.includes(search.trim()) ||
        loc.properties.some(
          (p) =>
            p.title?.includes(search.trim()) ||
            p.propertyType?.name?.includes(search.trim()) ||
            p.tags?.some((t) => t.name?.includes(search.trim()))
        )
      )
    : allLocations;

  const getLocationStats = (list) => {
    const prices = list
      .map((p) => {
        if (p.has_detailed_rooms) {
          const rooms = Array.isArray(p.detailed_rooms) ? p.detailed_rooms : [];
          const roomPrices = rooms.map((r) => r.price).filter((pr) => pr > 0);
          return roomPrices.length > 0 ? Math.min(...roomPrices) : p.price;
        }
        return p.price;
      })
      .filter((pr) => pr > 0);
    return {
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
    };
  };

  return (
    <div className="min-h-[70vh] pt-24 sm:pt-28 pb-10 sm:pb-14 px-4 sm:px-6 lg:px-8 bg-white" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <Reveal>
          <nav className="flex items-center gap-1.5 text-xs sm:text-sm mb-6" style={{ color: COFFEE.stone }}>
            <button onClick={() => navigate("/")} className="flex items-center gap-1 hover:underline transition" style={{ color: COFFEE.dark }}>
              <Home className="w-3.5 h-3.5" />
              الرئيسية
            </button>
            <Sep className="w-3 h-3" style={{ color: COFFEE.line }} />
            <span className="font-bold" style={{ color: COFFEE.gold }}>الإيجار</span>
          </nav>
        </Reveal>

        {/* Header */}
        <Reveal delay={40}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center animate-float"
                style={{ backgroundColor: COFFEE.gold }}
              >
                <KeyRound className="w-5 h-5" style={{ color: COFFEE.darkest }} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold" style={{ color: COFFEE.dark }}>
                  شقق للإيجار
                </h1>
                {!loading && allProperties.length > 0 && (
                  <p className="text-xs sm:text-sm mt-0.5" style={{ color: COFFEE.stone }}>
                    {allProperties.length} عقار في {allLocations.length} منطقة
                  </p>
                )}
              </div>
            </div>

            {/* Search */}
            {!loading && allLocations.length > 0 && (
              <div className="relative w-full sm:w-72">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: COFFEE.stone }} />
                <input
                  type="text"
                  placeholder="ابحث عن منطقة أو عقار..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 transition"
                  style={{ borderColor: COFFEE.line, color: COFFEE.dark, backgroundColor: "white" }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold"
                    style={{ color: COFFEE.gold }}
                  >
                    مسح
                  </button>
                )}
              </div>
            )}
          </div>
        </Reveal>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <div
              className="w-12 h-12 border-4 rounded-full animate-spin"
              style={{ borderColor: COFFEE.gold, borderTopColor: "transparent" }}
            />
            <p className="font-bold text-sm" style={{ color: COFFEE.stone }}>جاري تحميل العقارات...</p>
          </div>
        ) : allProperties.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Reveal>
              <div className="bg-white rounded-3xl border shadow-lg px-8 py-10 text-center w-full max-w-md" style={{ borderColor: "#f0ebe4" }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: COFFEE.cream }}>
                  <KeyRound className="w-8 h-8" style={{ color: COFFEE.gold }} />
                </div>
                <h2 className="text-xl font-extrabold" style={{ color: COFFEE.dark }}>لا توجد عقارات للإيجار حالياً</h2>
                <p className="mt-2 text-sm" style={{ color: COFFEE.stone }}>سيتم عرض العقارات هنا بمجرد أن يضيفها الأدمن.</p>
              </div>
            </Reveal>
          </div>
        ) : locations.length === 0 ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Reveal>
              <div className="text-center">
                <Search className="w-12 h-12 mx-auto mb-3" style={{ color: COFFEE.line }} />
                <p className="font-bold" style={{ color: COFFEE.stone }}>لا توجد نتائج لـ "{search}"</p>
                <button onClick={() => setSearch("")} className="mt-2 text-sm font-bold" style={{ color: COFFEE.gold }}>مسح البحث</button>
              </div>
            </Reveal>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {locations.map((loc, idx) => {
              const stats = getLocationStats(loc.properties);
              const coverImage = loc.locationObj?.image_url || SAMPLE_IMG(loc.name);

              return (
                <Reveal key={loc.name} delay={idx * 50}>
                  <button
                    onClick={() => navigate(`/rent/${encodeURIComponent(loc.name)}`)}
                    className="group text-right w-full bg-white rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-xl flex flex-col"
                    style={{ borderColor: "#f0ebe4" }}
                  >
                    {/* Cover Image */}
                    <div className="relative w-full h-40 sm:h-48 overflow-hidden bg-stone-100">
                      <img
                        src={coverImage}
                        alt={loc.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />

                      <div
                        className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm"
                        style={{ backgroundColor: "rgba(255,255,255,0.92)", color: COFFEE.dark }}
                      >
                        {loc.properties.length} عقار
                      </div>

                      <div className="absolute bottom-0 right-0 left-0 p-3 sm:p-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-white/80 shrink-0" />
                          <h3 className="text-base sm:text-lg font-extrabold text-white truncate">{loc.name}</h3>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 sm:p-4 flex flex-col gap-2 flex-1">
                      <div className="flex items-center justify-between text-xs" style={{ color: COFFEE.stone }}>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" style={{ color: COFFEE.gold }} />
                          <span>{loc.properties.length} وحدة</span>
                        </div>
                        {stats.minPrice > 0 && (
                          <span className="font-bold" style={{ color: COFFEE.mid }}>
                            من {stats.minPrice.toLocaleString("en-US")} ج.م
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const types = {};
                          loc.properties.forEach((p) => {
                            const t = p.propertyType?.name;
                            if (t) types[t] = (types[t] || 0) + 1;
                          });
                          return Object.entries(types).slice(0, 3).map(([name, count]) => (
                            <span key={name} className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: COFFEE.cream, color: COFFEE.dark }}>
                              {name} ({count})
                            </span>
                          ));
                        })()}
                      </div>

                      <div className="mt-auto pt-2 border-t flex items-center justify-between" style={{ borderColor: "#f0ebe4" }}>
                        <span className="text-xs sm:text-sm font-extrabold" style={{ color: COFFEE.gold }}>عرض العقارات</span>
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" style={{ color: COFFEE.gold }} />
                      </div>
                    </div>
                  </button>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Rent;
