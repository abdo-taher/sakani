import { Routes, Route } from "react-router-dom";
import { useParams } from "react-router-dom";

import Home from "../pages/Home";
import Need from "../pages/Need";
import Sell from "../pages/Sell";
import Buy from "../pages/Buy";
import Rent from "../pages/Rent";
import RentLocation from "../pages/RentLocation";
import BuyRequestForm from "../components/BuyRequestForm";
import RentRequestForm from "../components/RentRequestForm";
import Contact from "../pages/Contact";
import AdminLogin from "../pages/AdminLogin";
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import Properties from "../pages/dashboard/Properties";
import DashboardLayout from "../pages/dashboard/DashboardLayout";
import Locations from "../pages/dashboard/Locations";
import Categories from "../pages/dashboard/Categories";
import CategoryDetails from "../pages/dashboard/CategoryDetails";
import PropertyDetail from "../pages/dashboard/PropertyDetail";
import CreateRoomPage from "../pages/dashboard/CreateRoomPage";
import EditRoomPage from "../pages/dashboard/EditRoomPage";
import PropertyCreate from "../pages/dashboard/PropertyCreate";
import PropertyEdit from "../pages/dashboard/PropertyEdit";
import FeatureManager from "../components/properties/FeatureManager";
import Reservations from "../pages/dashboard/Reservations";
import Statistics from "../pages/dashboard/Statistics";
import Settings from "../pages/dashboard/Settings";
import ProtectedRoute from "../components/ProtectedRoute";
import ContactMessages from "../pages/dashboard/ContactMessages";
import MarketingMail from "../pages/dashboard/MarketingMail";
import Notifications from "../pages/dashboard/Notifications";
import Tags from "../pages/dashboard/Tags";
import NotFound from "../pages/NotFound";
import PublicPropertyDetail from "../pages/PublicPropertyDetail";
import EnhancingExperience from "../pages/EnhancingExperience";
import { ADMIN_LOGIN_TOKEN } from "../constants/constants";
import { Navigate } from "react-router-dom";

function AdminLoginGuard({ children }) {
  const { token } = useParams();
  if (token !== ADMIN_LOGIN_TOKEN) {
    return <Navigate to="/" replace />;
  }
  return children;
}
function AppRoutes({
  properties,
  favorites,
  onToggleFav,
  onOpen,
  addProperty,
  updateProperty,
  deleteProperty,
}) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Home
            properties={properties}
            favorites={favorites}
            onToggleFav={onToggleFav}
            onOpen={onOpen}
          />
        }
      />

      <Route path="/need" element={<Need />} />
      <Route path="/buy-request" element={<BuyRequestForm />} />
      <Route path="/rent-request" element={<RentRequestForm />} />

      <Route
        path="/sell"
        element={
          <Sell
            properties={properties}
            favorites={favorites}
            onToggleFav={onToggleFav}
            onOpen={onOpen}
          />
        }
      />

      <Route
        path="/buy"
        element={
          <Buy
            properties={properties}
            favorites={favorites}
            onToggleFav={onToggleFav}
            onOpen={onOpen}
          />
        }
      />

      <Route
        path="/rent"
        element={
          <Rent
            properties={properties}
            favorites={favorites}
            onToggleFav={onToggleFav}
            onOpen={onOpen}
          />
        }
      />

      <Route
        path="/rent/:locationId"
        element={
          <RentLocation
            favorites={favorites}
            onToggleFav={onToggleFav}
          />
        }
      />

      <Route path="/contact" element={<Contact />} />

      <Route path="/property/:id" element={<PublicPropertyDetail />} />
      <Route path="/maintenance" element={<EnhancingExperience />} />
      <Route path="/updating" element={<EnhancingExperience />} />

      <Route path="/admin/:token/login" element={
        <AdminLoginGuard>
          <AdminLogin />
        </AdminLoginGuard>
      } />

      
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  }
>

  <Route
    index
    element={
      <AdminDashboard
        properties={properties}
        addProperty={addProperty}
        deleteProperty={deleteProperty}
      />
    }
  />

  <Route
    path="properties"
    element={
      <Properties
        properties={properties}
        addProperty={addProperty}
        updateProperty={updateProperty}
        deleteProperty={deleteProperty}
      />
    }
  />

  <Route
    path="properties/create"
    element={<PropertyCreate />}
  />

  <Route
    path="properties/:id/edit"
    element={<PropertyEdit />}
  />

  <Route
    path="properties/:id"
    element={<PropertyDetail />}
  />
  <Route
    path="properties/:id/rooms/create"
    element={<CreateRoomPage />}
  />
  <Route
    path="properties/:id/rooms/:roomId/edit"
    element={<EditRoomPage />}
  />
<Route
  path="locations"
  element={<Locations />}
/>
<Route
  path="tags"
  element={<Tags />}
/>
<Route
    path="categories"
    element={<Categories />}
/>

<Route
    path="categories/:id"
    element={<CategoryDetails />}
/>
<Route
    path="reservations"
    element={<Reservations />}
/>
<Route
    path="features"
    element={<FeatureManager />}
/>
<Route
    path="statistics"
    element={<Statistics />}
/>
<Route
    path="settings"
    element={<Settings />}
/>
<Route
  path="contact-messages"
  element={<ContactMessages />}
/>
<Route
  path="marketing-mail"
  element={<MarketingMail />}
/>
<Route
  path="notifications"
  element={<Notifications />}
/>
      </Route>

      <Route path="*" element={<NotFound />} />
  
    </Routes>
    
  );


}

export default AppRoutes;