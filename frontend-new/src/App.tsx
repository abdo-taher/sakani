import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Property, LocationDistrict, OperationType, PropertyType, DetailedRoom, PropertyFilterState, SystemSettings } from './types';
import { StorageService } from './services/storageService';
import { ApiService } from './services/apiService';
import { initializeFirebase } from './services/firebaseService';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';

import { HomePage } from './pages/Home';
import { ListingPage } from './pages/ListingPage';
import { PropertyDetailsPage } from './pages/PropertyDetailsPage';
import { SellAddPropertyPage } from './pages/SellAddProperty';
import { AboutContactPage } from './pages/AboutContact';
import { MyReservationsPage } from './pages/MyReservationsPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { PlacesPage } from './pages/PlacesPage';

// Dedicated Modular Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminPropertiesPage } from './pages/admin/AdminPropertiesPage';
import { AdminPropertyFormPage } from './pages/admin/AdminPropertyFormPage';
import { AdminPropertyDetailPage } from './pages/admin/AdminPropertyDetailPage';
import { AdminPropertySubmissionsPage } from './pages/admin/AdminPropertySubmissionsPage';
import { AdminReservationsPage } from './pages/admin/AdminReservationsPage';
import { AdminNeedRequestsPage } from './pages/admin/AdminNeedRequestsPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminMarketingMailPage } from './pages/admin/AdminMarketingMailPage';
import { AdminContactMessagesPage } from './pages/admin/AdminContactMessagesPage';
import { AdminLocationsPage } from './pages/admin/AdminLocationsPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminTagsPage } from './pages/admin/AdminTagsPage';
import { AdminAmenitiesPage } from './pages/admin/AdminAmenitiesPage';
import { AdminStatisticsPage } from './pages/admin/AdminStatisticsPage';
import { AdminWebsiteContentPage } from './pages/admin/AdminWebsiteContentPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage';

// Public Full Pages
import { AddPropertyPage } from './pages/AddPropertyPage';
import { NeedPropertyPage } from './pages/NeedPropertyPage';

// Modals & Drawers & Notifications
import { QuickPreviewModal } from './components/QuickPreviewModal';
import { AddPropertyModal } from './components/AddPropertyModal';
import { InquiryModal } from './components/InquiryModal';
import { NeedRequestModal } from './components/NeedRequestModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import { NotificationToast } from './components/NotificationToast';
import { FirstVisitPromptModal } from './components/FirstVisitPromptModal';
import { EgyptianWelcomeFeedbackModal } from './components/EgyptianWelcomeFeedbackModal';
import { ActiveTab } from './components/BottomNav';

function MainApp() {
  const navigate = useNavigate();
  const location = useLocation();

  // Application Data State
  const [properties, setProperties] = useState<Property[]>(() => StorageService.getProperties());
  const [districts, setDistricts] = useState<LocationDistrict[]>(() => StorageService.getDistricts());
  const [favorites, setFavorites] = useState<string[]>(() => StorageService.getFavorites());
  const [isAdmin, setIsAdmin] = useState<boolean>(() => StorageService.isAdminLoggedIn());
  const [settings, setSettings] = useState<SystemSettings>(() => StorageService.getSettings());
  const [isLoadingApi, setIsLoadingApi] = useState(true);

  // Modal States
  const [selectedQuickPreviewProperty, setSelectedQuickPreviewProperty] = useState<Property | null>(null);
  const [selectedPropertyForInquiry, setSelectedPropertyForInquiry] = useState<Property | null>(null);
  const [selectedRoomForInquiry, setSelectedRoomForInquiry] = useState<DetailedRoom | undefined>(undefined);
  const [isQuickPreviewOpen, setIsQuickPreviewOpen] = useState(false);
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [isNeedModalOpen, setIsNeedModalOpen] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isFavoritesDrawerOpen, setIsFavoritesDrawerOpen] = useState(false);

  // Active Filters to pass to ListingPage
  const [listingFilters, setListingFilters] = useState<Partial<PropertyFilterState>>({});

  // Initial Load & Backend API Sync
  useEffect(() => {
    loadData();
    initializeFirebase();
  }, []);

  const loadData = async () => {
    // 1. Initial immediate local render
    setProperties(StorageService.getProperties());
    setDistricts(StorageService.getDistricts());
    setFavorites(StorageService.getFavorites());
    setIsAdmin(StorageService.isAdminLoggedIn());
    setSettings(StorageService.getSettings());

    // 2. Fetch live data from backend APIs
    try {
      const [backendProps, backendDistricts, backendSettings] = await Promise.allSettled([
        ApiService.getProperties(),
        ApiService.getLocations(),
        ApiService.getSettings(),
      ]);

      if (backendProps.status === 'fulfilled' && Array.isArray(backendProps.value) && backendProps.value.length > 0) {
        // Map backend properties if needed
        const mappedProps: Property[] = backendProps.value.map((p: any) => ({
          id: String(p.id),
          ref_id: p.ref_id || `SK-${p.id}`,
          title: p.title,
          description: p.description || '',
          price: Number(p.price) || 0,
          is_negotiable: Boolean(p.is_negotiable),
          rent_duration: p.rent_duration || 'monthly',
          operation_type: p.category?.slug === 'rent' || p.operation_type === 'rent' ? 'rent' : 'sale',
          property_type: p.property_type?.slug || p.property_type || 'apartment',
          location_id: String(p.location_id || p.location?.id || 'district-5'),
          district_name: p.location?.name || p.district_name || 'دمياط الجديدة',
          area: Number(p.area) || 120,
          rooms: Number(p.rooms) || 3,
          bathrooms: Number(p.bathrooms) || 2,
          floor: Number(p.floor) || 1,
          balconies: Number(p.balconies) || 1,
          finishing: p.finishing || 'super_lux',
          furnishing: p.furnishing || 'unfurnished',
          status: p.status || 'available',
          featured: Boolean(p.featured),
          views: Number(p.views) || 0,
          images: Array.isArray(p.images) && p.images.length > 0
            ? p.images.map((img: any) => typeof img === 'string' ? img : (img.image_url || img.url || img.image_path)).filter(Boolean)
            : (p.image_url ? [p.image_url] : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80']),
          video_url: p.video_url,
          amenities: Array.isArray(p.amenities)
            ? p.amenities.map((a: any) => typeof a === 'string' ? a : a.slug || a.name || a.id)
            : [],
          tags: Array.isArray(p.tags)
            ? p.tags.map((t: any) => typeof t === 'string' ? t : t.name)
            : [],
          has_detailed_rooms: Boolean(p.has_detailed_rooms),
          detailed_rooms: Array.isArray(p.detailed_rooms || p.detailedRooms)
            ? (p.detailed_rooms || p.detailedRooms).map((r: any) => ({
                id: String(r.id),
                property_id: String(p.id),
                name: r.name,
                price: Number(r.price),
                area: Number(r.area),
                description: r.description || '',
                status: r.status || 'available',
                imageUrl: r.room_images?.[0]?.image_url || r.primary_image?.image_url || r.primary_image?.url || r.imageUrl,
                images: r.room_images?.map((img: any) => img.image_url) || [],
              }))
            : [],
          created_at: p.created_at || new Date().toISOString(),
        }));

        setProperties(mappedProps);
      }

      if (backendDistricts.status === 'fulfilled' && Array.isArray(backendDistricts.value) && backendDistricts.value.length > 0) {
        const mappedDistricts: LocationDistrict[] = backendDistricts.value.map((d: any) => ({
          id: String(d.id),
          name: d.name,
          available_count: Number(d.available_count) || 0,
          image_url: d.image_url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
          description: d.address || d.description || '',
          coordinates: (d.latitude && d.longitude) ? { lat: Number(d.latitude), lng: Number(d.longitude) } : undefined,
        }));
        setDistricts(mappedDistricts);
      }

      if (backendSettings.status === 'fulfilled' && backendSettings.value && typeof backendSettings.value === 'object') {
        setSettings((prev) => ({ ...prev, ...backendSettings.value }));
      }
    } catch (err) {
      // Local fallback active
    } finally {
      setIsLoadingApi(false);
    }
  };

  const handleToggleFavorite = (propertyId: string) => {
    StorageService.toggleFavorite(propertyId);
    setFavorites(StorageService.getFavorites());
  };

  // Quick Preview Modal Handler (Card body click)
  const handleQuickPreview = (property: Property) => {
    StorageService.incrementViews(property.id);
    setSelectedQuickPreviewProperty(property);
    setIsQuickPreviewOpen(true);
  };

  // Navigate to full property details
  const handleSelectProperty = (property: Property) => {
    navigate(`/properties/${property.id}`);
  };

  const handleOpenInquiryFromProperty = (property: Property, room?: DetailedRoom) => {
    setSelectedPropertyForInquiry(property);
    setSelectedRoomForInquiry(room);
    setIsInquiryModalOpen(true);
  };

  const handleSelectDistrict = (districtId: string) => {
    navigate(`/properties?district=${encodeURIComponent(districtId)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (type: PropertyType) => {
    navigate(`/properties?type=${encodeURIComponent(type)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectDiscovery = (discoveryId: string, params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    navigate(`/properties?${qs}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHeroSearch = (filters: {
    operation: OperationType;
    district: string;
    type: string;
    maxPrice: string;
    mode?: string;
    audience?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters.operation) params.set('operation', filters.operation);
    if (filters.district && filters.district !== 'all') params.set('district', filters.district);
    if (filters.type && filters.type !== 'all') params.set('type', filters.type);
    if (filters.maxPrice) params.set('max_price', filters.maxPrice);
    if (filters.mode && filters.mode !== 'all') params.set('mode', filters.mode);
    if (filters.audience && filters.audience !== 'all') params.set('audience', filters.audience);
    navigate(`/properties?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePropertyAdded = (newProp: Property) => {
    loadData();
  };

  const handleLogoutAdmin = () => {
    StorageService.setAdminLoggedIn(false);
    setIsAdmin(false);
    navigate('/');
  };

  // Determine active tab from current route for bottom nav and header
  const getCurrentTab = (): ActiveTab => {
    const path = location.pathname;
    if (path.startsWith('/properties')) return 'search';
    if (path.startsWith('/places')) return 'places';
    if (path.startsWith('/my-reservations') || path.startsWith('/reservations')) return 'reservations';
    if (path === '/sell') return 'sell';
    if (path === '/contact') return 'contact';
    if (path.startsWith('/admin')) return 'account';
    return 'home';
  };

  const handleSelectTab = (tab: ActiveTab) => {
    if (tab === 'favorites') {
      setIsFavoritesDrawerOpen(true);
    } else if (tab === 'account') {
      if (isAdmin) {
        navigate('/admin/dashboard');
      } else {
        setIsAdminLoginModalOpen(true);
      }
    } else if (tab === 'home') {
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'search') {
      navigate('/properties');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'places') {
      navigate('/places');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'reservations') {
      navigate('/my-reservations');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'sell') {
      navigate('/sell');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'contact') {
      navigate('/contact');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <Routes>
        {/* Dedicated Admin Login Route */}
        <Route 
          path="/admin/login" 
          element={
            <AdminLoginPage 
              onLoginSuccess={() => {
                setIsAdmin(true);
                loadData();
              }} 
            />
          } 
        />

        {/* Dedicated Admin Area (Completely separate layout with individual routes) */}
        <Route
          path="/admin"
          element={
            isAdmin ? (
              <AdminLayout
                onOpenAddProperty={() => setIsAddPropertyModalOpen(true)}
                onLogout={handleLogoutAdmin}
              />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage onOpenAddProperty={() => navigate('/admin/properties/create')} />} />
          <Route path="properties" element={<AdminPropertiesPage onOpenAddProperty={() => navigate('/admin/properties/create')} />} />
          <Route path="properties/create" element={<AdminPropertyFormPage />} />
          <Route path="properties/edit/:id" element={<AdminPropertyFormPage />} />
          <Route path="properties/:id/edit" element={<AdminPropertyFormPage />} />
          <Route path="properties/show/:id" element={<AdminPropertyDetailPage />} />
          <Route path="properties/view/:id" element={<AdminPropertyDetailPage />} />
          <Route path="properties/:id" element={<AdminPropertyDetailPage />} />
          <Route path="property-submissions" element={<AdminPropertySubmissionsPage />} />
          <Route path="submissions" element={<Navigate to="/admin/property-submissions" replace />} />
          <Route path="reservations" element={<AdminReservationsPage />} />
          <Route path="inquiries" element={<Navigate to="/admin/reservations" replace />} />
          <Route path="need-requests" element={<AdminNeedRequestsPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="marketing" element={<AdminMarketingMailPage />} />
          <Route path="contact-messages" element={<AdminContactMessagesPage />} />
          <Route path="locations" element={<AdminLocationsPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="property-types" element={<Navigate to="/admin/categories" replace />} />
          <Route path="tags" element={<AdminTagsPage />} />
          <Route path="amenities" element={<AdminAmenitiesPage />} />
          <Route path="statistics" element={<AdminStatisticsPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="content" element={<AdminWebsiteContentPage />} />
          <Route path="cms" element={<Navigate to="/admin/content" replace />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* Public Website Routes */}
        <Route
          path="/"
          element={
            <PublicLayout
              currentTab={getCurrentTab()}
              onSelectTab={handleSelectTab}
              favoritesCount={favorites.length}
              isAdmin={isAdmin}
              onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
              onLogoutAdmin={handleLogoutAdmin}
              onOpenNeedModal={() => navigate('/need-property')}
            />
          }
        >
          {/* Home Page */}
          <Route
            index
            element={
              <HomePage
                properties={properties}
                districts={districts}
                favorites={favorites}
                settings={settings}
                isLoading={isLoadingApi}
                onToggleFavorite={handleToggleFavorite}
                onSelectProperty={handleSelectProperty}
                onQuickPreview={handleQuickPreview}
                onSelectDistrict={handleSelectDistrict}
                onSelectCategory={handleSelectCategory}
                onSelectDiscovery={handleSelectDiscovery}
                onNavigateTab={handleSelectTab}
                onSearchWithFilter={handleHeroSearch}
                onOpenNeedModal={() => navigate('/need-property')}
              />
            }
          />

          {/* Listing / Search Page */}
          <Route
            path="properties"
            element={
              <ListingPage
                properties={properties}
                favorites={favorites}
                districts={districts}
                initialFilters={listingFilters}
                onToggleFavorite={handleToggleFavorite}
                onSelectProperty={handleSelectProperty}
                onQuickPreview={handleQuickPreview}
                onOpenAddProperty={() => setIsAddPropertyModalOpen(true)}
                onOpenNeedModal={() => navigate('/need-property')}
              />
            }
          />

          {/* Dedicated Full Property Details Page */}
          <Route
            path="properties/:id"
            element={
              <PropertyDetailsPage
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onOpenInquiry={handleOpenInquiryFromProperty}
              />
            }
          />

          {/* Places & Districts Guide Page */}
          <Route
            path="places"
            element={<PlacesPage districts={districts} properties={properties} />}
          />
          <Route path="locations" element={<Navigate to="/places" replace />} />
          <Route path="districts" element={<Navigate to="/places" replace />} />

          {/* Add Property Page (Dedicated Public Page) */}
          <Route path="add-property" element={<AddPropertyPage />} />
          <Route path="sell" element={<AddPropertyPage />} />

          {/* Need Property Request Page (Dedicated Full Page) */}
          <Route path="need-property" element={<NeedPropertyPage />} />
          <Route path="need" element={<Navigate to="/need-property" replace />} />
          <Route path="request-property" element={<Navigate to="/need-property" replace />} />

          {/* Customer Reservations History & Tracking Page */}
          <Route
            path="my-reservations"
            element={<MyReservationsPage />}
          />
          <Route
            path="reservations"
            element={<Navigate to="/my-reservations" replace />}
          />

          {/* About / Contact Page */}
          <Route
            path="contact"
            element={<AboutContactPage />}
          />

          {/* Catch-all redirects to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      {/* ---------------- MODALS & DRAWERS (Global) ---------------- */}

      {/* Quick Preview Modal (Triggered by card body click) */}
      {isQuickPreviewOpen && selectedQuickPreviewProperty && (
        <QuickPreviewModal
          property={selectedQuickPreviewProperty}
          isOpen={isQuickPreviewOpen}
          isFavorite={favorites.includes(selectedQuickPreviewProperty.id)}
          onClose={() => {
            setIsQuickPreviewOpen(false);
            setSelectedQuickPreviewProperty(null);
          }}
          onOpenFullDetails={(prop) => {
            setIsQuickPreviewOpen(false);
            navigate(`/properties/${prop.id}`);
          }}
          onToggleFavorite={handleToggleFavorite}
          onOpenInquiry={(prop) => {
            setIsQuickPreviewOpen(false);
            handleOpenInquiryFromProperty(prop);
          }}
        />
      )}

      {/* Add Property Modal */}
      <AddPropertyModal
        isOpen={isAddPropertyModalOpen}
        onClose={() => setIsAddPropertyModalOpen(false)}
        onPropertyAdded={handlePropertyAdded}
      />

      {/* Reservation / Inquiry Modal with 1-active-reservation per property rule */}
      <InquiryModal
        property={selectedPropertyForInquiry}
        selectedRoom={selectedRoomForInquiry}
        isOpen={isInquiryModalOpen}
        onClose={() => {
          setIsInquiryModalOpen(false);
          setSelectedRoomForInquiry(undefined);
        }}
        onRefreshInquiries={loadData}
      />

      {/* Custom Need Request Modal */}
      <NeedRequestModal
        isOpen={isNeedModalOpen}
        onClose={() => setIsNeedModalOpen(false)}
      />

      {/* Admin Login Modal (For header quick login) */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={() => {
          setIsAdmin(true);
          loadData();
          navigate('/admin/dashboard');
        }}
      />

      {/* Favorites Drawer */}
      <FavoritesDrawer
        isOpen={isFavoritesDrawerOpen}
        onClose={() => setIsFavoritesDrawerOpen(false)}
        favorites={favorites}
        properties={properties}
        onToggleFavorite={handleToggleFavorite}
        onSelectProperty={(prop) => {
          setIsFavoritesDrawerOpen(false);
          navigate(`/properties/${prop.id}`);
        }}
      />

      {/* Global Real-time Notification Toast */}
      <NotificationToast />

      {/* First Visit Egyptian Welcome & Acquisition Feedback */}
      <EgyptianWelcomeFeedbackModal />

      {/* First Visit PWA Install & Notification Permission Prompt */}
      <FirstVisitPromptModal />
    </>
  );
}

export function App() {
  return (
    <HashRouter>
      <MainApp />
    </HashRouter>
  );
}

export default App;
