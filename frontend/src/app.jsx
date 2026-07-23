import React, { useState, useEffect, useCallback } from "react";

import "./styles/global.css";
import "./styles/animations.css";

import { COFFEE } from "./constants/constants";

import DEFAULT_PROPERTIES from "./data/properties";
import Footer from "./components/Footer";
import {
  loadFromStorage,
  saveToStorage,
  loadFavorites,
  saveFavorites,
} from "./utils/storage";

import Navbar from "./components/Navbar";
import PropertyModal from "./components/PropertyModal";
import ReservationModal from "./components/ReservationModal";
import FavoritesDrawer from "./components/FavoritesDrawer";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import ScrollToTop from "./components/ScrollToTop";
import AppRoutes from "./routes/AppRoutes";



/* -------------------------------------------------------------------- */
/*  المكون الرئيسي                                                       */
/* -------------------------------------------------------------------- */
export default function App() {
  const [properties, setProperties] = useState(DEFAULT_PROPERTIES);
  const [loaded, setLoaded] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [activeProperty, setActiveProperty] = useState(null);
  const [reservationOpen, setReservationOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
const isAdmin = !!sessionStorage.getItem("token");
  useEffect(() => {
    (async () => {
      const stored = await loadFromStorage();
      if (stored && Array.isArray(stored) && stored.length) setProperties(stored);
      const favs = await loadFavorites();
      if (Array.isArray(favs)) setFavorites(new Set(favs));
      setLoaded(true);
    })();
  }, []);



  const addProperty = async (prop) => {
    const next = [prop, ...properties];
    setProperties(next);
    await saveToStorage(next);
  };
  const updateProperty = async (updatedProperty) => {
  const next = properties.map((property) =>
    property.id === updatedProperty.id
      ? updatedProperty
      : property
  );

  setProperties(next);
  await saveToStorage(next);
};
  const deleteProperty = async (id) => {
    const next = properties.filter((p) => p.id !== id);
    setProperties(next);
    await saveToStorage(next);
  };

  const toggleFav = useCallback((id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveFavorites(Array.from(next));
      return next;
    });
  }, []);

  const openProperty = useCallback((p) => setActiveProperty(p), []);
  const closeProperty = useCallback(() => setActiveProperty(null), []);



  return (
    <div style={{ backgroundColor: COFFEE.creamSoft, minHeight: "100vh" }}>
      {/* شريط تحميل علوي عند تبديل الصفحات */}
      <div
        className="fixed top-0 right-0 left-0 h-[3px] z-[200] transition-all duration-300 origin-right"
        style={{
          backgroundColor: COFFEE.gold,
          transform: transitioning ? "scaleX(1)" : "scaleX(0)",
          opacity: transitioning ? 1 : 0,
          boxShadow: transitioning ? `0 0 8px ${COFFEE.gold}` : "none",
        }}
      />
     
      <Navbar
    isAdmin={isAdmin}
    favoritesCount={favorites.size}
    onOpenFavorites={() => setFavoritesOpen(true)}
/>
      <div className="animate-pageIn">
    {loaded && (
      <AppRoutes
    properties={properties}
    favorites={favorites}
    onToggleFav={toggleFav}
    onOpen={openProperty}
    addProperty={addProperty}
    updateProperty={updateProperty}
    deleteProperty={deleteProperty}
/>
    )}
</div>

      <PropertyModal
  property={activeProperty}
  isFav={activeProperty ? favorites.has(activeProperty.id) : false}
  onToggleFav={toggleFav}
  onClose={closeProperty}
  onReserve={() => setReservationOpen(true)}
/>

<ReservationModal
  open={reservationOpen}
  property={activeProperty}
  onClose={() => setReservationOpen(false)}
/>
      <FavoritesDrawer
        open={favoritesOpen}
        properties={properties}
        favorites={favorites}
        onToggleFav={toggleFav}
        onOpenProperty={openProperty}
        onClose={() => setFavoritesOpen(false)}
      />
 <Footer />
      <FloatingWhatsApp />
      <ScrollToTop />
    </div>
  );
}
