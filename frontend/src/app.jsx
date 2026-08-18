import React, { useState, useEffect, useCallback } from "react";

import "./styles/global.css";
import "./styles/animations.css";

import { COFFEE } from "./constants/constants";

import Loader from "./components/Loader";
import Footer from "./components/Footer";
import { loadFavorites, saveFavorites } from "./utils/storage";
import { getPropertiesCached as fetchPropertiesAPI } from "./services/propertyService";
import { getFavorites, toggleFavorite as toggleFavoriteAPI } from "./services/favoriteService";
import { getSettings } from "./services/settingsService";

import Navbar from "./components/Navbar";
import PropertyModal from "./components/PropertyModal";
import ReservationModal from "./components/ReservationModal";
import FavoritesDrawer from "./components/FavoritesDrawer";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import ScrollToTop from "./components/ScrollToTop";
import AppRoutes from "./routes/AppRoutes";
import EnhancingExperience from "./pages/EnhancingExperience";
import { useLocation } from "react-router-dom";

export default function App() {
  const [properties, setProperties] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadingDone, setLoadingDone] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [activeProperty, setActiveProperty] = useState(null);
  const [reservationOpen, setReservationOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(() => {
    // Initial check from env or localStorage
    if (import.meta.env.VITE_MAINTENANCE_MODE === "true") return true;
    return localStorage.getItem("sakani_maintenance_mode") === "true";
  });

  const location = useLocation();
  const isAdmin = !!(sessionStorage.getItem("token") || localStorage.getItem("token"));
  const isDashboard = location.pathname.startsWith("/dashboard");
  const isAdminLogin = location.pathname.startsWith("/admin/");
  const isDirectMaintenanceRoute =
    location.pathname === "/maintenance" || location.pathname === "/updating";

  useEffect(() => {
    (async () => {
      // 1. Fetch site settings (including maintenance mode)
      try {
        const settingsData = await getSettings();
        if (settingsData) {
          setSiteSettings(settingsData);
          if (settingsData.maintenance_mode !== undefined) {
            const enabled =
              settingsData.maintenance_mode === true ||
              settingsData.maintenance_mode === "true" ||
              settingsData.maintenance_mode === "1" ||
              settingsData.maintenance_mode === 1;
            
            // Only override if not forced by env
            if (import.meta.env.VITE_MAINTENANCE_MODE !== "true") {
              setIsMaintenanceMode(enabled);
              localStorage.setItem("sakani_maintenance_mode", enabled ? "true" : "false");
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch settings:", err);
      }

      // 2. Fetch properties
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

      // 3. Fetch favorites
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

  // Show temporary "Enhancing Experience" screen if maintenance mode is active for non-admins (or when visiting /maintenance)
  const shouldShowEnhancementScreen =
    isDirectMaintenanceRoute ||
    (isMaintenanceMode && !isAdmin && !isAdminLogin && !isDashboard);

  if (shouldShowEnhancementScreen) {
    return (
      <div style={{ backgroundColor: COFFEE.creamSoft, minHeight: "100vh" }}>
        <EnhancingExperience
          title={siteSettings?.maintenance_title}
          message={siteSettings?.maintenance_message}
          phone={siteSettings?.phone || "01067725976"}
          whatsapp={siteSettings?.whatsapp || "201067725976"}
          email={siteSettings?.email || "info@sakani.site"}
          onRefresh={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: COFFEE.creamSoft, minHeight: "100vh" }}>
      {!loadingDone && <Loader onComplete={() => setLoadingDone(true)} />}
      <div
        className="fixed top-0 right-0 left-0 h-[3px] z-[200] transition-all duration-300 origin-right"
        style={{
          backgroundColor: COFFEE.gold,
          transform: transitioning ? "scaleX(1)" : "scaleX(0)",
          opacity: transitioning ? 1 : 0,
          boxShadow: transitioning ? `0 0 8px ${COFFEE.gold}` : "none",
        }}
      />

      {!isDashboard && (
        <Navbar
          isAdmin={isAdmin}
          favoritesCount={favorites.size}
          onOpenFavorites={() => setFavoritesOpen(true)}
        />
      )}
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

      {!isDashboard && (
        <>
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
        </>
      )}
      <ScrollToTop />
    </div>
  );
}
