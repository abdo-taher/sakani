import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";
import { ADMIN_LOGIN_TOKEN } from "../../constants/constants";
import {
  LayoutDashboard,
  Building2,
  FolderTree,
  MapPinned,
  ClipboardList,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Mail,
} from "lucide-react";
import { COFFEE } from "../../constants/constants";

const menuItems = [
  {
    title: "الرئيسية",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    title: "إدارة العقارات",
    icon: Building2,
    path: "/dashboard/properties",
  },
  {
    title: "إدارة الأقسام",
    icon: FolderTree,
    path: "/dashboard/categories",
  },
  {
    title: "إدارة الأماكن",
    icon: MapPinned,
    path: "/dashboard/locations",
  },
  {
    title: "طلبات الحجز",
    icon: ClipboardList,
    path: "/dashboard/reservations",
  },
  {
  title: "رسائل التواصل",
  icon: MessageSquare,
  path: "/dashboard/contact-messages",
},
  {
    title: "البريد التسويقي",
    icon: Mail,
    path: "/dashboard/marketing-mail",
  },

  {
    title: "الإحصائيات",
    icon: BarChart3,
    path: "/dashboard/statistics",
  },
  {
    title: "الإعدادات",
    icon: Settings,
    path: "/dashboard/settings",
  },
];

function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside
      dir="rtl"
      className="w-72 min-h-screen shrink-0 flex flex-col border-l shadow-lg"
      style={{
        backgroundColor: COFFEE.dark,
        borderColor: "#3D3024",
      }}
    >
      {/* Logo */}
      <div
        className="border-b border-white/10"
        style={{ paddingRight: "28px", paddingLeft: "28px", paddingTop: "32px", paddingBottom: "32px" }}
      >
        <h1
          className="text-2xl font-extrabold leading-relaxed"
          style={{ color: COFFEE.gold }}
        >
          سكني
        </h1>

        <p className="text-sm text-white/50 mt-1.5">
          لوحة تحكم الأدمن
        </p>
      </div>

      {/* Menu */}
      <nav
        className="flex-1 space-y-2 overflow-y-auto"
        style={{ paddingTop: "24px", paddingBottom: "24px", paddingRight: "16px", paddingLeft: "16px" }}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-4 rounded-xl text-base font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-white font-bold shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
              style={({ isActive }) => ({
                paddingRight: "20px",
                paddingLeft: "20px",
                paddingTop: "14px",
                paddingBottom: "14px",
                ...(isActive ? { color: COFFEE.dark } : {}),
              })}
            >
              <Icon size={22} className="shrink-0" />
              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div
        className="border-t border-white/10"
        style={{ padding: "16px" }}
      >
        <button
  onClick={async () => {

    try {

      await logout();

    } catch (error) {

      console.log(error);

    } finally {

      sessionStorage.clear();

      window.location.href = `/admin/${ADMIN_LOGIN_TOKEN}/login`;

    }

  }}
          className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
          style={{
            backgroundColor: COFFEE.gold,
            color: COFFEE.dark,
            paddingTop: "12px",
            paddingBottom: "12px",
          }}
        >
          <LogOut size={18} className="shrink-0" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;