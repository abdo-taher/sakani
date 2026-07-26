import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  BedDouble,
  Bath,
  Building2,
  Loader2,
  Paintbrush,
  Sofa,
  Layers,
  Tag,
  Eye,
  Heart,
  PlayCircle,
  CheckCircle2,
  Search,
  Home,
  ChevronLeft,
  ChevronDown,
  SlidersHorizontal,
  X,
} from "lucide-react";
import usePageTitle from "../hooks/usePageTitle";
import { getPropertiesByCategory } from "../services/propertyService";
import { COFFEE } from "../constants/constants";
import { SAMPLE_IMG, fmtPrice } from "../utils/helpers";
import Reveal from "../components/Reveal";
import VideoThumb from "../components/VideoThumb";

const PROPERTIES_PER_PAGE = 8;

const STATUS_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "reserved_property", label: "حجز بالشقة" },
  { value: "reserved_room", label: "حجز بالغرفة" },
];

const FINISHING_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "super_lux", label: "سوبر لوكس" },
  { value: "lux", label: "لوكس" },
  { value: "semi_finished", label: "نصف تشطيب" },
  { value: "red_brick", label: "طوب أحمر" },
];

const FURNISHING_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "furnished", label: "مفروش" },
  { value: "unfurnished", label: "غير مفروش" },
];

const ROOMS_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4+" },
];

const STATUS_MAP = {
  available: { label: "متاح", color: "#16A34A", bg: "#DCFCE7" },
  reserved: { label: "محجوز", color: "#F59E0B", bg: "#FEF3C7" },
  sold: { label: "تم البيع", color: "#DC2626", bg: "#FEE2E2" },
  rented: { label: "تم التأجير", color: "#2563EB", bg: "#DBEAFE" },
};

const FINISHING_MAP = {
  super_lux: "سوبر لوكس",
  lux: "لوكس",
  semi_finished: "نصف تشطيب",
  red_brick: "طوب أحمر",
};

const FURNISHING_MAP = {
  furnished: "مفروش",
  unfurnished: "غير مفروش",
};

const FilterPill = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border"
    style={{
      backgroundColor: active ? COFFEE.gold : "white",
      color: active ? COFFEE.darkest : COFFEE.mid,
      borderColor: active ? COFFEE.gold : COFFEE.line,
    }}
  >
    {children}
  </button>
);

function RentLocation({ favorites, onToggleFav }) {
  const { locationId } = useParams();
  const navigate = useNavigate();
  const locationName = decodeURIComponent(locationId || "");

  usePageTitle(`${locationName} — إيجار — سكني`);

  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [finishingFilter, setFinishingFilter] = useState("all");
  const [furnishingFilter, setFurnishingFilter] = useState("all");
  const [roomsFilter, setRoomsFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PROPERTIES_PER_PAGE);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

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

  const locationProperties = allProperties.filter(
    (p) => (p.location?.name || "أماكن أخرى") === locationName
  );

  const propertyTypes = useMemo(() => {
    const types = {};
    locationProperties.forEach((p) => {
      const t = p.propertyType?.name;
      if (t) types[t] = (types[t] || 0) + 1;
    });
    return Object.entries(types).map(([name, count]) => ({ name, count }));
  }, [locationProperties]);

  const getPrice = (p) => {
    if (p.price > 0) return p.price;
    return null;
  };

  const filteredProperties = locationProperties.filter((p) => {
    const q = search.trim();
    const matchSearch =
      !q ||
      p.title?.includes(q) ||
      p.propertyType?.name?.includes(q) ||
      p.tags?.some((t) => t.name?.includes(q)) ||
      p.description?.includes(q);
    const matchStatus = (() => {
      if (statusFilter === "all") return true;
      if (statusFilter === "reserved_property") {
        return !p.has_detailed_rooms;
      }
      if (statusFilter === "reserved_room") {
        return !!p.has_detailed_rooms;
      }
      return true;
    })();
    const matchFinishing = finishingFilter === "all" || p.finishing === finishingFilter;
    const matchFurnishing = furnishingFilter === "all" || p.furnishing === furnishingFilter;
    const matchRooms =
      roomsFilter === "all" ||
      (roomsFilter === "4" ? p.rooms >= 4 : p.rooms === Number(roomsFilter));
    const matchType =
      typeFilter === "all" || p.propertyType?.name === typeFilter;
    const price = getPrice(p);
    const matchMinPrice = !priceRange.min || (price && price >= Number(priceRange.min));
    const matchMaxPrice = !priceRange.max || (price && price <= Number(priceRange.max));
    return (
      matchSearch &&
      matchStatus &&
      matchFinishing &&
      matchFurnishing &&
      matchRooms &&
      matchType &&
      matchMinPrice &&
      matchMaxPrice
    );
  });

  const visibleProperties = filteredProperties.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProperties.length;

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (statusFilter !== "all") c++;
    if (finishingFilter !== "all") c++;
    if (furnishingFilter !== "all") c++;
    if (roomsFilter !== "all") c++;
    if (typeFilter !== "all") c++;
    if (priceRange.min) c++;
    if (priceRange.max) c++;
    return c;
  }, [statusFilter, finishingFilter, furnishingFilter, roomsFilter, typeFilter, priceRange]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setFinishingFilter("all");
    setFurnishingFilter("all");
    setRoomsFilter("all");
    setTypeFilter("all");
    setPriceRange({ min: "", max: "" });
  };

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) =>
        Math.min(prev + PROPERTIES_PER_PAGE, filteredProperties.length)
      );
      setLoadingMore(false);
    }, 300);
  }, [hasMore, loadingMore, filteredProperties.length]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  useEffect(() => {
    setVisibleCount(PROPERTIES_PER_PAGE);
  }, [search, statusFilter, finishingFilter, furnishingFilter, roomsFilter, typeFilter, priceRange]);

  const locationObj = locationProperties[0]?.location;
  const coverImage = locationObj?.image_url || SAMPLE_IMG(locationName);

  const stats = (() => {
    const prices = locationProperties.map((p) => getPrice(p)).filter((pr) => pr > 0);
    return {
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
    };
  })();

  const availableCount = locationProperties.filter((p) => p.status === "available").length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{ borderColor: COFFEE.gold, borderTopColor: "transparent" }} />
        <p className="font-bold text-sm" style={{ color: COFFEE.stone }}>جاري تحميل العقارات...</p>
      </div>
    );
  }

  function renderHeroStatAvailable() {
    if (availableCount <= 0) return null;
    return (
      <span className="flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5" />
        {availableCount} متاح
      </span>
    );
  }

  function renderHeroStatPrice() {
    if (stats.minPrice <= 0) return null;
    return (
      <span className="font-bold">يبدأ من {fmtPrice(stats.minPrice)}</span>
    );
  }

  function renderClearSearch() {
    if (!search) return null;
    return (
      <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: COFFEE.gold }}>مسح</button>
    );
  }

  function renderFilterBadge() {
    if (activeFilterCount <= 0) return null;
    return (
      <span className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-extrabold" style={{ backgroundColor: showFilters || activeFilterCount > 0 ? COFFEE.darkest : COFFEE.gold, color: "white" }}>
        {activeFilterCount}
      </span>
    );
  }

  function renderResetButton() {
    if (activeFilterCount <= 0) return null;
    return (
      <button
        onClick={resetFilters}
        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition"
        style={{ color: "#DC2626" }}
      >
        <X className="w-3 h-3" />
        مسح جميع الفلاتر
      </button>
    );
  }

  function renderLoadingMore() {
    if (!loadingMore) return null;
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: COFFEE.gold }} />
        <span className="text-sm font-bold" style={{ color: COFFEE.stone }}>تحميل المزيد...</span>
      </div>
    );
  }

  function renderEndOfList() {
    if (hasMore || filteredProperties.length <= PROPERTIES_PER_PAGE) return null;
    return (
      <Reveal>
        <div className="text-center py-8">
          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold" style={{ backgroundColor: COFFEE.cream, color: COFFEE.dark }}>
            تم عرض جميع العقارات — {filteredProperties.length} عقار
          </span>
        </div>
      </Reveal>
    );
  }

  function renderFilterPanel() {
    if (!showFilters) return null;
    return (
      <Reveal delay={80}>
        <div className="rounded-2xl border p-4 mb-5 space-y-4" style={{ borderColor: COFFEE.line, backgroundColor: COFFEE.creamSoft }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] sm:text-xs font-bold mb-1.5 block" style={{ color: COFFEE.mid }}>نوع العقار</label>
              <div className="flex flex-wrap gap-1.5">
                <FilterPill active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>الكل</FilterPill>
                {propertyTypes.map((t) => (
                  <FilterPill key={t.name} active={typeFilter === t.name} onClick={() => setTypeFilter(t.name)}>
                    {t.name}
                  </FilterPill>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] sm:text-xs font-bold mb-1.5 block" style={{ color: COFFEE.mid }}>عدد الغرف</label>
              <div className="flex flex-wrap gap-1.5">
                {ROOMS_OPTIONS.map((opt) => (
                  <FilterPill key={opt.value} active={roomsFilter === opt.value} onClick={() => setRoomsFilter(opt.value)}>
                    {opt.value === "4" ? "4+" : opt.label}
                  </FilterPill>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] sm:text-xs font-bold mb-1.5 flex items-center gap-1" style={{ color: COFFEE.mid }}>
                <Paintbrush className="w-3 h-3" /> التشطيب
              </label>
              <div className="flex flex-wrap gap-1.5">
                {FINISHING_OPTIONS.map((opt) => (
                  <FilterPill key={opt.value} active={finishingFilter === opt.value} onClick={() => setFinishingFilter(opt.value)}>
                    {opt.label}
                  </FilterPill>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] sm:text-xs font-bold mb-1.5 flex items-center gap-1" style={{ color: COFFEE.mid }}>
                <Sofa className="w-3 h-3" /> التأثيث
              </label>
              <div className="flex flex-wrap gap-1.5">
                {FURNISHING_OPTIONS.map((opt) => (
                  <FilterPill key={opt.value} active={furnishingFilter === opt.value} onClick={() => setFurnishingFilter(opt.value)}>
                    {opt.label}
                  </FilterPill>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] sm:text-xs font-bold mb-1.5 block" style={{ color: COFFEE.mid }}>نطاق السعر (ج.م)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="من"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                className="w-28 px-3 py-1.5 rounded-lg border text-xs outline-none focus:ring-1"
                style={{ borderColor: COFFEE.line, color: COFFEE.dark }}
              />
              <span className="text-xs" style={{ color: COFFEE.stone }}>—</span>
              <input
                type="number"
                placeholder="إلى"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                className="w-28 px-3 py-1.5 rounded-lg border text-xs outline-none focus:ring-1"
                style={{ borderColor: COFFEE.line, color: COFFEE.dark }}
              />
            </div>
          </div>

          {renderResetButton()}
        </div>
      </Reveal>
    );
  }

  function renderEmptyState() {
    if (locationProperties.length !== 0) return null;
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Reveal>
          <div className="text-center">
            <Building2 className="w-14 h-14 mx-auto mb-3 text-stone-300" />
            <h2 className="text-lg font-bold mb-2" style={{ color: COFFEE.mid }}>لا توجد عقارات في هذه المنطقة</h2>
            <button onClick={() => navigate("/rent")} className="mt-3 px-5 py-2 rounded-lg text-white text-sm font-bold" style={{ background: COFFEE.gold }}>العودة للمناطق</button>
          </div>
        </Reveal>
      </div>
    );
  }

  function renderNoResults() {
    if (filteredProperties.length !== 0) return null;
    return (
      <div className="flex items-center justify-center min-h-[30vh]">
        <Reveal>
          <div className="text-center">
            <Search className="w-10 h-10 mx-auto mb-3" style={{ color: COFFEE.line }} />
            <p className="font-bold" style={{ color: COFFEE.stone }}>لا توجد نتائج مطابقة</p>
            <button onClick={resetFilters} className="mt-2 text-xs font-bold" style={{ color: COFFEE.gold }}>مسح الفلتر</button>
          </div>
        </Reveal>
      </div>
    );
  }

  function renderPropertyGrid() {
    if (filteredProperties.length === 0) return null;
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {visibleProperties.map((p, idx) => (
            <Reveal key={p.id} delay={idx < 6 ? idx * 50 : 0}>
              <RentPropertyCard p={p} isFav={favorites?.has?.(p.id) || false} onToggleFav={onToggleFav} />
            </Reveal>
          ))}
        </div>

        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-10">
            {renderLoadingMore()}
          </div>
        )}

        {renderEndOfList()}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Hero */}
      <div className="relative w-full h-44 sm:h-64 lg:h-72 overflow-hidden">
        <img src={coverImage} alt={locationName} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Breadcrumb */}
        <nav className="absolute top-14 sm:top-20 right-4 sm:right-8 flex items-center gap-1.5 text-xs text-white/70 z-10">
          <button onClick={() => navigate("/")} className="flex items-center gap-1 hover:text-white transition">
            <Home className="w-3 h-3" />الرئيسية
          </button>
          <ChevronLeft className="w-2.5 h-2.5" />
          <button onClick={() => navigate("/rent")} className="hover:text-white transition">الإيجار</button>
          <ChevronLeft className="w-2.5 h-2.5" />
          <span className="text-white font-bold">{locationName}</span>
        </nav>

        <div className="absolute bottom-0 right-0 left-0 p-4 sm:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-1.5">
              <MapPin className="w-5 h-5 text-white/80" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white">{locationName}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-white/80">
              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{locationProperties.length} عقار</span>
              {renderHeroStatAvailable()}
              {renderHeroStatPrice()}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {renderEmptyState()}

        {locationProperties.length > 0 && (
          <>
            {/* Search + Filter toggle */}
            <Reveal delay={40}>
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: COFFEE.stone }} />
                  <input
                    type="text"
                    placeholder="ابحث بالاسم أو النوع..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 transition"
                    style={{ borderColor: COFFEE.line, color: COFFEE.dark }}
                  />
                  {renderClearSearch()}
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all"
                  style={{
                    borderColor: showFilters || activeFilterCount > 0 ? COFFEE.gold : COFFEE.line,
                    backgroundColor: showFilters || activeFilterCount > 0 ? COFFEE.gold : "white",
                    color: showFilters || activeFilterCount > 0 ? COFFEE.darkest : COFFEE.mid,
                  }}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">فلتر</span>
                  {renderFilterBadge()}
                </button>
              </div>
            </Reveal>

            {/* Status pills - always visible */}
            <Reveal delay={60}>
              <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
                {STATUS_OPTIONS.map((opt) => (
                  <FilterPill key={opt.value} active={statusFilter === opt.value} onClick={() => setStatusFilter(opt.value)}>
                    {opt.label}
                  </FilterPill>
                ))}
              </div>
            </Reveal>

            {/* Expandable filter panel */}
            {renderFilterPanel()}

            {/* Results count */}
            <p className="text-xs sm:text-sm mb-4" style={{ color: COFFEE.stone }}>
              عرض {Math.min(visibleCount, filteredProperties.length)} من {filteredProperties.length} عقار
            </p>

            {renderNoResults()}
            {renderPropertyGrid()}
          </>
        )}
      </div>
    </div>
  );
}

function RentPropertyCard({ p, isFav, onToggleFav }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const isRent = p.category?.slug === "rent";
  const firstImage = p.images?.find((img) => (img.media_type || "image") === "image" && !img.caption);
  const firstVideo = p.images?.find((img) => img.media_type === "video");
  const hasVideo = (p.images && p.images.some((img) => img.media_type === "video")) || p.video_url;
  const mainImage = !imgError && firstImage ? firstImage.image_url || firstImage.path : null;
  const mainVideo = hasVideo ? (firstVideo ? firstVideo.image_url : p.video_url) : null;
  const videoThumbnail = firstVideo?.image_public_id
    ? p.images?.find((img) => img.media_type === "image" && img.caption === firstVideo.image_public_id)?.image_url
    : null;

  const status = STATUS_MAP[p.status] || STATUS_MAP.available;
  const rooms = isRent && p.has_detailed_rooms
    ? Array.isArray(p.detailed_rooms) ? p.detailed_rooms : Array.isArray(p.rooms) ? p.rooms : []
    : [];
  const roomPrices = rooms.map((r) => r.price).filter((pr) => pr > 0);
  const availableRooms = rooms.filter((r) => r.status === "available").length;

  const getPriceDisplay = () => {
    if (isRent && p.has_detailed_rooms && roomPrices.length > 0) {
      return { main: fmtPrice(Math.min(...roomPrices)), suffix: "/ شهر", prefix: roomPrices.length > 1 ? "يبدأ من " : "" };
    }
    if (p.price > 0) {
      return { main: fmtPrice(p.price), suffix: p.rent_duration ? `/${p.rent_duration}` : "", prefix: "" };
    }
    return { main: "اتصل للسعر", suffix: "", prefix: "" };
  };

  const price = getPriceDisplay();

  function renderMedia() {
    if (mainVideo) {
      return <VideoThumb src={mainVideo} posterUrl={videoThumbnail} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />;
    }
    if (mainImage) {
      return <img src={mainImage} alt={p.title} onError={() => setImgError(true)} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />;
    }
    return <img src={SAMPLE_IMG(p.id)} alt={p.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />;
  }

  function renderVideoOverlay() {
    if (!hasVideo) return null;
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
          <PlayCircle className="w-6 h-6 text-white" />
        </div>
      </div>
    );
  }

  function renderViewsBadge() {
    if (p.cached_views <= 0) return null;
    return (
      <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 text-white text-[11px] font-bold backdrop-blur-sm">
        <Eye className="w-3 h-3" />{p.cached_views}
      </div>
    );
  }

  function handleFavoriteClick(e) {
    e.stopPropagation();
    if (onToggleFav) onToggleFav(p.id);
  }

  function renderPropertyFeatures() {
    const hasRooms = p.rooms > 0;
    const hasBathrooms = p.bathrooms > 0;
    const hasFloor = p.floor != null;
    if (!hasRooms && !hasBathrooms && !hasFloor) return null;
    return (
      <div className="flex items-center justify-between text-xs mb-2.5 pb-2 border-b" style={{ borderColor: "#f0ebe4", color: COFFEE.stone }}>
        {hasRooms && <div className="flex items-center gap-1"><BedDouble className="w-3 h-3" style={{ color: COFFEE.gold }} /><span>{p.rooms}</span></div>}
        {hasBathrooms && <div className="flex items-center gap-1"><Bath className="w-3 h-3" style={{ color: COFFEE.gold }} /><span>{p.bathrooms}</span></div>}
        {hasFloor && <div className="flex items-center gap-1"><Layers className="w-3 h-3" style={{ color: COFFEE.gold }} /><span>الدور {p.floor}</span></div>}
      </div>
    );
  }

  function renderTags() {
    const hasFinishing = !!p.finishing;
    const hasFurnishing = !!p.furnishing;
    const hasType = !!p.propertyType?.name;
    if (!hasFinishing && !hasFurnishing && !hasType) return null;
    return (
      <div className="flex flex-wrap gap-1 mb-2.5">
        {hasFinishing && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold" style={{ backgroundColor: COFFEE.cream, color: COFFEE.dark }}>
            <Paintbrush className="w-2.5 h-2.5" style={{ color: COFFEE.gold }} />{FINISHING_MAP[p.finishing] || p.finishing}
          </span>
        )}
        {hasFurnishing && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold" style={{ backgroundColor: COFFEE.cream, color: COFFEE.dark }}>
            <Sofa className="w-2.5 h-2.5" style={{ color: COFFEE.gold }} />{FURNISHING_MAP[p.furnishing] || p.furnishing}
          </span>
        )}
        {hasType && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold" style={{ backgroundColor: COFFEE.cream, color: COFFEE.dark }}>
            <Building2 className="w-2.5 h-2.5" style={{ color: COFFEE.gold }} />{p.propertyType.name}
          </span>
        )}
      </div>
    );
  }

  function renderAvailableRooms() {
    const show = isRent && p.has_detailed_rooms && availableRooms > 0;
    if (!show) return null;
    return (
      <div className="flex items-center gap-1 text-[11px] font-bold mb-2.5 px-2 py-1 rounded-lg" style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>
        <CheckCircle2 className="w-3 h-3" />{availableRooms} غرفة متاحة
      </div>
    );
  }

  function renderPricePrefix() {
    if (!price.prefix) return null;
    return <span className="text-[10px] font-bold block" style={{ color: COFFEE.stone }}>{price.prefix}</span>;
  }

  function renderPriceSuffix() {
    if (!price.suffix) return null;
    return <span className="text-[11px]" style={{ color: COFFEE.stone }}>{price.suffix}</span>;
  }

  return (
    <div
      onClick={() => navigate(`/property/${p.id}`)}
      className="group bg-white rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-xl flex flex-col"
      style={{ borderColor: "#f0ebe4" }}
      dir="rtl"
    >
      <div className="relative w-full h-44 sm:h-52 overflow-hidden bg-stone-100">
        {renderMedia()}
        {renderVideoOverlay()}

        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow" style={{ backgroundColor: status.color }}>
          {status.label}
        </div>

        {renderViewsBadge()}

        <button
          onClick={handleFavoriteClick}
          className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-110 transition-transform z-10"
        >
          <Heart className="w-4 h-4" fill={isFav ? "#e0435c" : "none"} style={{ color: isFav ? "#e0435c" : COFFEE.gold }} />
        </button>

        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <h3 className="font-extrabold text-sm sm:text-base mb-1 truncate group-hover:text-amber-800 transition-colors" style={{ color: COFFEE.dark }}>
          {p.title}
        </h3>

        <div className="flex items-center gap-1 text-xs mb-2.5" style={{ color: COFFEE.stone }}>
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{p.location?.name || "غير محدد"}</span>
        </div>

        {renderPropertyFeatures()}
        {renderTags()}
        {renderAvailableRooms()}

        <div className="mt-auto pt-2.5 border-t" style={{ borderColor: "#f0ebe4" }}>
          <div className="flex items-center justify-between">
            <div>
              {renderPricePrefix()}
              <span className="font-extrabold text-base sm:text-lg" style={{ color: COFFEE.mid }}>{price.main}</span>
            </div>
            {renderPriceSuffix()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RentLocation;
