import React, { useState, useEffect, useCallback } from "react";

import "./styles/global.css";
import "./styles/animations.css";

import { COFFEE } from "./constants/constants";

import Footer from "./components/Footer";
import { loadFavorites, saveFavorites } from "./utils/storage";
import { getProperties as fetchPropertiesAPI } from "./services/propertyService";
import { getFavorites, toggleFavorite as toggleFavoriteAPI } from "./services/favoriteService";

import Navbar from "./components/Navbar";
import PropertyModal from "./components/PropertyModal";
import ReservationModal from "./components/ReservationModal";
import FavoritesDrawer from "./components/FavoritesDrawer";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import ScrollToTop from "./components/ScrollToTop";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  const [properties, setProperties] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [activeProperty, setActiveProperty] = useState(null);
  const [reservationOpen, setReservationOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isAdmin = !!sessionStorage.getItem("token");

  useEffect(() => {
    (async () => {
      try {
        const apiProps = await fetchPropertiesAPI();
        if (Array.isArray(apiProps) && apiProps.length) {
          setProperties(apiProps);
          localStorage.setItem("properties", JSON.stringify(apiProps));
        }
      } catch (e) {
        const stored = await loadFavorites();
        if (Array.isArray(stored) && stored.length) {
          /* keep empty - we'll use cached properties if available */
        }
      }

      if (isAdmin) {
        try {
          const res = await getFavorites();
          if (res?.data) setFavorites(new Set(res.data.map((p) => p.id)));
        } catch {
          const local = await loadFavorites();
          if (Array.isArray(local)) setFavorites(new Set(local));
        }
      } else {
        const local = await loadFavorites();
        if (Array.isArray(local)) setFavorites(new Set(local));
      }

      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchCount = async () => {
      try {
        const res = await getUnreadCount();
        if (res?.unread_count !== undefined) setUnreadCount(res.unread_count);
      } catch { /* empty */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const addProperty = (prop) => {
    setProperties((prev) => [prop, ...prev]);
  };

  const updateProperty = (updatedProperty) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === updatedProperty.id ? updatedProperty : p))
    );
  };

  const deleteProperty = (id) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleFav = useCallback(
    async (id) => {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        saveFavorites(Array.from(next));
        return next;
      });

      if (isAdmin) {
        try {
          await toggleFavoriteAPI(id);
        } catch {
          /* optimistic update already applied */
        }
      }
    },
    [isAdmin]
  );

  const openProperty = useCallback((p) => setActiveProperty(p), []);
  const closeProperty = useCallback(() => setActiveProperty(null), []);

  return (
    <div style={{ backgroundColor: COFFEE.creamSoft, minHeight: "100vh" }}>
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
        unreadCount={unreadCount}
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
            setUnreadCount={setUnreadCount}
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
