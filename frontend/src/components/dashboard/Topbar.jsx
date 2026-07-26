import React from "react";
import { Bell, CalendarDays, UserCircle2, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { COFFEE } from "../../constants/constants";

function Topbar({ unreadCount = 0, onToggleSidebar }) {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header
      className="bg-white border-b border-stone-200 flex items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4 lg:px-8"
      dir="rtl"
    >
      {/* يمين */}
      <div className="flex items-center gap-3">
        {/* Hamburger (mobile only) */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center hover:bg-stone-100 transition shrink-0"
        >
          <Menu size={22} style={{ color: COFFEE.dark }} />
        </button>
        <div className="flex flex-col gap-1.5 min-w-0">
          <h1
            className="text-lg md:text-2xl font-extrabold leading-relaxed truncate"
            style={{ color: COFFEE.dark }}
          >
            لوحة التحكم
          </h1>
          <div className="hidden sm:flex items-center gap-2 text-sm text-stone-500">
            <CalendarDays size={16} className="shrink-0" />
            <span>{today}</span>
          </div>
        </div>
      </div>

      {/* شمال */}
      <div className="flex items-center gap-3 md:gap-6">
        {/* إشعارات */}
        <button
          onClick={() => navigate("/dashboard/notifications")}
          className="relative w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center shrink-0 transition hover:bg-stone-100"
          title="الإشعارات"
        >
          <Bell size={20} />

          {unreadCount > 0 && (
            <span
              className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full ring-2 ring-white animate-pulse"
              style={{ backgroundColor: "#e0435c" }}
            />
          )}
        </button>

        {/* فاصل */}
        <div className="w-px h-9 bg-stone-200 shrink-0 hidden sm:block" />

        {/* بيانات الأدمن */}
        <div className="hidden sm:flex items-center gap-3">
          <UserCircle2
            size={42}
            className="shrink-0"
            style={{ color: COFFEE.gold }}
          />

          <div className="text-right leading-tight">
            <h3
              className="font-bold"
              style={{ color: COFFEE.dark }}
            >
              Admin
            </h3>

            <p className="text-xs text-stone-500 mt-0.5">
              مدير النظام
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
