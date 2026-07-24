import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "../../components/dashboard/Sidebar";
import Topbar from "../../components/dashboard/Topbar";
import useIdleLogout from "../../hooks/useIdleLogout";
import { ADMIN_LOGIN_TOKEN } from "../../constants/constants";
import { useState, useEffect, useRef, useCallback } from "react";
import { getUnreadCount } from "../../services/notificationService";

function DashboardLayout() {
  useIdleLogout();
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = useRef(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const notifSound = new Audio("/notification.wav");
    notifSound.volume = 0.5;
    audioRef.current = notifSound;

    const fetchCount = async () => {
      try {
        const res = await getUnreadCount();
        if (res?.unread_count !== undefined) {
          const newCount = res.unread_count;
          if (newCount > prevCountRef.current && prevCountRef.current >= 0) {
            try { notifSound.play(); } catch {}
          }
          prevCountRef.current = newCount;
          setUnreadCount(newCount);
        }
      } catch {}
    };

    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, [token]);

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
        <Topbar unreadCount={unreadCount} />

     <main className="flex-1 overflow-y-auto px-8 py-8">
    <Outlet />
</main>
      </div>
    </div>
  );
}

export default DashboardLayout;