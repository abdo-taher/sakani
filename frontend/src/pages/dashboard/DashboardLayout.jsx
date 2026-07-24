import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "../../components/dashboard/Sidebar";
import Topbar from "../../components/dashboard/Topbar";
import useIdleLogout from "../../hooks/useIdleLogout";
import { ADMIN_LOGIN_TOKEN } from "../../constants/constants";
function DashboardLayout() {
  useIdleLogout();
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");

if (!token) {
  return <Navigate to={`/admin/${ADMIN_LOGIN_TOKEN}/login`} replace />;
}
  return (
    <div
      className="min-h-screen flex"
      dir="rtl"
      style={{ backgroundColor: "#F8F6F2" }}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />

     <main className="flex-1 overflow-y-auto px-8 py-8">
    <Outlet />
</main>
      </div>
    </div>
  );
}

export default DashboardLayout;