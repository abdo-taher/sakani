import { Routes, Route } from "react-router-dom";
import { useParams } from "react-router-dom";

import Home from "../pages/Home";
import Need from "../pages/Need";
import Sell from "../pages/Sell";
import Buy from "../pages/Buy";
import Rent from "../pages/Rent";
import Contact from "../pages/Contact";
import AdminLogin from "../pages/AdminLogin";
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import Properties from "../pages/dashboard/Properties";
import DashboardLayout from "../pages/dashboard/DashboardLayout";
import Locations from "../pages/dashboard/Locations";
import Categories from "../pages/dashboard/Categories";
import CategoryDetails from "../pages/dashboard/CategoryDetails";
import Reservations from "../pages/dashboard/Reservations";
import Statistics from "../pages/dashboard/Statistics";
import Settings from "../pages/dashboard/Settings";
import ProtectedRoute from "../components/ProtectedRoute";
import ContactMessages from "../pages/dashboard/ContactMessages";
import MarketingMail from "../pages/dashboard/MarketingMail";
import Notifications from "../pages/dashboard/Notifications";
import NotFound from "../pages/NotFound";
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
  setUnreadCount,
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

      <Route path="/contact" element={<Contact />} />

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
  path="locations"
  element={<Locations />}
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
  element={<Notifications setUnreadCount={setUnreadCount} />}
/>
      </Route>

      <Route path="*" element={<NotFound />} />
  
    </Routes>
    
  );


}

export default AppRoutes;